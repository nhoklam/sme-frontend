import axiosInstance from './axiosConfig';
import { ApiResponse, UserResponse } from '../types';

export const CUSTOMER_STORAGE_KEY = 'customer_auth';

export interface CustomerAuthData {
    accessToken: string;
    refreshToken: string;
    user: UserResponse;
}

const customerAuthService = {
    login: async (username: string, password: string) => {
        const response = await axiosInstance.post('/auth/login', { username, password });
        return response.data;
    },

    register: async (data: any) => {
        const response = await axiosInstance.post('/auth/customer/register', data);
        return response.data;
    },

    getMe: async (): Promise<ApiResponse<any>> => {
        const response = await axiosInstance.get('/customers/me');
        return response.data;
    },

    updateProfile: async (data: any): Promise<any> => {
        const response = await axiosInstance.put('/customers/me', data);
        return response.data;
    },

    changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
        await axiosInstance.put('/auth/change-password', {
            currentPassword,
            newPassword,
        });
    },

    saveCustomer: (authData: CustomerAuthData) => {
        // Luôn lưu local storage cho customer vì có TTL 7 ngày
        localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(authData));
    },

    logout: () => {
        localStorage.removeItem(CUSTOMER_STORAGE_KEY);
    },

    getCurrentCustomerAuth: (): CustomerAuthData | null => {
        const str = localStorage.getItem(CUSTOMER_STORAGE_KEY);
        if (!str) return null;
        try {
            return JSON.parse(str);
        } catch (_) {
            return null;
        }
    },

    isAuthenticated: () => {
        return !!customerAuthService.getCurrentCustomerAuth();
    },
};

export default customerAuthService;
