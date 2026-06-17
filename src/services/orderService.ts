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
        paymentMethod?: string;
        page?: number;
        size?: number;
        warehouseId?: string;
        fromDate?: string;
        toDate?: string;
        provinceCode?: string;
    }): Promise<PageResponse<OrderResponse>> => {
        const query = new URLSearchParams();
        if (params.keyword?.trim()) query.set('keyword', params.keyword.trim());
        if (params.status) query.set('status', params.status);
        if (params.paymentStatus) query.set('paymentStatus', params.paymentStatus);
        if (params.paymentMethod) query.set('paymentMethod', params.paymentMethod);
        if (params.warehouseId) query.set('warehouseId', params.warehouseId);
        if (params.provinceCode) query.set('provinceCode', params.provinceCode);
        if (params.fromDate) query.set('fromDate', params.fromDate);
        if (params.toDate) query.set('toDate', params.toDate);
        query.set('page', String(params.page ?? 0));
        query.set('size', String(params.size ?? 20));

        const res = await axiosInstance.get<ApiResponse<PageResponse<OrderResponse>>>(
            `/orders?${query}`
        );
        return res.data.data;
    },

    // Lấy thống kê đơn hàng theo bộ lọc
    getStats: async (params: {
        keyword?: string;
        status?: string;
        paymentStatus?: string;
        paymentMethod?: string;
        warehouseId?: string;
        source?: string;
        fromDate?: string;
        toDate?: string;
        provinceCode?: string;
    }): Promise<{
        totalCount: number;
        pendingCount: number;
        paidCount: number;
        totalRevenue: number;
    }> => {
        const query = new URLSearchParams();
        if (params.keyword?.trim()) query.set('keyword', params.keyword.trim());
        if (params.status) query.set('status', params.status);
        if (params.paymentStatus) query.set('paymentStatus', params.paymentStatus);
        if (params.paymentMethod) query.set('paymentMethod', params.paymentMethod);
        if (params.warehouseId) query.set('warehouseId', params.warehouseId);
        if (params.provinceCode) query.set('provinceCode', params.provinceCode);
        if (params.source) query.set('source', params.source);
        if (params.fromDate) query.set('fromDate', params.fromDate);
        if (params.toDate) query.set('toDate', params.toDate);

        const res = await axiosInstance.get<ApiResponse<{
            totalCount: number;
            pendingCount: number;
            paidCount: number;
            totalRevenue: number;
        }>>(`/orders/stats?${query}`);
        return res.data.data;
    },

    // Lấy lịch sử mua hàng của khách hàng đang đăng nhập
    getMyHistory: async (page: number = 0, size: number = 20): Promise<any> => {
        const res = await axiosInstance.get(`/customers/me/history?page=${page}&size=${size}`);
        return res.data.data;
    },

    // Lấy chi tiết đơn hàng theo ID
    getById: async (id: string): Promise<OrderResponse> => {
        const res = await axiosInstance.get<ApiResponse<OrderResponse>>(`/orders/${id}`);
        return res.data.data;
    },

    // Tìm đơn hàng theo mã code (cho trang tra cứu đơn hàng)
    getByCode: async (code: string): Promise<OrderResponse> => {
        const res = await axiosInstance.get<ApiResponse<PageResponse<OrderResponse>>>(
            `/orders?keyword=${encodeURIComponent(code)}&page=0&size=1`
        );
        const list = res.data.data;
        if (!list.content || list.content.length === 0) {
            throw new Error('Order not found');
        }
        return list.content[0];
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

    // Chỉ định kho xử lý đơn hàng (Smart Routing override)
    assignWarehouse: async (id: string, warehouseId: string, reason?: string): Promise<OrderResponse> => {
        const res = await axiosInstance.patch<ApiResponse<OrderResponse>>(
            `/orders/${id}/assign-warehouse`,
            { warehouseId, reason }
        );
        return res.data.data;
    },

    // Đối soát COD hàng loạt
    reconcileCod: async (orderIds: string[]): Promise<void> => {
        await axiosInstance.post('/orders/reconcile-cod', { orderIds });
    },

    // Tạo link thanh toán VNPay
    createVnPayUrl: async (orderId: string, returnUrl?: string): Promise<{ checkoutUrl: string; orderCode: string; gateway: string }> => {
        const res = await axiosInstance.post(`/payments/vnpay/create/${orderId}`, { returnUrl });
        return res.data.data;
    },

    // Tạo link thanh toán PayOS
    createPayosUrl: async (orderId: string, returnUrl?: string, cancelUrl?: string): Promise<{ checkoutUrl: string; orderCode: string; gateway: string }> => {
        const res = await axiosInstance.post(`/payments/payos/create/${orderId}`, { returnUrl, cancelUrl });
        return res.data.data;
    },
};

export default orderService;