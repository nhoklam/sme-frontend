// src/services/purchaseService.ts
import axiosInstance from './axiosConfig';
import { ApiResponse, PageResponse, PurchaseOrder, CreatePurchaseOrderRequest } from '../types';

export const purchaseService = {
    // Lấy danh sách phiếu nhập kho (có phân trang)
    getAll: async (params?: { page?: number; size?: number; status?: string }): Promise<PageResponse<PurchaseOrder>> => {
        const query = new URLSearchParams();
        query.set('page', String(params?.page ?? 0));
        query.set('size', String(params?.size ?? 20));
        if (params?.status) query.set('status', params.status);

        const res = await axiosInstance.get<ApiResponse<PageResponse<PurchaseOrder>>>(`/purchase-orders?${query}`);
        return res.data.data;
    },

    // Lấy chi tiết phiếu nhập theo ID
    getById: async (id: string): Promise<PurchaseOrder> => {
        const res = await axiosInstance.get<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}`);
        return res.data.data;
    },

    // Lấy phiếu nhập theo nhà cung cấp
    getBySupplier: async (supplierId: string, params?: { page?: number; size?: number }): Promise<PageResponse<PurchaseOrder>> => {
        const query = new URLSearchParams();
        query.set('page', String(params?.page ?? 0));
        query.set('size', String(params?.size ?? 20));

        const res = await axiosInstance.get<ApiResponse<PageResponse<PurchaseOrder>>>(`/purchase-orders/supplier/${supplierId}?${query}`);
        return res.data.data;
    },

    // Tạo phiếu nhập kho mới
    create: async (data: CreatePurchaseOrderRequest): Promise<PurchaseOrder> => {
        const res = await axiosInstance.post<ApiResponse<PurchaseOrder>>('/purchase-orders', data);
        return res.data.data;
    },

    // Duyệt phiếu nhập kho
    approve: async (id: string): Promise<PurchaseOrder> => {
        const res = await axiosInstance.post<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}/approve`);
        return res.data.data;
    },

    // Hủy phiếu nhập kho
    cancel: async (id: string, reason?: string): Promise<PurchaseOrder> => {
        const res = await axiosInstance.post<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}/cancel`, { reason });
        return res.data.data;
    },
};