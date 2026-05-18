import axiosInstance from './axiosInstance';
import { AuthUser, LoginRequest, RegisterRequest, ApiResponse } from '../types';

export const authApi = {
  login: async (req: LoginRequest) => {
    return axiosInstance.post<any, ApiResponse<{ accessToken: string; refreshToken: string; user: AuthUser }>>('/auth/login', req);
  },
  register: async (req: RegisterRequest) => {
    return axiosInstance.post<any, ApiResponse<any>>('/auth/customer/register', req);
  },
  getMe: async () => {
    return axiosInstance.get<any, ApiResponse<AuthUser>>('/auth/me');
  },
  refreshToken: async (refreshToken: string) => {
    return axiosInstance.post<any, ApiResponse<{ accessToken: string; refreshToken: string }>>('/auth/refresh', { refreshToken });
  }
};
