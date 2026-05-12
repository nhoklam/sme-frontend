import axiosInstance from './axiosConfig';
import type { ApiResponse, AiChatRequest, AiChatResponse } from '../types';

export interface KnowledgeDocument {
    id: string;
    title: string;
    fileName: string;
    fileType: string;
    chunkCount: number;
    createdAt: string;
}

export const aiService = {
    // Chat với AI Co-pilot
    chat: (data: AiChatRequest) =>
        axiosInstance.post<ApiResponse<AiChatResponse>>('/ai/chat', data),

    // Tìm kiếm ngữ nghĩa trong tài liệu RAG
    searchSemantic: (query: string, topK = 5) =>
        axiosInstance.get<ApiResponse<any[]>>('/ai/search', { params: { query, topK } }),

    // Upload tài liệu (PDF, DOCX, TXT) để AI học
    uploadDocument: (file: File, title?: string) => {
        const formData = new FormData();
        formData.append('file', file);
        if (title) formData.append('title', title);
        return axiosInstance.post<ApiResponse<{ title: string; chunks: number; status: string }>>(
            '/ai/documents',
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
        );
    },

    // Lấy danh sách tài liệu đã upload
    getDocuments: () =>
        axiosInstance.get<ApiResponse<KnowledgeDocument[]>>('/ai/documents'),

    // Xóa tài liệu
    deleteDocument: (id: string) =>
        axiosInstance.delete<ApiResponse<void>>(`/ai/documents/${id}`),

    // Xem chi tiết các đoạn tri thức của tài liệu
    getDocumentChunks: (id: string) =>
        axiosInstance.get<ApiResponse<string[]>>(`/ai/documents/${id}/chunks`),
};