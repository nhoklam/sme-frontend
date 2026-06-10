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
  },
  logout: async () => {
    return axiosInstance.post<any, ApiResponse<void>>('/auth/logout');
  },
  forgotPassword: async (email: string) => {
    return axiosInstance.post<any, ApiResponse<void>>('/auth/forgot-password', { email });
  },
  verifyOtp: async (email: string, otp: string) => {
    return axiosInstance.post<any, ApiResponse<void>>('/auth/verify-otp', { email, otp });
  },
  resetPassword: async (data: { email: string; otp: string; newPassword: string }) => {
    return axiosInstance.post<any, ApiResponse<void>>('/auth/reset-password', data);
  },
  exchangeOAuth2Token: async (code: string) => {
    return axiosInstance.post<any, ApiResponse<{ accessToken: string; refreshToken: string; user: AuthUser }>>('/auth/oauth2/token', { code });
  },
  unlockUser: async (email: string) => {
    return axiosInstance.post<any, ApiResponse<void>>('/auth/unlock-user', { email });
  }
};
