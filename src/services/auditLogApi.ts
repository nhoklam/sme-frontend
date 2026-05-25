import axiosInstance from './axiosInstance';
import { ApiResponse, AuditLogResponse } from '../types';

export const auditLogApi = {
  /** Lấy nhật ký thao tác toàn hệ thống (Chỉ Admin) */
  getAll: async (limit = 100) => {
    return axiosInstance.get<any, ApiResponse<AuditLogResponse[]>>('/admin/audit-logs', {
      params: { limit }
    });
  }
};
