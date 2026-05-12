import axiosInstance from './axiosConfig';
import { ApiResponse, PageResponse } from '../types';

export interface NotificationRequest {
    customerId?: string;
    type: 'TIER_UP' | 'PROMOTION' | 'ORDER_STATUS' | 'STOCK_ALERT';
    channel: 'EMAIL' | 'ZALO' | 'SMS' | 'IN_APP';
    title: string;
    content: string;
    metadata?: Record<string, any>;
}

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: string;
    metadata?: string;
    payload?: {
        productName?: string;
        warehouseName?: string;
        productId?: string;
        warehouseId?: string;
        quantity?: number;
        minQuantity?: number;
        [key: string]: unknown;
    };
}

export const notificationService = {
    /**
     * Lấy tất cả thông báo (phân trang) - Khớp với AdminLayout
     */
    getAll: async (params: { page?: number; size?: number } = {}) => {
        const res = await axiosInstance.get<ApiResponse<PageResponse<Notification>>>(
            `/notifications?page=${params.page ?? 0}&size=${params.size ?? 10}`
        );
        return res;
    },

    /**
     * Đếm số thông báo chưa đọc
     */
    countUnread: async () => {
        return await axiosInstance.get<ApiResponse<number>>('/notifications/count-unread');
    },

    /**
     * Đánh dấu là đã đọc
     */
    markAsRead: async (id: string) => {
        return await axiosInstance.patch<ApiResponse<void>>(`/notifications/${id}/read`);
    },

    /**
     * Đánh dấu tất cả là đã đọc
     */
    markAllAsRead: async () => {
        return await axiosInstance.patch<ApiResponse<void>>('/notifications/read-all');
    },

    /**
     * Gửi thông báo đến khách hàng qua Provider
     */
    send: async (request: NotificationRequest): Promise<void> => {
        await axiosInstance.post<ApiResponse<void>>('/notifications/send', request);
    },

    /**
     * Gửi thông báo thăng hạng thành viên
     */
    notifyTierUpgrade: async (customerId: string, nextTier: string): Promise<void> => {
        await axiosInstance.post<ApiResponse<void>>(`/notifications/loyalty/tier-up`, {
            customerId,
            nextTier,
        });
    },

    /**
     * Xóa thông báo
     */
    delete: async (id: string) => {
        return await axiosInstance.delete<ApiResponse<void>>(`/notifications/${id}`);
    },

    /**
     * Gửi thông báo hàng loạt
     */
    sendBulk: async (request: any) => {
        return await axiosInstance.post<ApiResponse<void>>('/notifications/bulk', request);
    },

    /**
     * Lấy lịch sử thông báo (alias cho getAll hoặc đặc thù cho khách hàng)
     */
    getHistory: async (params: { customerId?: string; page?: number; size?: number }) => {
        const query = new URLSearchParams();
        if (params.customerId) query.set('customerId', params.customerId);
        query.set('page', String(params.page ?? 0));
        query.set('size', String(params.size ?? 20));

        const res = await axiosInstance.get<ApiResponse<any>>(`/notifications/history?${query}`);
        return res.data.data;
    }
};

export default notificationService;