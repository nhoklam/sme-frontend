// src/modules/customer/hooks/useOrders.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import orderService from '../../../services/orderService';
import { CreateOrderRequest } from '../../../types';

interface UseMyOrdersParams {
    keyword?: string;
    status?: string;
    page?: number;
    size?: number;
}

/**
 * Hook lấy danh sách đơn hàng của khách hàng
 */
export const useMyOrders = (params: UseMyOrdersParams) => {
    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['myHistory', params.page, params.size],
        queryFn: () => orderService.getMyHistory(params.page, params.size),
        staleTime: 1 * 60 * 1000,
    });

    // Gom cả orders và invoices lại để hiển thị
    const allHistory = [
        ...(data?.orders || []),
        ...(data?.invoices || [])
    ].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return {
        orders: allHistory,
        totalPages: 1, // API history hiện tại không trả về totalPages cho tổng hợp, giả định 1 trang cho đơn giản
        isLoading,
        isError,
        error: error as Error | null,
    };
};

/**
 * Hook lấy chi tiết đơn hàng theo ID
 */
export const useOrderDetail = (id: string) => {
    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['order', id],
        queryFn: () => orderService.getById(id),
        enabled: !!id,
        staleTime: 1 * 60 * 1000,
    });

    return {
        order: data ?? null,
        isLoading,
        isError,
        error: error as Error | null,
    };
};

/**
 * Hook tạo đơn hàng mới (mutation)
 */
export const useCreateOrder = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateOrderRequest) => orderService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['myHistory'] });
        },
    });
};
