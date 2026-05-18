// src/modules/customer/utils/productMapper.ts
// Chuyển đổi ProductResponse từ backend → format mà UI components đang sử dụng.
// Giúp tối thiểu thay đổi trên ProductCard, ProductListItem, ProductDetailPage, v.v.

import { ProductResponse } from '../../../types';

export interface DisplayProduct {
    id: string;
    title: string;
    author: string;
    publisher: string;
    year: number;
    price: number;
    oldPrice: number;
    rating: number;
    sold: number;
    stock: number;
    pages: number;
    category: string;
    categoryId: string;
    badge: string;
    description: string;
    img: string;
    images: string[];
    sku?: string;
    isbnBarcode?: string;
    weight?: number;
    unit?: string;
}

/**
 * Map ProductResponse (backend) → DisplayProduct (UI).
 * Các trường không có trong backend (rating, sold, author, ...) sẽ trả giá trị mặc định.
 */
export const mapToDisplayProduct = (p: ProductResponse): DisplayProduct => ({
    id: p.id,
    title: p.name,
    author: '',               // backend chưa có
    publisher: '',            // backend chưa có
    year: p.createdAt ? new Date(p.createdAt).getFullYear() : new Date().getFullYear(),
    price: p.retailPrice,
    oldPrice: 0,              // backend chưa có
    rating: 0,                // backend chưa có
    sold: 0,                  // backend chưa có
    stock: p.availableQuantity ?? 0,
    pages: 0,                 // backend chưa có
    category: p.categoryName ?? '',
    categoryId: p.categoryId,
    badge: '',                // backend chưa có
    description: p.description ?? '',
    img: p.imageUrl ?? '',
    images: p.imageUrls && p.imageUrls.length > 0 ? p.imageUrls : (p.imageUrl ? [p.imageUrl] : []),
    sku: p.sku,
    isbnBarcode: p.isbnBarcode,
    weight: p.weight,
    unit: p.unit,
});

/**
 * Map danh sách ProductResponse → DisplayProduct[]
 */
export const mapToDisplayProducts = (products: ProductResponse[]): DisplayProduct[] =>
    products.map(mapToDisplayProduct);
