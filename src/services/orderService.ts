// src/services/orderService.ts
import axiosInstance from './axiosConfig';
import {
    OrderResponse,
    ApiResponse,
    PageResponse,
    CreateOrderRequest,
} from '../types';

const orderService = {
    // Lấy danh sách đơn hàng có phân trang
    getOrders: async (params: {
        keyword?: string;
        status?: string;
        paymentStatus?: string;
        page?: number;
        size?: number;
    }): Promise<PageResponse<OrderResponse>> => {
        const query = new URLSearchParams();
        if (params.keyword?.trim()) query.set('keyword', params.keyword.trim());
        if (params.status) query.set('status', params.status);
        if (params.paymentStatus) query.set('paymentStatus', params.paymentStatus);
        query.set('page', String(params.page ?? 0));
        query.set('size', String(params.size ?? 20));

        const res = await axiosInstance.get<ApiResponse<PageResponse<OrderResponse>>>(
            `/orders?${query}`
        );
        return res.data.data;
    },

    // Lấy chi tiết đơn hàng theo ID
    getById: async (id: string): Promise<OrderResponse> => {
        const res = await axiosInstance.get<ApiResponse<OrderResponse>>(`/orders/${id}`);
        return res.data.data;
    },

    // Tạo đơn hàng mới
    create: async (data: CreateOrderRequest): Promise<OrderResponse> => {
        const res = await axiosInstance.post<ApiResponse<OrderResponse>>('/orders', data);
        return res.data.data;
    },

    // Cập nhật trạng thái đơn hàng
    updateStatus: async (id: string, status: string, note?: string): Promise<OrderResponse> => {
        const res = await axiosInstance.patch<ApiResponse<OrderResponse>>(
            `/orders/${id}/status`,
            { status, note }
        );
        return res.data.data;
    },

    // Hủy đơn hàng
    cancel: async (id: string, reason?: string): Promise<OrderResponse> => {
        const res = await axiosInstance.post<ApiResponse<OrderResponse>>(
            `/orders/${id}/cancel`,
            { reason }
        );
        return res.data.data;
    },
};

export default orderService;