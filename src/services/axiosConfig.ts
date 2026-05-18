// src/services/axiosConfig.ts
import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';
import customerAuthService from './customerAuthService';
import authService from './authService';

const axiosInstance: AxiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

interface StoredUser {
  accessToken: string;
  refreshToken: string;
  user: any;
}

// Public routes that do NOT require authentication
// These APIs are called from the customer-facing pages (no login required)
const PUBLIC_PREFIXES = [
  '/products',
  '/categories',
  '/orders', // order tracking by code is public
];

const isPublicRoute = (url: string = ''): boolean =>
  PUBLIC_PREFIXES.some(prefix => url.startsWith(prefix));

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

// Request interceptor: attach token if available
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr) as StoredUser;
        if (user.accessToken) {
          config.headers.Authorization = `Bearer ${user.accessToken}`;
        }
      } catch { /* ignore parse errors */ }
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Response interceptor: handle 401 and refresh token
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      // For public routes (product listing, categories, etc.), 
      // don't redirect to login — just reject silently so the page still renders
      const requestUrl = originalRequest.url ?? '';
      if (isPublicRoute(requestUrl)) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue the request while refresh is in progress
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
      if (!userStr) {
        isRefreshing = false;
        // Chỉ redirect nếu không phải trang khách hàng (ví dụ: trang admin)
        const currentPath = window.location.pathname;
        const isCustomerPage = !currentPath.startsWith('/admin') && currentPath !== '/admin/login';
        if (!isCustomerPage && !authService.getCurrentUser()) {
          // Token expired and no user info for Admin
          window.location.href = '/admin/login';
        } else if (isCustomerPage && !customerAuthService.getCurrentCustomerAuth()) {
          // Token expired for Customer
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      try {
        const user = JSON.parse(userStr) as StoredUser;
        if (!user.refreshToken) throw new Error('No refresh token');

        const response = await axios.post(
          `${process.env.REACT_APP_API_URL || 'http://localhost:8080/api'}/auth/refresh`,
          { refreshToken: user.refreshToken }
        );

        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        const updatedUser = {
          ...user,
          accessToken,
          refreshToken: newRefreshToken || user.refreshToken,
        };

        // Persist updated tokens
        if (localStorage.getItem('user')) {
          localStorage.setItem('user', JSON.stringify(updatedUser));
        } else {
          sessionStorage.setItem('user', JSON.stringify(updatedUser));
        }

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        processQueue(null, accessToken);
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        localStorage.removeItem('user');
        sessionStorage.removeItem('user');
        // Only redirect if we're on a non-customer page
        const currentPath = window.location.pathname;
        const isCustomerPage = !currentPath.startsWith('/admin');
        if (isCustomerPage) {
          customerAuthService.logout();
          window.location.href = '/login';
        } else {
          authService.logout();
          window.location.href = '/admin/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;