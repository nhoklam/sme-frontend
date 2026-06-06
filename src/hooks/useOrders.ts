import { useQuery } from '@tanstack/react-query';
import { customerApi } from '../services/customerApi';
import { Order } from '../types';

export const useOrders = (initialPage = 0, size = 10) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['orders', initialPage, size],
    queryFn: () => customerApi.getOrders(initialPage, size),
    staleTime: 60_000,
  });

  return {
    orders: data?.success ? data.data.content : [],
    loading: isLoading,
    error: error ? (error as any).message || 'Lỗi tải đơn hàng' : null,
    totalPages: data?.success ? data.data.totalPages : 0,
    currentPage: data?.success ? data.data.page : 0,
    refetch,
  };
};

export const useOrderDetail = (orderId: string) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => customerApi.getOrderDetail(orderId),
    enabled: !!orderId,
    staleTime: 60_000,
  });

  return {
    order: data?.success ? data.data : null,
    loading: isLoading,
    error: error ? (error as any).message || 'Lỗi tải chi tiết đơn hàng' : null,
  };
};
