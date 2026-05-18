import axiosInstance from './axiosInstance';
import { Author, PageData, ApiResponse } from '../types';

export const authorApi = {
  getFeatured: async () => {
    return axiosInstance.get<any, ApiResponse<Author[]>>('/authors/featured');
  },
  
  getAll: async (params?: { keyword?: string; page?: number; size?: number }) => {
    return axiosInstance.get<any, ApiResponse<PageData<Author>>>('/authors', { params });
  },

  getById: async (id: string) => {
    return axiosInstance.get<any, ApiResponse<Author>>(`/authors/${id}`);
  }
};
