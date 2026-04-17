// src/services/customerService.ts
import axiosInstance from './axiosConfig';
import { Customer, ApiResponse, PageResponse } from '../types';

const customerService = {
    // Tìm kiếm khách hàng có phân trang
    search: async (params: {
        keyword?: string;
        tier?: string;
        page?: number;
        size?: number;
    }): Promise<PageResponse<Customer>> => {
        const query = new URLSearchParams();
        if (params.keyword?.trim()) query.set('keyword', params.keyword.trim());
        if (params.tier) query.set('tier', params.tier);
        query.set('page', String(params.page ?? 0));
        query.set('size', String(params.size ?? 20));
        const res = await axiosInstance.get<ApiResponse<PageResponse<Customer>>>(`/customers?${query}`);
        return res.data.data;
    },

    // Tra cứu theo số điện thoại (POS)
    lookupByPhone: async (phone: string): Promise<Customer> => {
        const res = await axiosInstance.get<ApiResponse<Customer>>(`/customers/lookup?phone=${phone}`);
        return res.data.data;
    },

    // Lấy theo ID
    getById: async (id: string): Promise<Customer> => {
        const res = await axiosInstance.get<ApiResponse<Customer>>(`/customers/${id}`);
        return res.data.data;
    },

    // Lịch sử mua hàng
    getHistory: async (id: string, page = 0, size = 20): Promise<any> => {
        const res = await axiosInstance.get<ApiResponse<any>>(
            `/customers/${id}/history?page=${page}&size=${size}`
        );
        return res.data.data;
    },

    // Top khách hàng
    getTopSpenders: async (page = 0, size = 10): Promise<PageResponse<Customer>> => {
        const res = await axiosInstance.get<ApiResponse<PageResponse<Customer>>>(
            `/customers/top?page=${page}&size=${size}`
        );
        return res.data.data;
    },

    // Tạo khách hàng mới
    create: async (data: {
        phoneNumber: string;
        fullName: string;
        email?: string;
        address?: string;
        gender?: string;
        notes?: string;
    }): Promise<Customer> => {
        const res = await axiosInstance.post<ApiResponse<Customer>>('/customers', data);
        return res.data.data;
    },

    // Cập nhật khách hàng
    update: async (id: string, data: Partial<Customer> & { isActive?: boolean }): Promise<Customer> => {
        const res = await axiosInstance.put<ApiResponse<Customer>>(`/customers/${id}`, data);
        return res.data.data;
    },
};

export default customerService;