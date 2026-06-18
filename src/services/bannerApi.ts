import axiosInstance from './axiosInstance';
import { HomeBanner, ApiResponse } from '../types';

export const bannerApi = {
  getActiveBanners: async (type?: HomeBanner['bannerType']) => {
    return axiosInstance.get<any, ApiResponse<HomeBanner[]>>('/banners', {
      params: { type }
    });
  },

  getAllBanners: async (type?: HomeBanner['bannerType']) => {
    return axiosInstance.get<any, ApiResponse<HomeBanner[]>>('/banners/all', {
      params: { type }
    });
  },

  createBanner: async (data: Omit<HomeBanner, 'id'>) => {
    return axiosInstance.post<any, ApiResponse<HomeBanner>>('/banners', data);
  },

  updateBanner: async (id: string, data: Partial<HomeBanner>) => {
    return axiosInstance.put<any, ApiResponse<HomeBanner>>(`/banners/${id}`, data);
  },

  toggleActiveBanner: async (id: string) => {
    return axiosInstance.patch<any, ApiResponse<HomeBanner>>(`/banners/${id}/toggle-active`);
  },

  deleteBanner: async (id: string) => {
    return axiosInstance.delete<any, ApiResponse<void>>(`/banners/${id}`);
  },

  reorderBanners: async (orderedIds: string[]) => {
    return axiosInstance.put<any, ApiResponse<void>>('/banners/reorder', orderedIds);
  }
};
