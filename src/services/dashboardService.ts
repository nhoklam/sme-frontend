// src/services/dashboardService.ts
import axiosInstance from './axiosConfig';
import type { ApiResponse } from '../types';

export interface DashboardStats {
    todayRevenue: number;
    todayGrossProfit: number;
    todayInvoiceCount: number;
    pendingOrdersCount: number;
    lowStockCount: number;
    pendingShiftsCount: number;
}

export interface RevenueTrendPoint {
    date: string;
    revenue: number;
    orders: number;
}

const dashboardService = {
    // Lấy thống kê tổng quan dashboard
    getStats: async (warehouseId?: string): Promise<DashboardStats> => {
        const params = warehouseId ? `?warehouseId=${warehouseId}` : '';
        const res = await axiosInstance.get<ApiResponse<DashboardStats>>(`/dashboard/stats${params}`);
        return res.data.data;
    },

    // Lấy doanh thu 7 ngày gần nhất
    getRevenueTrend: async (warehouseId?: string): Promise<RevenueTrendPoint[]> => {
        const params = warehouseId ? `?warehouseId=${warehouseId}` : '';
        const res = await axiosInstance.get<ApiResponse<RevenueTrendPoint[]>>(`/dashboard/revenue-trend${params}`);
        return res.data.data ?? [];
    },
};

export default dashboardService;