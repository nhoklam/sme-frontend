import axiosInstance from './axiosInstance';
import { Category, ApiResponse } from '../types';

export const categoryApi = {
  getAll: async () => {
    return axiosInstance.get<any, ApiResponse<Category[]>>('/categories');
  }
};
