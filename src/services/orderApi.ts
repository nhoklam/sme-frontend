import axiosInstance from './axiosInstance';
import { CreateOrderRequest, Order, ApiResponse } from '../types';

export const orderApi = {
  createOrder: async (data: CreateOrderRequest) => {
    return axiosInstance.post<any, ApiResponse<Order>>('/orders', data);
  },
  
  suggestBranch: async (data: CreateOrderRequest) => {
    return axiosInstance.post<any, ApiResponse<any>>('/orders/suggest-branch', data);
  }
};
