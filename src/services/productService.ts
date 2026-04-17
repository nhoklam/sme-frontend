// src/services/productService.ts
import axiosInstance from './axiosConfig';
import {
    ProductResponse,
    CreateProductRequest,
    UpdateProductRequest,
    PageResponse,
    ApiResponse,
} from '../types';

const productService = {
    // Tìm kiếm / lấy danh sách sản phẩm có phân trang
    search: async (params: {
        keyword?: string;
        categoryId?: string;
        isActive?: boolean;
        page?: number;
        size?: number;
    }): Promise<PageResponse<ProductResponse>> => {
        const query = new URLSearchParams();
        if (params.keyword?.trim()) query.set('keyword', params.keyword.trim());
        if (params.categoryId) query.set('categoryId', params.categoryId);
        if (params.isActive !== undefined) query.set('isActive', String(params.isActive));
        query.set('page', String(params.page ?? 0));
        query.set('size', String(params.size ?? 20));

        const res = await axiosInstance.get<ApiResponse<PageResponse<ProductResponse>>>(
            `/products?${query}`
        );
        return res.data.data;
    },

    // Lấy chi tiết sản phẩm theo ID
    getById: async (id: string): Promise<ProductResponse> => {
        const res = await axiosInstance.get<ApiResponse<ProductResponse>>(`/products/${id}`);
        return res.data.data;
    },

    // Lấy sản phẩm theo barcode (dùng cho POS)
    getByBarcode: async (barcode: string): Promise<ProductResponse> => {
        const res = await axiosInstance.get<ApiResponse<ProductResponse>>(
            `/products/barcode/${barcode}`
        );
        return res.data.data;
    },

    // Tạo sản phẩm mới
    create: async (data: CreateProductRequest): Promise<ProductResponse> => {
        const res = await axiosInstance.post<ApiResponse<ProductResponse>>('/products', data);
        return res.data.data;
    },

    // Cập nhật sản phẩm
    update: async (id: string, data: UpdateProductRequest): Promise<ProductResponse> => {
        const res = await axiosInstance.put<ApiResponse<ProductResponse>>(`/products/${id}`, data);
        return res.data.data;
    },
};

export default productService;