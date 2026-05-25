import { useQuery } from '@tanstack/react-query';
import articleService from '../../../services/articleService';

interface UseArticlesParams {
    keyword?: string;
    type?: string;
    isActive?: boolean;
    page?: number;
    size?: number;
}

export const useArticles = (params: UseArticlesParams) => {
    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['articles', params],
        queryFn: () => articleService.search({
            keyword: params.keyword,
            type: params.type,
            isActive: params.isActive ?? true,
            page: params.page ?? 0,
            size: params.size ?? 20,
        }),
        staleTime: 5 * 60 * 1000,
    });

    return {
        articles: data?.content ?? [],
        totalElements: data?.totalElements ?? 0,
        totalPages: data?.totalPages ?? 0,
        currentPage: data?.page ?? 0,
        isLoading,
        isError,
        error: error as Error | null,
    };
};

export const useArticleDetail = (slug: string) => {
    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['article', slug],
        queryFn: () => articleService.getBySlug(slug),
        enabled: !!slug,
        staleTime: 10 * 60 * 1000,
    });

    return {
        article: data ?? null,
        isLoading,
        isError,
        error: error as Error | null,
    };
};
