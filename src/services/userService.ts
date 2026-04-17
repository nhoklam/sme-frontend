// src/services/userService.ts
import axiosInstance from './axiosConfig';
import {
    UserResponse, CreateUserRequest, ChangePasswordRequest,
    ApiResponse
} from '../types';

const userService = {
    // Lấy tất cả người dùng (Admin)
    getAll: async (params?: {
        keyword?: string;
        role?: string;
        warehouseId?: string;
    }): Promise<UserResponse[]> => {
        const query = new URLSearchParams();
        if (params?.keyword) query.set('keyword', params.keyword);
        if (params?.role) query.set('role', params.role);
        if (params?.warehouseId) query.set('warehouseId', params.warehouseId);
        const res = await axiosInstance.get<ApiResponse<UserResponse[]>>(`/auth/users?${query}`);
        return res.data.data ?? [];
    },

    // Tạo người dùng mới
    create: async (data: CreateUserRequest): Promise<UserResponse> => {
        const res = await axiosInstance.post<ApiResponse<UserResponse>>('/auth/users', data);
        return res.data.data;
    },

    // Cập nhật người dùng
    update: async (id: string, data: Partial<CreateUserRequest>): Promise<UserResponse> => {
        const res = await axiosInstance.put<ApiResponse<UserResponse>>(`/auth/users/${id}`, data);
        return res.data.data;
    },

    // Kích hoạt tài khoản
    activate: async (id: string): Promise<UserResponse> => {
        const res = await axiosInstance.patch<ApiResponse<UserResponse>>(`/auth/users/${id}/activate`);
        return res.data.data;
    },

    // Vô hiệu hóa tài khoản
    deactivate: async (id: string): Promise<UserResponse> => {
        const res = await axiosInstance.patch<ApiResponse<UserResponse>>(`/auth/users/${id}/deactivate`);
        return res.data.data;
    },

    // Lấy thông tin cá nhân
    getMe: async (): Promise<UserResponse> => {
        const res = await axiosInstance.get<ApiResponse<UserResponse>>('/auth/me');
        return res.data.data;
    },

    // Đổi mật khẩu
    changePassword: async (data: ChangePasswordRequest): Promise<void> => {
        await axiosInstance.put('/auth/change-password', data);
    },
};

export default userService;