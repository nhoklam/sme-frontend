import axiosInstance from './axiosConfig';
import { ApiResponse } from '../types';

export interface DiscountTier {
    minAmount: number;
    discountPct: number;
    label: string;
}

export interface DiscountRule {
    id: string;
    name: string;
    warehouseId?: string;
    isActive: boolean;
    maxCashierDiscountPct: number;
    tiers: DiscountTier[];
    createdAt: string;
}

export interface DiscountRuleRequest {
    name: string;
    warehouseId?: string;
    isActive?: boolean;
    maxCashierDiscountPct?: number;
    tiers: DiscountTier[];
}

export interface DiscountCalculation {
    totalAmount: number;
    discountPct: number;
    discountAmount: number;
    tierLabel?: string;
    ruleName?: string;
    nextTierMinAmount?: number;
    nextTierPct?: number;
    nextTierLabel?: string;
}

const discountRuleService = {
    getAll: async (): Promise<DiscountRule[]> => {
        const res = await axiosInstance.get<ApiResponse<DiscountRule[]>>('/discount-rules');
        return res.data.data ?? [];
    },

    create: async (data: DiscountRuleRequest): Promise<DiscountRule> => {
        const res = await axiosInstance.post<ApiResponse<DiscountRule>>('/discount-rules', data);
        return res.data.data;
    },

    update: async (id: string, data: DiscountRuleRequest): Promise<DiscountRule> => {
        const res = await axiosInstance.put<ApiResponse<DiscountRule>>(`/discount-rules/${id}`, data);
        return res.data.data;
    },

    delete: async (id: string): Promise<void> => {
        await axiosInstance.delete(`/discount-rules/${id}`);
    },

    calculate: async (totalAmount: number, warehouseId?: string): Promise<DiscountCalculation> => {
        const params: any = { totalAmount };
        if (warehouseId) params.warehouseId = warehouseId;
        const res = await axiosInstance.get<ApiResponse<DiscountCalculation>>('/discount-rules/calculate', { params });
        return res.data.data;
    },
};

export default discountRuleService;
