import axiosInstance from './axiosConfig';
import type { ApiResponse } from '../types';

export interface AuditLog {
    id?: number;
    entityName: string;
    entityId: string;
    targetName?: string;
    action: string;       // CREATE | UPDATE | DELETE
    changes?: string;
    performedBy: string;
    performedAt: string;
    ipAddress?: string;
    revision?: number;
}

export const auditLogService = {
    getLogs: (params?: { page?: number, size?: number, keyword?: string, actionFilter?: string }) =>
        axiosInstance.get<ApiResponse<any>>('/admin/audit-logs', {
            params,
        }),
};
