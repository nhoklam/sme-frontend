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
        queryKey: ['myOrders', params],
        queryFn: () => orderService.getOrders({
            keyword: params.keyword,
            status: params.status,
            page: params.page ?? 0,
            size: params.size ?? 10,
        }),
        staleTime: 1 * 60 * 1000,
    });

    return {
        orders: data?.content ?? [],
        totalElements: data?.totalElements ?? 0,
        totalPages: data?.totalPages ?? 0,
        currentPage: data?.page ?? 0,
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
            queryClient.invalidateQueries({ queryKey: ['myOrders'] });
        },
    });
};
