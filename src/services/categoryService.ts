import axiosInstance from './axiosConfig';
import { Category, ApiResponse } from '../types';

export interface CategoryRequest {
    name: string;
    parentId?: string | null;
    description?: string;
    sortOrder?: number;
    isActive?: boolean;
}

const categoryService = {
    // Lấy tất cả danh mục
    getAll: async (): Promise<Category[]> => {
        const res = await axiosInstance.get<ApiResponse<Category[]>>('/categories');
        return res.data.data ?? [];
    },

    // Tạo danh mục mới
    create: async (data: CategoryRequest): Promise<Category> => {
        const res = await axiosInstance.post<ApiResponse<Category>>('/categories', data);
        return res.data.data;
    },

    // Cập nhật danh mục
    update: async (id: string, data: CategoryRequest): Promise<Category> => {
        const res = await axiosInstance.put<ApiResponse<Category>>(`/categories/${id}`, data);
        return res.data.data;
    },

    // Ẩn/kích hoạt danh mục (toggle isActive)
    toggleActive: async (id: string, isActive: boolean): Promise<Category> => {
        const res = await axiosInstance.put<ApiResponse<Category>>(`/categories/${id}`, { isActive });
        return res.data.data;
    },
};

export default categoryService;