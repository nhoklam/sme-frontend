import axiosInstance from './axiosConfig';
import type { ApiResponse, PageResponse, Warehouse } from '../types';

const warehouseService = {
    // ── Lấy danh sách kho (dùng cho dropdown) ──────────────────
    getAll: async (): Promise<Warehouse[]> => {
        const res = await axiosInstance.get<ApiResponse<PageResponse<Warehouse>>>(
            '/warehouses?page=0&size=100&isActive=true'
        );
        // Backend có thể trả về PageResponse hoặc Warehouse[] trực tiếp
        const data = res.data.data;
        if (Array.isArray(data)) return data;
        return (data as PageResponse<Warehouse>)?.content ?? [];
    },

    // ── Lấy danh sách có phân trang ─────────────────────────────
    getAllPaged: async (params?: {
        keyword?: string;
        page?: number;
        size?: number;
        isActive?: boolean;
    }): Promise<PageResponse<Warehouse>> => {
        const query = new URLSearchParams();
        if (params?.keyword?.trim()) query.set('keyword', params.keyword.trim());
        query.set('page', String(params?.page ?? 0));
        query.set('size', String(params?.size ?? 20));
        if (params?.isActive !== undefined) query.set('isActive', String(params.isActive));

        const res = await axiosInstance.get<ApiResponse<PageResponse<Warehouse>>>(
            `/warehouses?${query}`
        );
        return res.data.data;
    },

    // ── Lấy chi tiết ─────────────────────────────────────────────
    getById: async (id: string): Promise<Warehouse> => {
        const res = await axiosInstance.get<ApiResponse<Warehouse>>(`/warehouses/${id}`);
        return res.data.data;
    },

    // ── Tạo mới ──────────────────────────────────────────────────
    create: async (data: {
        name: string;
        address?: string;
        phone?: string;
        managerId?: string;
    }): Promise<Warehouse> => {
        const res = await axiosInstance.post<ApiResponse<Warehouse>>('/warehouses', data);
        return res.data.data;
    },

    // ── Cập nhật ─────────────────────────────────────────────────
    update: async (id: string, data: Partial<{
        name: string;
        address: string;
        phone: string;
        managerId: string;
        isActive: boolean;
    }>): Promise<Warehouse> => {
        const res = await axiosInstance.put<ApiResponse<Warehouse>>(`/warehouses/${id}`, data);
        return res.data.data;
    },

    // ── Kích hoạt / Vô hiệu hóa ──────────────────────────────────
    toggleActive: async (id: string, isActive: boolean): Promise<Warehouse> => {
        const res = await axiosInstance.patch<ApiResponse<Warehouse>>(
            `/warehouses/${id}`,
            { isActive }
        );
        return res.data.data;
    },
};

export default warehouseService;