import axiosInstance from './axiosConfig';
import { Promotion, ApiResponse, PageResponse } from '../types';

/** Normalize backend response → frontend Promotion */
const normalize = (p: any): Promotion => ({
    ...p,
    type: p.discountType ?? p.type,
    minOrderAmount: p.minOrderValue ?? p.minOrderAmount,
});

const promotionService = {
    getAll: async (params: {
        page?: number;
        size?: number;
        isActive?: boolean;
        keyword?: string;
    }): Promise<PageResponse<Promotion>> => {
        const query = new URLSearchParams();
        if (params.page !== undefined) query.set('page', String(params.page));
        if (params.size !== undefined) query.set('size', String(params.size));
        if (params.keyword) query.set('keyword', params.keyword);

        const res = await axiosInstance.get<ApiResponse<PageResponse<Promotion>>>(`/promotions?${query}`);
        const data = res.data.data;
        return { ...data, content: (data.content ?? []).map(normalize) };
    },

    getActive: async (): Promise<Promotion[]> => {
        const res = await axiosInstance.get<ApiResponse<Promotion[]>>('/promotions/active');
        return (res.data.data ?? []).map(normalize);
    },

    getById: async (id: string): Promise<Promotion> => {
        const res = await axiosInstance.get<ApiResponse<Promotion>>(`/promotions/${id}`);
        return normalize(res.data.data);
    },

    create: async (data: Partial<Promotion>): Promise<Promotion> => {
        const res = await axiosInstance.post<ApiResponse<Promotion>>('/promotions', data);
        return normalize(res.data.data);
    },

    update: async (id: string, data: Partial<Promotion>): Promise<Promotion> => {
        const res = await axiosInstance.put<ApiResponse<Promotion>>(`/promotions/${id}`, data);
        return normalize(res.data.data);
    },

    delete: async (id: string): Promise<void> => {
        await axiosInstance.delete(`/promotions/${id}`);
    },

    toggleActive: async (id: string): Promise<void> => {
        await axiosInstance.patch(`/promotions/${id}/toggle`);
    },

    /** Validate mã KM, trả về số tiền giảm */
    validate: async (code: string, orderTotal: number): Promise<{ code: string; discountAmount: number; finalAmount: number }> => {
        console.log('[PromotionService] Validating:', { code, orderTotal, typeOfTotal: typeof orderTotal });
        try {
            const res = await axiosInstance.post<ApiResponse<{ code: string; discountAmount: number; finalAmount: number }>>(
                '/promotions/validate',
                { code, orderTotal }
            );
            return res.data.data;
        } catch (error: any) {
            console.error('[PromotionService] Validation error:', {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message
            });
            throw error;
        }
    }
};

export default promotionService;
