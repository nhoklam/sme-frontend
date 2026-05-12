// src/services/reportService.ts
import axiosInstance from './axiosConfig';
import type { ApiResponse } from '../types';
import type {
    RevenueDataPoint,
    TopProduct,
    InventoryValueReport,
    DeadStockItem,
    DashboardSummary,
    RevenueReportParams,
    TopProductParams,
} from '../types/index';

const reportService = {
    // ── Dashboard summary ────────────────────────────────────────
    getSummary: async (warehouseId?: string): Promise<DashboardSummary> => {
        const params = warehouseId ? `?warehouseId=${warehouseId}` : '';
        const res = await axiosInstance.get<ApiResponse<DashboardSummary>>(
            `/reports/summary${params}`
        );
        return res.data.data;
    },

    // ── Báo cáo doanh thu ────────────────────────────────────────
    getRevenue: async (params: RevenueReportParams): Promise<RevenueDataPoint[]> => {
        const query = new URLSearchParams({
            from: params.from,
            to: params.to,
            period: params.period ?? 'day',
        });
        if (params.warehouseId) query.set('warehouseId', params.warehouseId);
        if (params.paymentMethod) query.set('paymentMethod', params.paymentMethod);

        const res = await axiosInstance.get<ApiResponse<RevenueDataPoint[]>>(
            `/reports/revenue?${query}`
        );
        return res.data.data ?? [];
    },

    // ── Top sản phẩm bán chạy ────────────────────────────────────
    getTopProducts: async (params: TopProductParams): Promise<TopProduct[]> => {
        const query = new URLSearchParams({
            from: params.from,
            to: params.to,
            limit: String(params.limit ?? 10),
        });
        if (params.warehouseId) query.set('warehouseId', params.warehouseId);
        if (params.paymentMethod) query.set('paymentMethod', params.paymentMethod);

        const res = await axiosInstance.get<ApiResponse<TopProduct[]>>(
            `/reports/top-products?${query}`
        );
        return res.data.data ?? [];
    },

    // ── Báo cáo giá trị tồn kho ─────────────────────────────────
    getInventoryValue: async (warehouseId?: string): Promise<InventoryValueReport[]> => {
        const params = warehouseId ? `?warehouseId=${warehouseId}` : '';
        const res = await axiosInstance.get<ApiResponse<InventoryValueReport[]>>(
            `/reports/inventory-value${params}`
        );
        return res.data.data ?? [];
    },

    // ── Lấy danh sách hóa đơn cho báo cáo ──────────────────────────
    getInvoices: async (params: { from: string; to: string; warehouseId?: string; paymentMethod?: string; page?: number; size?: number }): Promise<{ content: any[], totalPages: number, totalElements: number }> => {
        const query = new URLSearchParams({
            from: params.from,
            to: params.to,
            page: String(params.page || 0),
            size: String(params.size || 10),
        });
        if (params.warehouseId) query.set('warehouseId', params.warehouseId);
        if (params.paymentMethod) query.set('paymentMethod', params.paymentMethod);

        const res = await axiosInstance.get<ApiResponse<{ content: any[], totalPages: number, totalElements: number }>>(
            `/pos/invoices?${query}`
        );
        return res.data.data ?? { content: [], totalPages: 0, totalElements: 0 };
    },

    // ── Hàng chậm luân chuyển ────────────────────────────────────
    getDeadStock: async (days = 90, warehouseId?: string): Promise<DeadStockItem[]> => {
        const params = new URLSearchParams({ days: String(days) });
        if (warehouseId) params.set('warehouseId', warehouseId);

        const res = await axiosInstance.get<ApiResponse<DeadStockItem[]>>(
            `/reports/dead-stock?${params}`
        );
        return res.data.data ?? [];
    },

    // ── Hiệu suất nhân viên ─────────────────────────────────────
    getEmployeePerformance: async (warehouseId?: string): Promise<any[]> => {
        const params = warehouseId ? `?warehouseId=${warehouseId}` : '';
        const res = await axiosInstance.get<ApiResponse<any[]>>(`/reports/employee-performance${params}`);
        return res.data.data ?? [];
    },

    // ── Phân tích khách hàng ─────────────────────────────────────
    getCustomerAnalysis: async (): Promise<any> => {
        const res = await axiosInstance.get<ApiResponse<any>>('/reports/customer-analysis');
        return res.data.data;
    },
};


export default reportService;