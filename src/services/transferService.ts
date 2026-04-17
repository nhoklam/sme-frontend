// src/services/transferService.ts
import axiosInstance from './axiosConfig';
import { ApiResponse, PageResponse, InternalTransfer } from '../types';

export const transferService = {
    // Lấy danh sách phiếu chuyển kho (có phân trang)
    getAll: async (params?: { page?: number; size?: number; status?: string; keyword?: string }): Promise<PageResponse<InternalTransfer>> => {
        const query = new URLSearchParams();
        query.set('page', String(params?.page ?? 0));
        query.set('size', String(params?.size ?? 20));
        if (params?.status) query.set('status', params.status);
        if (params?.keyword) query.set('keyword', params.keyword);

        const res = await axiosInstance.get<ApiResponse<PageResponse<InternalTransfer>>>(`/transfers?${query}`);
        return res.data.data;
    },

    // Lấy chi tiết phiếu chuyển theo ID
    getById: async (id: string): Promise<InternalTransfer> => {
        const res = await axiosInstance.get<ApiResponse<InternalTransfer>>(`/transfers/${id}`);
        return res.data.data;
    },

    // Tạo phiếu chuyển kho mới
    create: async (data: { fromWarehouseId: string; toWarehouseId: string; items: Array<{ productId: string; quantity: number }>; note?: string }): Promise<InternalTransfer> => {
        const res = await axiosInstance.post<ApiResponse<InternalTransfer>>('/transfers', data);
        return res.data.data;
    },

    // Cập nhật phiếu chuyển (chỉ khi còn ở trạng thái DRAFT)
    update: async (id: string, data: { toWarehouseId: string; items: Array<{ productId: string; quantity: number }>; note?: string }): Promise<InternalTransfer> => {
        const res = await axiosInstance.put<ApiResponse<InternalTransfer>>(`/transfers/${id}`, data);
        return res.data.data;
    },

    // Xác nhận xuất kho (chuyển trạng thái từ DRAFT → DISPATCHED)
    dispatch: async (id: string): Promise<InternalTransfer> => {
        const res = await axiosInstance.post<ApiResponse<InternalTransfer>>(`/transfers/${id}/dispatch`);
        return res.data.data;
    },

    // Xác nhận nhận hàng (chuyển trạng thái từ DISPATCHED → RECEIVED)
    receive: async (id: string, items?: Array<{ productId: string; receivedQty: number }>): Promise<InternalTransfer> => {
        const res = await axiosInstance.post<ApiResponse<InternalTransfer>>(`/transfers/${id}/receive`, items ? { items } : undefined);
        return res.data.data;
    },
};