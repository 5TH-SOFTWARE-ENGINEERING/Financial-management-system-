// lib/services/audit-service.ts

import apiClient, { type AuditLog } from "../api";

export interface AuditLogFilters {
    skip?: number;
    limit?: number;
    user_id?: number;
    action?: string;
    resource_type?: string;
    start_date?: string;
    end_date?: string;
    search?: string; // Search by username/email/full_name
}

export class AuditService {
    /**
     * Get audit logs with optional filtering
     */
    async getLogs(filters?: AuditLogFilters): Promise<AuditLog[]> {
        try {
            const response = await apiClient.getAuditLogs(filters);
            // Handle both direct array and { data: array } response formats
            if (Array.isArray(response)) {
                return response;
            }
            return response.data || [];
        } catch (error) {
            console.error("Failed to fetch audit logs:", error);
            return [];
        }
    }
}

export const auditService = new AuditService();
