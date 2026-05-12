// src/modules/customer/hooks/useAccount.ts
import { useQuery } from '@tanstack/react-query';
import authService from '../../../services/authService';

/**
 * Hook lấy thông tin user đang đăng nhập.
 * Nếu chưa đăng nhập → trả null, không gọi API.
 */
export const useCurrentUser = () => {
    const storedUser = authService.getCurrentUser();
    const isLoggedIn = !!storedUser?.accessToken;

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => authService.getMe(),
        enabled: isLoggedIn,
        staleTime: 5 * 60 * 1000,
    });

    return {
        user: data?.data ?? storedUser?.user ?? null,
        isLoggedIn,
        isLoading: isLoggedIn ? isLoading : false,
        isError,
        error: error as Error | null,
    };
};
