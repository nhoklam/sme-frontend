import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import customerAuthService, { CUSTOMER_STORAGE_KEY } from '../../../services/customerAuthService';

export const useCurrentUser = () => {
    const rawStored = localStorage.getItem(CUSTOMER_STORAGE_KEY);

    const storedUser = useMemo(() => {
        if (!rawStored) return null;
        try {
            return JSON.parse(rawStored);
        } catch (_) {
            return null;
        }
    }, [rawStored]);

    const isLoggedIn = !!storedUser?.accessToken;

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['currentCustomer'],
        queryFn: () => customerAuthService.getMe(),
        enabled: isLoggedIn,
        staleTime: 5 * 60 * 1000,
        retry: false, // Không retry khi 401 — tránh vòng lặp vô hạn
    });

    // Nếu API thành công thì lấy data từ API (data.data), nếu không lấy từ localStorage
    const user = useMemo(() => {
        return data?.data ?? storedUser?.user ?? null;
    }, [data?.data, storedUser?.user]);

    return {
        user,
        isLoggedIn,
        isLoading: isLoggedIn ? isLoading : false,
        isError,
        error: error as Error | null,
    };
};
