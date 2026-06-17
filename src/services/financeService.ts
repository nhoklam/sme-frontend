// src/services/financeService.ts
import axiosInstance from './axiosConfig';
import {
    CashbookTransaction, SupplierDebt, CreateCashbookEntryRequest,
    PaySupplierDebtRequest, ApiResponse, PageResponse, CodReconciliationResult
} from '../types';

const financeService = {
    // ── Cashbook ──────────────────────────────────────────────
    createEntry: async (data: CreateCashbookEntryRequest): Promise<CashbookTransaction> => {
        const res = await axiosInstance.post<ApiResponse<CashbookTransaction>>('/finance/cashbook', data);
        return res.data.data;
    },

    getBalance: async (warehouseId?: string): Promise<Record<string, number>> => {
        const params = warehouseId ? `?warehouseId=${warehouseId}` : '';
        const res = await axiosInstance.get<ApiResponse<Record<string, number>>>(`/finance/cashbook/balance${params}`);
        return res.data.data;
    },

    getTotalBalance: async (): Promise<number> => {
        const res = await axiosInstance.get<ApiResponse<number>>('/finance/cashbook/balance/total');
        return res.data.data;
    },

    getCashbook: async (from: string, to: string, warehouseId?: string): Promise<CashbookTransaction[]> => {
        const params = new URLSearchParams({ from, to });
        if (warehouseId) params.set('warehouseId', warehouseId);
        const res = await axiosInstance.get<ApiResponse<CashbookTransaction[]>>(`/finance/cashbook?${params}`);
        return res.data.data ?? [];
    },

    searchCashbook: async (params: {
        from: string;
        to: string;
        warehouseId?: string;
        fundType?: string;
        transactionType?: string;
        keyword?: string;
        page?: number;
        size?: number;
    }): Promise<PageResponse<CashbookTransaction>> => {
        const query = new URLSearchParams();
        query.set('from', params.from);
        query.set('to', params.to);
        if (params.warehouseId) query.set('warehouseId', params.warehouseId);
        if (params.fundType) query.set('fundType', params.fundType);
        if (params.transactionType) query.set('transactionType', params.transactionType);
        if (params.keyword) query.set('keyword', params.keyword);
        query.set('page', String(params.page ?? 0));
        query.set('size', String(params.size ?? 10));
        const res = await axiosInstance.get<ApiResponse<PageResponse<CashbookTransaction>>>(`/finance/cashbook/search?${query}`);
        return res.data.data;
    },

    // ── Supplier Debts ────────────────────────────────────────
    getSupplierDebts: async (warehouseId?: string): Promise<SupplierDebt[]> => {
        const params = warehouseId ? `?warehouseId=${warehouseId}` : '';
        const res = await axiosInstance.get<ApiResponse<SupplierDebt[]>>(`/finance/supplier-debts${params}`);
        return res.data.data ?? [];
    },

    getTotalOutstandingBySupplier: async (supplierId: string): Promise<number> => {
        const res = await axiosInstance.get<ApiResponse<number>>(`/finance/supplier-debts/supplier/${supplierId}/total`);
        return res.data.data ?? 0;
    },

    paySupplierDebt: async (data: PaySupplierDebtRequest): Promise<SupplierDebt> => {
        const res = await axiosInstance.post<ApiResponse<SupplierDebt>>('/finance/supplier-debts/pay', data);
        return res.data.data;
    },

    // ── COD Reconciliation ────────────────────────────────────
    reconcileCOD: async (
        items: Array<{ orderCode: string; amountReceived: number; shippingFee: number; shippingProvider: string }>,
        warehouseId: string
    ): Promise<CodReconciliationResult> => {
        const res = await axiosInstance.post<ApiResponse<CodReconciliationResult>>(
            `/finance/cod-reconciliation?warehouseId=${warehouseId}`,
            items
        );
        return res.data.data;
    },

    // ── Cashbook Summary — SUM tại DB level, thay thế .reduce() sai ở frontend ──
    // (Lý do xóa .reduce(): chỉ tính trên 1 trang data, không phải toàn bộ kỳ)
    getCashbookSummary: async (params: {
        from: string;
        to: string;
        warehouseId?: string;
        fundType?: string;
        transactionType?: string;
        keyword?: string;
    }): Promise<{ totalIn: number; totalOut: number }> => {
        const query = new URLSearchParams();
        query.set('from', params.from);
        query.set('to', params.to);
        if (params.warehouseId) query.set('warehouseId', params.warehouseId);
        if (params.fundType) query.set('fundType', params.fundType);
        if (params.transactionType) query.set('transactionType', params.transactionType);
        if (params.keyword) query.set('keyword', params.keyword);
        const res = await axiosInstance.get<ApiResponse<{ totalIn: number; totalOut: number }>>(`/finance/cashbook/search/summary?${query}`);
        return res.data.data;
    },

    // ── Supplier Debts Paged — thay thế fetch-all gây memory issue ──
    getSupplierDebtsPaged: async (params: {
        warehouseId?: string;
        search?: string;
        page?: number;
        size?: number;
    }): Promise<PageResponse<SupplierDebt>> => {
        const query = new URLSearchParams();
        if (params.warehouseId) query.set('warehouseId', params.warehouseId);
        if (params.search) query.set('search', params.search);
        query.set('page', String(params.page ?? 0));
        query.set('size', String(params.size ?? 20));
        const res = await axiosInstance.get<ApiResponse<PageResponse<SupplierDebt>>>(`/finance/supplier-debts/search?${query}`);
        return res.data.data;
    },

    // ── Supplier Debts Summary — SUM tại DB level, thay thế .reduce() sai ──
    // (Lý do xóa .reduce(): frontend cũ fetch toàn bộ list rồi tính, gây memory issue)
    getSupplierDebtSummary: async (params: {
        warehouseId?: string;
        search?: string;
    }): Promise<{ totalDebt: number; totalPaid: number; totalRemaining: number; suppliersWithDebtCount: number }> => {
        const query = new URLSearchParams();
        if (params.warehouseId) query.set('warehouseId', params.warehouseId);
        if (params.search) query.set('search', params.search);
        const res = await axiosInstance.get<ApiResponse<{ totalDebt: number; totalPaid: number; totalRemaining: number; suppliersWithDebtCount: number }>>(`/finance/supplier-debts/search/summary?${query}`);
        return res.data.data;
    },
};

export default financeService;