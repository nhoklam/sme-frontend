// src/services/adjustmentService.ts
import axiosInstance from './axiosConfig';
import { ApiResponse, PageResponse, StockAdjustment } from '../types';

export interface AdjustItemPayload {
  productId: string;
  systemQty: number;
  actualQty: number;
  reason?: string;
  reasonType?: string;
}

export const adjustmentService = {
    getAll: async (params?: { page?: number; size?: number; status?: string; keyword?: string; warehouseId?: string }): Promise<PageResponse<StockAdjustment>> => {
        const query = new URLSearchParams();
        query.set('page', String(params?.page ?? 0));
        query.set('size', String(params?.size ?? 20));
        if (params?.status) query.set('status', params.status);
        if (params?.keyword) query.set('keyword', params.keyword);
        if (params?.warehouseId) query.set('warehouseId', params.warehouseId);
        const res = await axiosInstance.get<ApiResponse<PageResponse<StockAdjustment>>>(`/stock-adjustments?${query}`);
        return res.data.data;
    },

    getById: async (id: string): Promise<StockAdjustment> => {
        const res = await axiosInstance.get<ApiResponse<StockAdjustment>>(`/stock-adjustments/${id}`);
        return res.data.data;
    },

    create: async (data: { warehouseId: string; items: AdjustItemPayload[]; note?: string }): Promise<StockAdjustment> => {
        const res = await axiosInstance.post<ApiResponse<StockAdjustment>>('/stock-adjustments', data);
        return res.data.data;
    },

    submit: async (id: string): Promise<StockAdjustment> => {
        const res = await axiosInstance.post<ApiResponse<StockAdjustment>>(`/stock-adjustments/${id}/submit`);
        return res.data.data;
    },

    approve: async (id: string): Promise<StockAdjustment> => {
        const res = await axiosInstance.post<ApiResponse<StockAdjustment>>(`/stock-adjustments/${id}/approve`);
        return res.data.data;
    },

    reject: async (id: string, reason: string): Promise<StockAdjustment> => {
        const res = await axiosInstance.post<ApiResponse<StockAdjustment>>(`/stock-adjustments/${id}/reject`, { reason });
        return res.data.data;
    },

    cancel: async (id: string, reason: string): Promise<StockAdjustment> => {
        const res = await axiosInstance.post<ApiResponse<StockAdjustment>>(`/stock-adjustments/${id}/cancel`, { reason });
        return res.data.data;
    },
};
