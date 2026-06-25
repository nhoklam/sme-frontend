// src/modules/customer/hooks/useProducts.ts
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import productService from '../../../services/productService';
import { mapToDisplayProduct, mapToDisplayProducts, DisplayProduct } from '../utils/productMapper';


interface UseProductsParams {
    keyword?: string;
    categoryId?: string;
    sortBy?: string;
    page?: number;
    size?: number;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
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
            isPublished: true,
            sortBy: params.sortBy,
            page: params.page ?? 0,
            size: params.size ?? 20,
            minPrice: params.minPrice,
            maxPrice: params.maxPrice,
            minRating: params.minRating,
        }),
        staleTime: 0,
        refetchOnWindowFocus: true,
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
        staleTime: 0,
        refetchOnWindowFocus: true,
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
        queryFn: () => productService.search({ isActive: true, isPublished: true, page: 0, size: 8 }),
        staleTime: 0,
        refetchOnWindowFocus: true,
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
        queryFn: () => productService.search({ isActive: true, isPublished: true, page: 0, size: 4 }),
        staleTime: 0,
        refetchOnWindowFocus: true,
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

export const usePriceHistory = (productId: string) => {
    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['priceHistory', productId],
        queryFn: () => productService.getPriceHistory(productId),
        enabled: !!productId,
    });

    return {
        history: data ?? [],
        isLoading,
        isError,
        error: error as Error | null,
    };
};

export const useProductReviews = (productId: string, rating: number | null = null, page = 0, size = 10) => {
    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['product_reviews', productId, rating, page, size],
        queryFn: () => productService.getReviews(productId, rating, page, size),
        enabled: !!productId,
    });

    return {
        reviews: data?.content ?? [],
        totalElements: data?.totalElements ?? 0,
        totalPages: data?.totalPages ?? 0,
        isLoading,
        isError,
        error: error as Error | null,
    };
};
