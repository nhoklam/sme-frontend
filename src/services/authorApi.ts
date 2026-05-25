import axiosInstance from './axiosInstance';
import { Author, PageData, ApiResponse } from '../types';

export interface CreateAuthorRequest {
  name: string;
  avatarUrl?: string;
  biography?: string;
  isFeatured?: boolean;
}

export const authorApi = {
  getFeatured: async () => {
    return axiosInstance.get<any, ApiResponse<Author[]>>('/authors/featured');
  },
  
  getAll: async (params?: { keyword?: string; page?: number; size?: number }) => {
    return axiosInstance.get<any, ApiResponse<PageData<Author>>>('/authors', { params });
  },

  getById: async (id: string) => {
    return axiosInstance.get<any, ApiResponse<Author>>(`/authors/${id}`);
  },

  create: async (data: CreateAuthorRequest) => {
    return axiosInstance.post<any, ApiResponse<Author>>('/authors', data);
  },

  update: async (id: string, data: CreateAuthorRequest) => {
    return axiosInstance.put<any, ApiResponse<Author>>(`/authors/${id}`, data);
  },

  toggleFeatured: async (id: string) => {
    return axiosInstance.patch<any, ApiResponse<Author>>(`/authors/${id}/toggle-featured`);
  }
};

