// src/modules/customer/hooks/useAccount.ts
import { useQuery } from '@tanstack/react-query';
import customerAuthService from '../../../services/customerAuthService';

/**
 * Hook lấy thông tin user đang đăng nhập.
 * Nếu chưa đăng nhập → trả null, không gọi API.
 */
export const useCurrentUser = () => {
    const storedUser = customerAuthService.getCurrentCustomerAuth();
    const isLoggedIn = !!storedUser?.accessToken;

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['currentCustomer'],
        queryFn: () => customerAuthService.getMe(),
        enabled: isLoggedIn,
        staleTime: 5 * 60 * 1000,
    });

    // Nếu API thành công thì lấy data từ API (data.data), nếu không lấy từ localStorage
    const user = data?.data ?? storedUser?.user ?? null;

    return {
        user,
        isLoggedIn,
        isLoading: isLoggedIn ? isLoading : false,
        isError,
        error: error as Error | null,
    };
};
