
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
    /**
     * Lấy thống kê tổng quan dashboard
     * Sử dụng /reports/summary (backend thực tế)
     */
    getStats: async (warehouseId?: string): Promise<DashboardStats> => {
        const params = warehouseId ? `?warehouseId=${warehouseId}` : '';
        const res = await axiosInstance.get<ApiResponse<any>>(`/reports/summary${params}`);
        const data = res.data.data ?? {};

        // Tính toán từ mảng revenueToday
        const revenueToday: any[] = data.revenueToday ?? [];
        const todayRevenue = revenueToday.reduce((s: number, d: any) => s + Number(d.revenue ?? 0), 0);
        const todayGrossProfit = revenueToday.reduce((s: number, d: any) => s + Number(d.gross_profit ?? 0), 0);
        const todayInvoiceCount = revenueToday.reduce((s: number, d: any) => s + Number(d.invoice_count ?? 0), 0);

        return {
            todayRevenue,
            todayGrossProfit,
            todayInvoiceCount,
            pendingOrdersCount: 0, // Lấy riêng từ orders API
            lowStockCount: Number(data.lowStockCount ?? 0),
            pendingShiftsCount: 0, // Lấy riêng từ shifts API
        };
    },

    /**
     * Lấy doanh thu 7 ngày gần nhất
     * Sử dụng /reports/revenue (backend thực tế)
     */
    getRevenueTrend: async (warehouseId?: string): Promise<RevenueTrendPoint[]> => {
        const now = new Date();
        const from = new Date();
        from.setDate(now.getDate() - 6);

        const query = new URLSearchParams({
            from: from.toISOString(),
            to: now.toISOString(),
            period: 'day',
        });
        if (warehouseId) query.set('warehouseId', warehouseId);

        const res = await axiosInstance.get<ApiResponse<any[]>>(
            `/reports/revenue?${query}`
        );
        const rows = res.data.data ?? [];

        return rows.map((d: any) => ({
            date: String(d.period ?? ''),
            revenue: Number(d.revenue ?? 0),
            orders: Number(d.invoice_count ?? 0),
        }));
    },
};

export default dashboardService;