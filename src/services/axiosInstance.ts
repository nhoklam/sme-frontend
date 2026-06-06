import axiosConfig from './axiosConfig';
import { AxiosRequestConfig } from 'axios';

// Wrapper để kế thừa toàn bộ logic refresh token từ axiosConfig
// nhưng tự động unwrap `response.data` cho các service đang dùng axiosInstance
const axiosInstance = {
    get: <T = any, R = T>(url: string, config?: AxiosRequestConfig): Promise<R> => 
        axiosConfig.get(url, config).then(res => res.data),
    post: <T = any, R = T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<R> => 
        axiosConfig.post(url, data, config).then(res => res.data),
    put: <T = any, R = T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<R> => 
        axiosConfig.put(url, data, config).then(res => res.data),
    delete: <T = any, R = T>(url: string, config?: AxiosRequestConfig): Promise<R> => 
        axiosConfig.delete(url, config).then(res => res.data),
    patch: <T = any, R = T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<R> => 
        axiosConfig.patch(url, data, config).then(res => res.data),
    interceptors: axiosConfig.interceptors,
    defaults: axiosConfig.defaults,
};

export default axiosInstance;
