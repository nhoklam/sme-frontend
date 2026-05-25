// src/services/shiftService.ts
import axiosInstance from './axiosConfig';
import { ApiResponse, PageResponse, ShiftResponse } from '../types';

export interface PosShift {
    id: string;
    warehouseId: string;
    warehouseName?: string;
    cashierId: string;
    cashierName?: string;
    startingCash: number;
    reportedCash?: number;
    theoreticalCash?: number;
    discrepancyAmount?: number;
    discrepancyReason?: string;
    status: 'OPEN' | 'CLOSED' | 'MANAGER_APPROVED';
    openedAt: string;
    closedAt?: string;
    approvedAt?: string;
    invoiceCount?: number;
    totalRevenue?: number;
}

const shiftService = {
    getAll: async (params: { page?: number; size?: number; warehouseId?: string }) => {
        const query = new URLSearchParams();
        if (params.page !== undefined) query.set('page', String(params.page));
        if (params.size !== undefined) query.set('size', String(params.size));
        if (params.warehouseId) query.set('warehouseId', params.warehouseId);

        const res = await axiosInstance.get<ApiResponse<PageResponse<PosShift>>>(`/pos/shifts?${query}`);
        return res.data.data;
    },

    getById: async (id: string) => {
        const res = await axiosInstance.get<ApiResponse<PosShift>>(`/pos/shifts/${id}`);
        return res.data.data;
    },

    getInvoicesByShift: async (shiftId: string, page = 0, size = 50) => {
        const res = await axiosInstance.get<ApiResponse<PageResponse<any>>>(`/pos/invoices?shiftId=${shiftId}&page=${page}&size=${size}`);
        return res.data.data;
    },

    openShift: async (warehouseId: string, startingCash: number) => {
        const res = await axiosInstance.post<ApiResponse<PosShift>>('/pos/shifts/open', { warehouseId, startingCash });
        return res.data.data;
    },

    closeShift: async (shiftId: string, reportedCash: number, discrepancyReason?: string) => {
        const res = await axiosInstance.post<ApiResponse<PosShift>>('/pos/shifts/close', { shiftId, reportedCash, discrepancyReason });
        return res.data.data;
    },

    approveShift: async (id: string) => {
        const res = await axiosInstance.post<ApiResponse<PosShift>>(`/pos/shifts/${id}/approve`);
        return res.data.data;
    }
};

export default shiftService;
