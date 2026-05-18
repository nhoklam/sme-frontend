import axiosInstance from './axiosConfig';
import { ApiResponse, UserResponse, LoginRequest } from '../types';

const authService = {
    login: async (username: string, password: string) => {
        const response = await axiosInstance.post('/auth/admin/login', { username, password });
        return response.data;
    },

    refreshToken: async (refreshToken: string) => {
        const response = await axiosInstance.post('/auth/refresh', { refreshToken });
        return response.data;
    },

    // Lấy thông tin người dùng hiện tại từ server
    getMe: async (): Promise<ApiResponse<UserResponse>> => {
        const response = await axiosInstance.get<ApiResponse<UserResponse>>('/auth/me');
        return response.data;
    },

    // Chuyển chi nhánh làm việc (Dành cho Admin)
    switchBranch: async (warehouseId: string | null): Promise<any> => {
        const response = await axiosInstance.post('/auth/switch-branch', { warehouseId });
        const data = response.data.data;
        // Lưu lại token và user mới
        const userObj = {
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            user: data.user
        };
        // Kiểm tra xem đang lưu ở localStorage hay sessionStorage
        if (localStorage.getItem('user')) {
            localStorage.setItem('user', JSON.stringify(userObj));
        } else {
            sessionStorage.setItem('user', JSON.stringify(userObj));
        }
        return data;
    },

    // Cập nhật thông tin cá nhân (gọi endpoint admin/users/{id} với token)
    updateProfile: async (userId: string, data: {
        fullName?: string;
        email?: string;
        phone?: string;
    }): Promise<UserResponse> => {
        const response = await axiosInstance.put<ApiResponse<UserResponse>>(
            `/admin/users/${userId}`,
            data
        );
        return response.data.data;
    },

    // Đổi mật khẩu
    changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
        await axiosInstance.put('/auth/change-password', {
            currentPassword,
            newPassword,
        });
    },

    saveUser: (userData: any, rememberMe = false) => {
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem('user', JSON.stringify(userData));
    },

    logout: () => {
        localStorage.removeItem('user');
        sessionStorage.removeItem('user');
    },

    getCurrentUser: () => {
        const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
        if (!userStr) return null;
        try {
            return JSON.parse(userStr);
        } catch (_) {
            return null;
        }
    },

    getUserFromStorage: () => {
        return authService.getCurrentUser();
    },

    isAuthenticated: () => {
        return !!authService.getCurrentUser();
    },
};

export default authService;