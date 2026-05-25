import axiosInstance from './axiosInstance';
import { Customer, CustomerAddress, Order, PageData, ApiResponse } from '../types';

export const customerApi = {
  getProfile: async () => {
    return axiosInstance.get<any, ApiResponse<Customer>>('/customers/me');
  },
  updateProfile: async (data: Partial<Customer>) => {
    return axiosInstance.put<any, ApiResponse<Customer>>('/customers/me', data);
  },

  getAddresses: async () => {
    return axiosInstance.get<any, ApiResponse<CustomerAddress[]>>('/customers/me/addresses');
  },
  addAddress: async (data: Omit<CustomerAddress, 'id' | 'customerId'>) => {
    return axiosInstance.post<any, ApiResponse<CustomerAddress>>('/customers/me/addresses', data);
  },
  updateAddress: async (id: string, data: Partial<CustomerAddress>) => {
    return axiosInstance.put<any, ApiResponse<CustomerAddress>>(`/customers/me/addresses/${id}`, data);
  },
  deleteAddress: async (id: string) => {
    return axiosInstance.delete<any, ApiResponse<void>>(`/customers/me/addresses/${id}`);
  },
  setDefaultAddress: async (id: string) => {
    return axiosInstance.put<any, ApiResponse<CustomerAddress>>(`/customers/me/addresses/${id}/default`);
  },


  getOrders: async (page: number = 0, size: number = 10) => {
    return axiosInstance.get<any, ApiResponse<PageData<Order>>>('/customers/me/orders', {
      params: { page, size }
    });
  },
  getOrderDetail: async (orderId: string) => {
    return axiosInstance.get<any, ApiResponse<Order>>(`/customers/me/orders/${orderId}`);
  },
  getLoyaltyPoints: async () => {
    return axiosInstance.get<any, ApiResponse<{ totalPoints: number; tier: string }>>('/customers/me/loyalty-points');
  },
  
  // Review & Upload
  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosInstance.post<any, ApiResponse<{ url: string }>>('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  createReview: async (productId: string, data: { orderId: string; rating: number; comment?: string; imageUrls?: string[] }) => {
    return axiosInstance.post<any, ApiResponse<any>>('/reviews', {
      productId,
      ...data
    });
  }
};
