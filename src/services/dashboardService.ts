
import axiosInstance from './axiosConfig';
import type { ApiResponse } from '../types';
import reportService from './reportService';
import customerService from './customerService';
import inventoryService from './inventoryService';

export interface DashboardStats {
    todayRevenue: number;
    todayGrossProfit: number;
    todayInvoiceCount: number;
    pendingOrdersCount: number;
    lowStockCount: number;
    pendingShiftsCount: number;
    weekRevenue?: number;
    monthRevenue?: number;
    yearRevenue?: number;
    newCustomersCount?: number;
    expiringCount?: number;
    expiredCount?: number;
}

export interface RevenueTrendPoint {
    date: string;
    revenue: number;
    orders: number;
}

const dashboardService = {
    /**
     * Lấy thống kê tổng quan dashboard
     */
    getStats: async (warehouseId?: string): Promise<DashboardStats> => {
        const summary = await reportService.getSummary(warehouseId);
        
        // Tính doanh thu hôm nay
        const revenueToday = summary.revenueToday ?? [];
        const todayRevenue = revenueToday.reduce((s, d) => s + Number(d.revenue ?? 0), 0);
        const todayGrossProfit = revenueToday.reduce((s, d) => s + Number(d.gross_profit ?? 0), 0);
        const todayInvoiceCount = revenueToday.reduce((s, d) => s + Number(d.invoice_count ?? 0), 0);

        // Lấy thêm tồn kho thấp từ inventoryService để đồng bộ
        const lowStock = await inventoryService.getLowStock(warehouseId);

        return {
            todayRevenue,
            todayGrossProfit,
            todayInvoiceCount,
            pendingOrdersCount: 0, 
            lowStockCount: lowStock.length,
            pendingShiftsCount: 0,
        };
    },

    /**
     * Lấy doanh thu theo dải thời gian tùy chỉnh
     */
    getRevenueByRange: async (from: string, to: string, period: any = 'day', warehouseId?: string): Promise<RevenueTrendPoint[]> => {
        const data = await reportService.getRevenue({ from, to, period, warehouseId });
        return data.map(d => ({
            date: String(d.period ?? ''),
            revenue: Number(d.revenue ?? 0),
            orders: Number(d.invoice_count ?? 0),
        }));
    },

    /**
     * Lấy dữ liệu nâng cao cho dashboard mới
     */
    getExtendedStats: async (warehouseId?: string) => {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString();
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();

        // Gọi song song các mốc doanh thu
        const [todayData, weekData, monthData, yearData] = await Promise.all([
            reportService.getRevenue({ from: startOfDay, to: endOfDay, warehouseId }),
            reportService.getRevenue({ from: startOfWeek, to: endOfDay, warehouseId }),
            reportService.getRevenue({ from: startOfMonth, to: endOfDay, warehouseId }),
            reportService.getRevenue({ from: startOfYear, to: endOfDay, warehouseId }),
        ]);

        const sum = (arr: any[]) => arr.reduce((s, d) => s + Number(d.revenue ?? 0), 0);
        const sumOrders = (arr: any[]) => arr.reduce((s, d) => s + Number(d.invoice_count ?? 0), 0);

        return {
            todayRevenue: sum(todayData),
            todayOrders: sumOrders(todayData),
            weekRevenue: sum(weekData),
            monthRevenue: sum(monthData),
            yearRevenue: sum(yearData),
        };
    },

    getTopData: async (warehouseId?: string, periodStr: string = '30days', metric: string = 'revenue') => {
        const now = new Date();
        let days = 30;
        if (periodStr === 'last7days') days = 7;
        else if (periodStr === '90days') days = 90;
        else if (periodStr === 'thisYear') days = 365;

        const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
        const to = now.toISOString();
        
        let customerUrl = `/reports/top-customers?from=${from}&to=${to}&limit=10&metric=${metric}`;
        if (warehouseId) customerUrl += `&warehouseId=${warehouseId}`;

        const [products, customersRes] = await Promise.all([
            reportService.getTopProducts({ from, to, warehouseId, limit: 10 }),
            axiosInstance.get<ApiResponse<any[]>>(customerUrl)
        ]);

        const rawProducts = Array.isArray(products) ? products : [];
        const rawCustomers = customersRes.data.data || [];

        return {
            topProducts: rawProducts.map((p: any) => {
                const sold = p.total_sold !== undefined ? p.total_sold : (p.totalSold !== undefined ? p.totalSold : 0);
                const rev = p.total_revenue !== undefined ? p.total_revenue : (p.totalRevenue !== undefined ? p.totalRevenue : 0);
                return {
                    productName: String(p.name || p.productName || ''),
                    totalSold: Number(sold),
                    totalRevenue: Number(rev),
                };
            }),
            topCustomers: rawCustomers.map((c: any) => ({
                fullName: String(c.fullName || c.fullname || c.full_name || 'Khách hàng'),
                totalPurchase: Number(c.totalPurchase || c.totalpurchase || c.total_purchase || 0),
                totalOrders: Number(c.totalOrders || c.totalorders || c.total_orders || 0),
            })),
        };
    }
};

export default dashboardService;