// src/services/transferService.ts
import axiosInstance from './axiosConfig';
import { ApiResponse, PageResponse, InternalTransfer } from '../types';

export const transferService = {
    getAll: async (params?: { page?: number; size?: number; status?: string; keyword?: string }): Promise<PageResponse<InternalTransfer>> => {
        const query = new URLSearchParams();
        query.set('page', String(params?.page ?? 0));
        query.set('size', String(params?.size ?? 20));
        if (params?.status) query.set('status', params.status);
        if (params?.keyword) query.set('keyword', params.keyword);
        const res = await axiosInstance.get<ApiResponse<PageResponse<InternalTransfer>>>(`/transfers?${query}`);
        return res.data.data;
    },

    getById: async (id: string): Promise<InternalTransfer> => {
        const res = await axiosInstance.get<ApiResponse<InternalTransfer>>(`/transfers/${id}`);
        return res.data.data;
    },

    create: async (data: { fromWarehouseId: string; toWarehouseId: string; items: Array<{ productId: string; quantity: number }>; note?: string }): Promise<InternalTransfer> => {
        const res = await axiosInstance.post<ApiResponse<InternalTransfer>>('/transfers', data);
        return res.data.data;
    },

    update: async (id: string, data: { toWarehouseId: string; items: Array<{ productId: string; quantity: number }>; note?: string }): Promise<InternalTransfer> => {
        const res = await axiosInstance.put<ApiResponse<InternalTransfer>>(`/transfers/${id}`, data);
        return res.data.data;
    },

    submit: async (id: string): Promise<InternalTransfer> => {
        const res = await axiosInstance.post<ApiResponse<InternalTransfer>>(`/transfers/${id}/submit`);
        return res.data.data;
    },

    approve: async (id: string): Promise<InternalTransfer> => {
        const res = await axiosInstance.post<ApiResponse<InternalTransfer>>(`/transfers/${id}/approve`);
        return res.data.data;
    },

    reject: async (id: string, reason: string): Promise<InternalTransfer> => {
        const res = await axiosInstance.post<ApiResponse<InternalTransfer>>(`/transfers/${id}/reject`, { reason });
        return res.data.data;
    },

    dispatch: async (id: string): Promise<InternalTransfer> => {
        const res = await axiosInstance.post<ApiResponse<InternalTransfer>>(`/transfers/${id}/dispatch`);
        return res.data.data;
    },

    receive: async (id: string, items?: Array<{ productId: string; receivedQty: number; discrepancyReason?: string }>): Promise<InternalTransfer> => {
        const res = await axiosInstance.post<ApiResponse<InternalTransfer>>(`/transfers/${id}/receive`, items || []);
        return res.data.data;
    },

    rejectReceive: async (id: string, reason: string): Promise<InternalTransfer> => {
        const res = await axiosInstance.post<ApiResponse<InternalTransfer>>(`/transfers/${id}/reject-receive`, { reason });
        return res.data.data;
    },

    cancel: async (id: string, reason?: string): Promise<InternalTransfer> => {
        const res = await axiosInstance.post<ApiResponse<InternalTransfer>>(`/transfers/${id}/cancel`, reason ? { reason } : {});
        return res.data.data;
    },

    getByOrderId: async (orderId: string): Promise<InternalTransfer[]> => {
        const res = await axiosInstance.get<ApiResponse<InternalTransfer[]>>(`/transfers/order/${orderId}`);
        return res.data.data;
    },
};
