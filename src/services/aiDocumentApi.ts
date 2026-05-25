import axiosInstance from './axiosInstance';
import { ApiResponse } from '../types';

export interface KnowledgeDocument {
  id: string;
  title: string;
  fileName?: string;
  fileSize?: number;
  chunkCount?: number;
  uploadedBy?: string;
  createdAt: string;
}

export const aiDocumentApi = {
  /** Lấy danh sách tất cả tài liệu tri thức AI */
  getAll: async () => {
    return axiosInstance.get<any, ApiResponse<KnowledgeDocument[]>>('/ai/documents');
  },

  /** Tải lên tài liệu huấn luyện AI (PDF, DOCX, TXT) */
  upload: async (file: File, title?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);
    return axiosInstance.post<any, ApiResponse<{ title: string; chunks: number; status: string }>>('/ai/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  /** Xem các đoạn text phân mảnh (chunks) của tài liệu */
  getChunks: async (id: string) => {
    return axiosInstance.get<any, ApiResponse<string[]>>(`/ai/documents/${id}/chunks`);
  },

  /** Xóa tài liệu và dữ liệu vector nhúng AI */
  delete: async (id: string) => {
    return axiosInstance.delete<any, ApiResponse<void>>(`/ai/documents/${id}`);
  },

  /** Tìm kiếm ngữ nghĩa trong kho tri thức AI */
  semanticSearch: async (query: string, topK = 5) => {
    return axiosInstance.get<any, ApiResponse<any>>('/ai/search', {
      params: { query, topK }
    });
  }
};
