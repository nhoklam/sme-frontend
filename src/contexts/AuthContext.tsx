import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axiosInstance from '../services/axiosInstance';
import { AuthUser, Customer, LoginRequest, RegisterRequest, ApiResponse } from '../types';

interface AuthContextType {
  user: AuthUser | null;
  customer: Customer | null;
  isAuthenticated: boolean;
  isCustomer: boolean;
  isLoading: boolean;
  login: (req: LoginRequest) => Promise<void>;
  register: (req: RegisterRequest) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('accessToken');

      if (storedUser && token) {
        try {
          setUser(JSON.parse(storedUser));
          await refreshProfile();
        } catch (error) {
          console.error('Failed to init auth', error);
          logout();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const refreshProfile = async () => {
    try {
      const resUser = await axiosInstance.get<any, ApiResponse<AuthUser>>('/auth/me');
      if (resUser.success) {
        setUser(resUser.data);
        localStorage.setItem('user', JSON.stringify(resUser.data));

        if (resUser.data.role === 'ROLE_CUSTOMER') {
          const resCustomer = await axiosInstance.get<any, ApiResponse<Customer>>('/customers/me');
          if (resCustomer.success) {
            setCustomer(resCustomer.data);
          }
        }
      }
    } catch (error) {
      console.error('Lỗi lấy profile', error);
      throw error;
    }
  };

  const login = async (req: LoginRequest) => {
    try {
      const res = await axiosInstance.post<any, ApiResponse<any>>('/auth/login', req);
      if (res.success) {
        const { accessToken, refreshToken, user: loggedUser } = res.data;
        localStorage.setItem('accessToken', accessToken);
        if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(loggedUser));
        
        setUser(loggedUser);
        if (loggedUser.role === 'ROLE_CUSTOMER') {
          const resCustomer = await axiosInstance.get<any, ApiResponse<Customer>>('/customers/me');
          if (resCustomer.success) {
            setCustomer(resCustomer.data);
          }
        }
      } else {
        throw new Error(res.message || 'Login failed');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Lỗi kết nối máy chủ');
    }
  };

  const register = async (req: RegisterRequest) => {
    try {
      const res = await axiosInstance.post<any, ApiResponse<any>>('/auth/customer/register', req);
      if (res.success) {
        // Tự đăng nhập hoặc chờ user đăng nhập tùy logic
        // Ở đây giả sử trả về token giống login
        if (res.data?.accessToken) {
          const { accessToken, refreshToken, user: regUser } = res.data;
          localStorage.setItem('accessToken', accessToken);
          if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
          localStorage.setItem('user', JSON.stringify(regUser));
          setUser(regUser);
          await refreshProfile();
        }
      } else {
        throw new Error(res.message || 'Register failed');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Lỗi đăng ký');
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
    setCustomer(null);
    window.location.href = '/';
  };

  const value: AuthContextType = {
    user,
    customer,
    isAuthenticated: !!user,
    isCustomer: user?.role === 'ROLE_CUSTOMER',
    isLoading,
    login,
    register,
    logout,
    refreshProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
