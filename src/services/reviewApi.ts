import axiosInstance from './axiosInstance';
import { ApiResponse, ProductReview, PageResponse } from '../types';

export interface ReviewListParams {
  page?: number;
  size?: number;
  productId?: string;
  status?: 'PENDING' | 'APPROVED' | 'ALL';
}

export const reviewApi = {
  /** Lấy danh sách tất cả reviews (Admin dùng endpoint products/{id}/reviews) */
  getReviewsByProduct: async (productId: string, page = 0, size = 20) => {
    return axiosInstance.get<any, ApiResponse<PageResponse<ProductReview>>>(`/products/${productId}/reviews`, {
      params: { page, size }
    });
  },

  /** Lấy toàn bộ reviews cho Admin/Manager */
  getAllReviews: async (params?: { page?: number, size?: number, status?: boolean }) => {
    return axiosInstance.get<any, ApiResponse<PageResponse<ProductReview>>>(`/reviews`, { params });
  },

  /** Ẩn/Hiện đánh giá (Toggle) */
  toggleReview: async (id: string) => {
    return axiosInstance.patch<any, ApiResponse<ProductReview>>(`/reviews/${id}/toggle-status`);
  },

  /** Xóa đánh giá */
  deleteReview: async (id: string) => {
    return axiosInstance.delete<any, ApiResponse<void>>(`/reviews/${id}`);
  }
};
