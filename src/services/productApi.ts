import axiosInstance from './axiosInstance';
import { Product, ProductReview, PageData, ApiResponse } from '../types';

export const productApi = {
  getProducts: async (params: {
    keyword?: string;
    categoryId?: string;
    minPrice?: number;
    maxPrice?: number;
    isActive?: boolean;
    page?: number;
    size?: number;
    sort?: string;
  }) => {
    return axiosInstance.get<any, ApiResponse<PageData<Product>>>('/products', { params });
  },

  getById: async (id: string) => {
    return axiosInstance.get<any, ApiResponse<Product>>(`/products/${id}`);
  },

  getBySlug: async (slug: string) => {
    return axiosInstance.get<any, ApiResponse<Product>>(`/products/slug/${slug}`);
  },

  getFlashSale: async () => {
    return axiosInstance.get<any, ApiResponse<Product[]>>('/products/flash-sale');
  },

  getReviews: async (productId: string, page: number = 0, size: number = 5) => {
    return axiosInstance.get<any, ApiResponse<PageData<ProductReview>>>(`/products/${productId}/reviews`, {
      params: { page, size }
    });
  },

  createReview: async (productId: string, data: { orderId: string; rating: number; comment?: string; imageUrls?: string[] }) => {
    return axiosInstance.post<any, ApiResponse<ProductReview>>(`/products/${productId}/reviews`, data);
  }
};
