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

const PUBLIC_PREFIXES = [
  '/products',
  '/categories',
  '/auth',        
  '/customers/me',
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

// Request interceptor: attach token if available (supports both Admin and Customer auth)
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    // Xác định context hiện tại là Admin hay Customer
    const isAdminContext = window.location.pathname.startsWith('/admin');

    let token: string | null = null;

    if (isAdminContext) {
      // Admin: ưu tiên đọc từ key 'user'
      const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr) as StoredUser;
          token = user.accessToken || null;
        } catch { /* ignore */ }
      }
    } else {
      // Customer: ưu tiên đọc từ key 'customer_auth'
      const customerStr = localStorage.getItem('customer_auth');
      if (customerStr) {
        try {
          const customer = JSON.parse(customerStr) as StoredUser;
          token = customer.accessToken || null;
        } catch { /* ignore */ }
      }
      // Fallback: nếu customer chưa có, thử admin token (cho API public)
      if (!token) {
        const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
        if (userStr) {
          try {
            const user = JSON.parse(userStr) as StoredUser;
            token = user.accessToken || null;
          } catch { /* ignore */ }
        }
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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

      const currentPath = window.location.pathname;
      const isAdminContext = currentPath.startsWith('/admin');

      // Tìm token refresh phù hợp theo context
      let storedAuth: StoredUser | null = null;
      let storageKey: string = 'user';
      let storageType: 'local' | 'session' = 'local';

      if (isAdminContext) {
        const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
        if (userStr) {
          try { storedAuth = JSON.parse(userStr); } catch { /* ignore */ }
          storageType = localStorage.getItem('user') ? 'local' : 'session';
          storageKey = 'user';
        }
      } else {
        // Customer context
        const customerStr = localStorage.getItem('customer_auth');
        if (customerStr) {
          try { storedAuth = JSON.parse(customerStr); } catch { /* ignore */ }
          storageKey = 'customer_auth';
          storageType = 'local';
        }
      }

      if (!storedAuth || !storedAuth.refreshToken) {
        isRefreshing = false;
        // Không redirect tự động cho customer — chỉ reject error
        // Customer có thể chưa đăng nhập, vẫn cho xem trang
        if (isAdminContext && !authService.getCurrentUser()) {
          window.location.href = '/admin/login';
        }
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(
          `${process.env.REACT_APP_API_URL || 'http://localhost:8080/api'}/auth/refresh`,
          { refreshToken: storedAuth.refreshToken }
        );

        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        const updatedAuth = {
          ...storedAuth,
          accessToken,
          refreshToken: newRefreshToken || storedAuth.refreshToken,
        };

        // Lưu lại tokens vào đúng storage key
        if (storageType === 'local') {
          localStorage.setItem(storageKey, JSON.stringify(updatedAuth));
        } else {
          sessionStorage.setItem(storageKey, JSON.stringify(updatedAuth));
        }

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        processQueue(null, accessToken);
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        if (isAdminContext) {
          localStorage.removeItem('user');
          sessionStorage.removeItem('user');
          authService.logout();
          window.location.href = '/admin/login';
        } else {
          localStorage.removeItem('customer_auth');
          customerAuthService.logout();
          // Không redirect khách hàng — chỉ xóa auth data
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