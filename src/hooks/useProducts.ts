import { useQuery } from '@tanstack/react-query';
import { productApi } from '../services/productApi';
import { Product } from '../types';

export const useProducts = (initialParams: any) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['products', initialParams],
    queryFn: () => productApi.getProducts(initialParams),
    staleTime: 60_000,
  });

  return {
    products: data?.success ? data.data.content : [],
    loading: isLoading,
    error: error ? (error as any).message || 'Lỗi tải sản phẩm' : null,
    totalPages: data?.success ? data.data.totalPages : 0,
    currentPage: data?.success ? data.data.page : 0,
    refetch,
  };
};

export const useProductDetail = (slug: string) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => productApi.getBySlug(slug),
    enabled: !!slug,
    staleTime: 60_000,
  });

  return {
    product: data?.success ? data.data : null,
    loading: isLoading,
    error: error ? (error as any).message || 'Lỗi tải chi tiết sản phẩm' : null,
  };
};

export const useFlashSale = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['flashSale'],
    queryFn: () => productApi.getFlashSale(),
    staleTime: 60_000,
  });

  return {
    products: data?.success ? data.data : [],
    loading: isLoading,
  };
};
