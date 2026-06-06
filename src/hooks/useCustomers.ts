import { useQuery } from '@tanstack/react-query';
import customerService from '../services/customerService';
export interface SearchCustomersParams {
    keyword?: string;
    tier?: string;
    page?: number;
    size?: number;
}

export const useCustomers = (params: SearchCustomersParams) => {
    return useQuery({
        queryKey: ['customers', params],
        queryFn: () => customerService.search(params),
        staleTime: 60_000,
    });
};

export const useTopSpenders = (page = 0, size = 10) => {
    return useQuery({
        queryKey: ['customers', 'topSpenders', page, size],
        queryFn: () => customerService.getTopSpenders(page, size),
        staleTime: 60_000,
    });
};

export const useCustomerDetail = (customerId: string | null) => {
    return useQuery({
        queryKey: ['customers', 'detail', customerId],
        queryFn: () => customerService.getById(customerId!),
        enabled: !!customerId,
        staleTime: 60_000,
    });
};

export const useCustomerHistory = (customerId: string | null, page = 0, size = 20) => {
    return useQuery({
        queryKey: ['customers', 'history', customerId, page, size],
        queryFn: () => customerService.getHistory(customerId!, page, size),
        enabled: !!customerId,
        staleTime: 60_000,
    });
};
