// src/services/authorService.ts
import axiosInstance from './axiosConfig';
import { ApiResponse, PageResponse } from '../types';

export interface AuthorResponse {
    id: string;
    name: string;
    bio?: string;
    imageUrl?: string;
    isFeatured: boolean;
}

const authorService = {
    // Tìm kiếm / lấy danh sách tác giả có phân trang
    search: async (params: {
        keyword?: string;
        page?: number;
        size?: number;
    }): Promise<PageResponse<AuthorResponse>> => {
        const query = new URLSearchParams();
        if (params.keyword?.trim()) query.set('keyword', params.keyword.trim());
        query.set('page', String(params.page ?? 0));
        query.set('size', String(params.size ?? 20));

        const res = await axiosInstance.get<ApiResponse<PageResponse<AuthorResponse>>>(
            `/authors?${query}`
        );
        return res.data.data;
    },

    // Lấy chi tiết tác giả theo ID
    getById: async (id: string): Promise<AuthorResponse> => {
        const res = await axiosInstance.get<ApiResponse<AuthorResponse>>(`/authors/${id}`);
        return res.data.data;
    },

    // Lấy danh sách tác giả nổi bật
    getFeatured: async (): Promise<AuthorResponse[]> => {
        const res = await axiosInstance.get<ApiResponse<AuthorResponse[]>>('/authors/featured');
        return res.data.data;
    },
};

export default authorService;
