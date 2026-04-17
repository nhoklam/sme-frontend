import axiosInstance from './axiosConfig';
import type { ApiResponse, PageResponse } from '../types';
import type {
    Supplier,
    CreateSupplierRequest,
    UpdateSupplierRequest,
} from '../types/index';

const supplierService = {
    getAll: async (params?: {
        keyword?: string;
        page?: number;
        size?: number;
    }): Promise<PageResponse<Supplier>> => {
        const query = new URLSearchParams();
        if (params?.keyword?.trim()) query.set('keyword', params.keyword.trim());
        query.set('page', String(params?.page ?? 0));
        query.set('size', String(params?.size ?? 20));

        const res = await axiosInstance.get<ApiResponse<PageResponse<Supplier>>>(
            `/suppliers?${query}`
        );
        return res.data.data;
    },

    // ── Lấy toàn bộ (dùng cho dropdown) ────────────────────────
    getAllSimple: async (): Promise<Supplier[]> => {
        const res = await axiosInstance.get<ApiResponse<PageResponse<Supplier>>>(
            '/suppliers?page=0&size=200'
        );
        return res.data.data?.content ?? [];
    },

    // ── Lấy chi tiết ────────────────────────────────────────────
    getById: async (id: string): Promise<Supplier> => {
        const res = await axiosInstance.get<ApiResponse<Supplier>>(`/suppliers/${id}`);
        return res.data.data;
    },

    // ── Tạo mới ─────────────────────────────────────────────────
    create: async (data: CreateSupplierRequest): Promise<Supplier> => {
        const res = await axiosInstance.post<ApiResponse<Supplier>>('/suppliers', data);
        return res.data.data;
    },

    // ── Cập nhật ────────────────────────────────────────────────
    update: async (id: string, data: UpdateSupplierRequest): Promise<Supplier> => {
        const res = await axiosInstance.put<ApiResponse<Supplier>>(`/suppliers/${id}`, data);
        return res.data.data;
    },

    // ── Kích hoạt / Vô hiệu hóa ─────────────────────────────────
    toggleActive: async (id: string, isActive: boolean): Promise<Supplier> => {
        const res = await axiosInstance.put<ApiResponse<Supplier>>(`/suppliers/${id}`, {
            isActive,
        });
        return res.data.data;
    },
};

export default supplierService;