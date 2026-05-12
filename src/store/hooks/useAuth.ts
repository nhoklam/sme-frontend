import { useMemo } from 'react';

export interface AuthUser {
    id: string;
    username: string;
    fullName: string;
    role: 'ROLE_ADMIN' | 'ROLE_MANAGER' | 'ROLE_CASHIER';
    warehouseId?: string;
    warehouseName?: string;
    isActive: boolean;
}

export interface UseAuthReturn {
    user: AuthUser | null;
    isAdmin: boolean;
    isManager: boolean;
    isCashier: boolean;
    warehouseId: string | null;
    isAuthenticated: boolean;
}

export const useAuth = (): UseAuthReturn => {
    return useMemo(() => {
        const userStr =
            localStorage.getItem('user') || sessionStorage.getItem('user');

        if (!userStr) {
            return {
                user: null,
                isAdmin: false,
                isManager: false,
                isCashier: false,
                warehouseId: null,
                isAuthenticated: false,
            };
        }

        try {
            const data = JSON.parse(userStr);
            // Hỗ trợ cả 2 cấu trúc: { user: {...} } hoặc trực tiếp { role, ... }
            const user: AuthUser = data?.user ?? data;

            if (!user?.role) {
                return {
                    user: null,
                    isAdmin: false,
                    isManager: false,
                    isCashier: false,
                    warehouseId: null,
                    isAuthenticated: false,
                };
            }

            return {
                user,
                isAdmin: user.role === 'ROLE_ADMIN',
                isManager: user.role === 'ROLE_MANAGER',
                isCashier: user.role === 'ROLE_CASHIER',
                warehouseId: user.warehouseId ?? null,
                isAuthenticated: true,
            };
        } catch {
            return {
                user: null,
                isAdmin: false,
                isManager: false,
                isCashier: false,
                warehouseId: null,
                isAuthenticated: false,
            };
        }
    }, []);
};

export default useAuth;