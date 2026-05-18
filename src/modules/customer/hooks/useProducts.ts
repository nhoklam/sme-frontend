// src/modules/customer/hooks/useProducts.ts
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import productService from '../../../services/productService';
import { mapToDisplayProduct, mapToDisplayProducts, DisplayProduct } from '../utils/productMapper';


interface UseProductsParams {
    keyword?: string;
    categoryId?: string;
    page?: number;
    size?: number;
}

interface UseProductsResult {
    products: DisplayProduct[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
}

/**
 * Hook lấy danh sách sản phẩm có phân trang + filter
 */
export const useProducts = (params: UseProductsParams): UseProductsResult => {
    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['products', params],
        queryFn: () => productService.search({
            keyword: params.keyword,
            categoryId: params.categoryId,
            isActive: true,
            page: params.page ?? 0,
            size: params.size ?? 20,
        }),
        staleTime: 2 * 60 * 1000, // 2 phút
    });

    const products = useMemo(() => {
        return data ? mapToDisplayProducts(data.content) : [];
    }, [data]);

    return {
        products,
        totalElements: data?.totalElements ?? 0,
        totalPages: data?.totalPages ?? 0,
        currentPage: data?.page ?? 0,
        isLoading,
        isError,
        error: error as Error | null,
    };
};

/**
 * Hook lấy chi tiết sản phẩm theo ID
 */
export const useProductDetail = (id: string) => {
    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['product', id],
        queryFn: () => productService.getById(id),
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
    });

    return {
        product: data ? mapToDisplayProduct(data) : null,
        rawProduct: data ?? null,
        isLoading,
        isError,
        error: error as Error | null,
    };
};

/**
 * Hook lấy sản phẩm nổi bật cho trang Home (8 sản phẩm)
 */
export const useFeaturedProducts = () => {
    const { data, isLoading, isError } = useQuery({
        queryKey: ['products', 'featured'],
        queryFn: () => productService.search({ isActive: true, page: 0, size: 8 }),
        staleTime: 3 * 60 * 1000,
    });

    const products = useMemo(() => {
        return data ? mapToDisplayProducts(data.content) : [];
    }, [data]);

    return {
        products,
        isLoading,
        isError,
    };
};

/**
 * Hook lấy sản phẩm mới về cho trang Home (4 sản phẩm)
 */
export const useNewArrivals = () => {
    const { data, isLoading, isError } = useQuery({
        queryKey: ['products', 'newArrivals'],
        queryFn: () => productService.search({ isActive: true, page: 0, size: 4 }),
        staleTime: 3 * 60 * 1000,
    });

    const products = useMemo(() => {
        return data ? mapToDisplayProducts(data.content) : [];
    }, [data]);

    return {
        products,
        isLoading,
        isError,
    };
};
