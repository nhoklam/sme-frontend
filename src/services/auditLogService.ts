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
    getLogs: (params?: any) =>
        axiosInstance.get<ApiResponse<AuditLog[]>>('/admin/audit-logs', {
            params: { limit: params?.size || 100 },
        }),
};
