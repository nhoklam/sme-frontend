import axiosInstance from './axiosInstance';
import { Customer, CustomerAddress, WishlistItem, Order, PageData, ApiResponse } from '../types';

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
    return axiosInstance.patch<any, ApiResponse<CustomerAddress>>(`/customers/me/addresses/${id}/set-default`);
  },

  getWishlist: async () => {
    return axiosInstance.get<any, ApiResponse<WishlistItem[]>>('/customers/me/wishlist');
  },
  addToWishlist: async (productId: string) => {
    return axiosInstance.post<any, ApiResponse<void>>(`/customers/me/wishlist/${productId}`);
  },
  removeFromWishlist: async (productId: string) => {
    return axiosInstance.delete<any, ApiResponse<void>>(`/customers/me/wishlist/${productId}`);
  },
  checkWishlist: async (productId: string) => {
    return axiosInstance.get<any, ApiResponse<{ inWishlist: boolean }>>(`/customers/me/wishlist/${productId}/check`);
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
  }
};
