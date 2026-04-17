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

    // ── Hàng chậm luân chuyển ────────────────────────────────────
    getDeadStock: async (days = 90, warehouseId?: string): Promise<DeadStockItem[]> => {
        const params = new URLSearchParams({ days: String(days) });
        if (warehouseId) params.set('warehouseId', warehouseId);

        const res = await axiosInstance.get<ApiResponse<DeadStockItem[]>>(
            `/reports/dead-stock?${params}`
        );
        return res.data.data ?? [];
    },
};

export default reportService;