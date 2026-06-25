// src/services/purchaseService.ts
import axiosInstance from './axiosConfig';
import { ApiResponse, PageResponse, PurchaseOrder, CreatePurchaseOrderRequest } from '../types';

export interface ReceiveItem {
  productId: string;
  receivedQty: number;
  receiveNote?: string;
}

export const purchaseService = {
    getAll: async (params?: { page?: number; size?: number; status?: string }): Promise<PageResponse<PurchaseOrder>> => {
        const query = new URLSearchParams();
        query.set('page', String(params?.page ?? 0));
        query.set('size', String(params?.size ?? 20));
        if (params?.status) query.set('status', params.status);
        const res = await axiosInstance.get<ApiResponse<PageResponse<PurchaseOrder>>>(`/purchase-orders?${query}`);
        return res.data.data;
    },

    getById: async (id: string): Promise<PurchaseOrder> => {
        const res = await axiosInstance.get<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}`);
        return res.data.data;
    },

    getBySupplier: async (supplierId: string, params?: { page?: number; size?: number }): Promise<PageResponse<PurchaseOrder>> => {
        const query = new URLSearchParams();
        query.set('page', String(params?.page ?? 0));
        query.set('size', String(params?.size ?? 20));
        const res = await axiosInstance.get<ApiResponse<PageResponse<PurchaseOrder>>>(`/purchase-orders/supplier/${supplierId}?${query}`);
        return res.data.data;
    },

    create: async (data: CreatePurchaseOrderRequest): Promise<PurchaseOrder> => {
        const res = await axiosInstance.post<ApiResponse<PurchaseOrder>>('/purchase-orders', data);
        return res.data.data;
    },

    submit: async (id: string): Promise<PurchaseOrder> => {
        const res = await axiosInstance.post<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}/submit`);
        return res.data.data;
    },

    approve: async (id: string): Promise<PurchaseOrder> => {
        const res = await axiosInstance.post<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}/approve`);
        return res.data.data;
    },

    reject: async (id: string, reason: string): Promise<PurchaseOrder> => {
        const res = await axiosInstance.post<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}/reject`, { reason });
        return res.data.data;
    },

    receive: async (id: string, items: ReceiveItem[]): Promise<PurchaseOrder> => {
        const res = await axiosInstance.post<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}/receive`, items);
        return res.data.data;
    },

    cancel: async (id: string, reason?: string): Promise<PurchaseOrder> => {
        const res = await axiosInstance.post<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}/cancel`, { reason });
        return res.data.data;
    },
};
