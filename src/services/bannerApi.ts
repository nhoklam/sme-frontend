import axiosInstance from './axiosInstance';
import { HomeBanner, ApiResponse } from '../types';

export const bannerApi = {
  getActiveBanners: async (type?: HomeBanner['bannerType']) => {
    return axiosInstance.get<any, ApiResponse<HomeBanner[]>>('/banners', {
      params: { type }
    });
  }
};
