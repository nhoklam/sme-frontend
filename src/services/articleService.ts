import axiosInstance from './axiosConfig';
import { PageResponse, ApiResponse } from '../types';

export interface ArticleResponse {
    id: string;
    title: string;
    slug: string;
    content: string;
    coverImage: string;
    authorName: string;
    type: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    updatedBy: string;
}

export interface CreateArticleRequest {
    title: string;
    slug?: string;
    content: string;
    coverImage?: string;
    authorName?: string;
    type?: string;
    isActive?: boolean;
}

export interface UpdateArticleRequest {
    title?: string;
    slug?: string;
    content?: string;
    coverImage?: string;
    authorName?: string;
    type?: string;
    isActive?: boolean;
}

const articleService = {
    // PUBLIC
    search: async (params: { keyword?: string; type?: string; isActive?: boolean; page?: number; size?: number }): Promise<PageResponse<ArticleResponse>> => {
        const query = new URLSearchParams();
        if (params.keyword?.trim()) query.set('keyword', params.keyword.trim());
        if (params.type) query.set('type', params.type);
        if (params.isActive !== undefined) query.set('isActive', String(params.isActive));
        query.set('page', String(params.page ?? 0));
        query.set('size', String(params.size ?? 20));

        const res = await axiosInstance.get<ApiResponse<PageResponse<ArticleResponse>>>(`/articles?${query}`);
        return res.data.data;
    },

    getBySlug: async (slug: string): Promise<ArticleResponse> => {
        const res = await axiosInstance.get<ApiResponse<ArticleResponse>>(`/articles/slug/${slug}`);
        return res.data.data;
    },

    getById: async (id: string): Promise<ArticleResponse> => {
        const res = await axiosInstance.get<ApiResponse<ArticleResponse>>(`/articles/${id}`);
        return res.data.data;
    },

    // ADMIN
    create: async (data: CreateArticleRequest): Promise<ArticleResponse> => {
        const res = await axiosInstance.post<ApiResponse<ArticleResponse>>('/articles', data);
        return res.data.data;
    },

    update: async (id: string, data: UpdateArticleRequest): Promise<ArticleResponse> => {
        const res = await axiosInstance.put<ApiResponse<ArticleResponse>>(`/articles/${id}`, data);
        return res.data.data;
    },

    delete: async (id: string): Promise<void> => {
        await axiosInstance.delete(`/articles/${id}`);
    }
};

export default articleService;
