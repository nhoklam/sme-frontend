import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';
import { User } from '../types';

const axiosInstance: AxiosInstance = axios.create({
  baseURL: (window as any).process?.env?.REACT_APP_API_URL || 'http://localhost:8080/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Định nghĩa interface cho user data trong storage
interface StoredUser {
  accessToken: string;
  refreshToken: string;
  user: User;
}

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr) as StoredUser;
        if (user.accessToken) {
          config.headers.Authorization = `Bearer ${user.accessToken}`;
        }
      } catch (_) { }
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

export default axiosInstance;