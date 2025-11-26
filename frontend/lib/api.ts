// lib/api.ts
'use client';

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

const DEFAULT_BASE_URL = 'http://localhost:8000/api/v1';
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || DEFAULT_BASE_URL).replace(/\/$/, '');

interface ApiResponse<T = any> {
  success?: boolean;
  data: T;
  message?: string;
  error?: string;
}

interface AuthTokens {
  access_token: string;
  token_type: string;
}

interface User {
  id: number;
  email: string;
  username?: string;
  full_name: string;
  role: string;
  department?: string;
  phone?: string | null;
  is_active: boolean;
  created_at?: string;
  manager_id?: number;
}

type LoginResponse = AuthTokens & { user: User };
export type ApiUser = User;

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      (config) => {
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('access_token');
          if (token) {
            config.headers = config.headers ?? {};
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest?._retry) {
          originalRequest._retry = true;
          if (typeof window !== 'undefined') {
            localStorage.removeItem('access_token');
            window.location.href = '/auth/login';
          }
        }
        return Promise.reject(error);
      },
    );
  }

  private normalizeResponse<T>(payload: any): ApiResponse<T> {
    if (payload && typeof payload === 'object' && 'data' in payload) {
      return payload as ApiResponse<T>;
    }
    return { data: payload as T };
  }

  private async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.get<T>(url, config);
    return this.normalizeResponse<T>(response.data);
  }

  private async post<T, B = any>(url: string, data?: B, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.post<T>(url, data, config);
    return this.normalizeResponse<T>(response.data);
  }

  private async put<T, B = any>(url: string, data?: B, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.put<T>(url, data, config);
    return this.normalizeResponse<T>(response.data);
  }

  private async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.delete<T>(url, config);
    return this.normalizeResponse<T>(response.data);
  }

  // Auth endpoints
  async login(identifier: string, password: string): Promise<ApiResponse<LoginResponse>> {
    const response = await this.client.post<LoginResponse>('/auth/login-json', {
      username: identifier,
      password,
    });
    const normalized = this.normalizeResponse<LoginResponse>(response.data);
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', normalized.data.access_token);
    }
    return normalized;
  }

  async register(userData: any): Promise<ApiResponse<User>> {
    return this.post<User>('/auth/register', userData);
  }

  async logout(): Promise<void> {
    try {
      await this.post('/auth/logout');
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
      }
    }
  }

  async refreshToken(): Promise<ApiResponse<{ access_token: string }>> {
    if (typeof window === 'undefined') throw new Error('Token refresh is client only');
    const token = localStorage.getItem('access_token');
    if (!token) throw new Error('No token to refresh');
    const response = await this.client.post('/auth/refresh', { token });
    const normalized = this.normalizeResponse<{ access_token: string }>(response.data);
    localStorage.setItem('access_token', normalized.data.access_token);
    return normalized;
  }

  async generateOTP(): Promise<ApiResponse<{ otp_code: string; message: string }>> {
    return this.post('/auth/generate-otp');
  }

  async verifyOTP(otp_code: string): Promise<ApiResponse<{ message: string }>> {
    return this.post('/auth/verify-otp', { otp_code });
  }

  async requestOTP(email: string): Promise<ApiResponse<{ message: string }>> {
    return this.post('/auth/request-otp', { email });
  }

  async resetPassword(email: string, code: string, newPassword: string): Promise<ApiResponse<{ message: string }>> {
    return this.post('/auth/reset-password', { email, code, newPassword });
  }

  // User endpoints
  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.get('/users/me');
  }

  async updateCurrentUser(userData: Partial<User>): Promise<ApiResponse<User>> {
    return this.put('/users/me', userData);
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse<{ message: string }>> {
    return this.post('/users/me/change-password', { current_password: currentPassword, new_password: newPassword });
  }

  async getUsers(): Promise<ApiResponse<User[]>> {
    return this.get('/users');
  }

  async getSubordinates(userId: number): Promise<ApiResponse<User[]>> {
    return this.get(`/users/${userId}/subordinates`);
  }

  async createUser(userData: any): Promise<ApiResponse<User>> {
    return this.post('/users', userData);
  }

  async updateUser(userId: number, userData: any): Promise<ApiResponse<User>> {
    return this.put(`/users/${userId}`, userData);
  }

  async deleteUser(userId: number): Promise<ApiResponse<{ message: string }>> {
    return this.delete(`/users/${userId}`);
  }

  // Financial endpoints
  async getRevenues(filters?: Record<string, any>): Promise<ApiResponse<any[]>> {
    return this.get('/revenue', { params: filters });
  }

  async getRevenue(revenueId: number): Promise<ApiResponse<any>> {
    return this.get(`/revenue/${revenueId}`);
  }

  async createRevenue(revenueData: any): Promise<ApiResponse<any>> {
    return this.post('/revenue', revenueData);
  }

  async updateRevenue(revenueId: number, revenueData: any): Promise<ApiResponse<any>> {
    return this.put(`/revenue/${revenueId}`, revenueData);
  }

  async deleteRevenue(revenueId: number): Promise<ApiResponse<{ message: string }>> {
    return this.delete(`/revenue/${revenueId}`);
  }

  async getExpenses(filters?: Record<string, any>): Promise<ApiResponse<any[]>> {
    return this.get('/expenses', { params: filters });
  }

  async getExpense(expenseId: number): Promise<ApiResponse<any>> {
    return this.get(`/expenses/${expenseId}`);
  }

  async createExpense(expenseData: any): Promise<ApiResponse<any>> {
    return this.post('/expenses', expenseData);
  }

  async updateExpense(expenseId: number, expenseData: any): Promise<ApiResponse<any>> {
    return this.put(`/expenses/${expenseId}`, expenseData);
  }

  async deleteExpense(expenseId: number): Promise<ApiResponse<{ message: string }>> {
    return this.delete(`/expenses/${expenseId}`);
  }

  // Dashboard
  async getDashboardOverview(): Promise<ApiResponse<any>> {
    return this.get('/dashboard/overview');
  }

  async getDashboardKPIs(period: 'week' | 'month' | 'quarter' | 'year' = 'month'): Promise<ApiResponse<any>> {
    return this.get('/dashboard/kpis', { params: { period } });
  }

  async getDashboardRecentActivity(limit = 10): Promise<ApiResponse<any[]>> {
    return this.get('/dashboard/recent-activity', { params: { limit } });
  }

  // Reports
  async getReports(filters?: Record<string, any>): Promise<ApiResponse<any[]>> {
    return this.get('/reports', { params: filters });
  }

  async getReport(reportId: number): Promise<ApiResponse<any>> {
    return this.get(`/reports/${reportId}`);
  }

  async createReport(reportData: any): Promise<ApiResponse<any>> {
    return this.post('/reports', reportData);
  }

  async updateReport(reportId: number, reportData: any): Promise<ApiResponse<any>> {
    return this.put(`/reports/${reportId}`, reportData);
  }

  async deleteReport(reportId: number): Promise<ApiResponse<{ message: string }>> {
    return this.delete(`/reports/${reportId}`);
  }

  async downloadReport(reportId: number): Promise<ApiResponse<{ download_url: string; file_size: number; filename: string }>> {
    return this.post(`/reports/${reportId}/download`);
  }

  async regenerateReport(reportId: number): Promise<ApiResponse<{ message: string }>> {
    return this.post(`/reports/${reportId}/regenerate`);
  }

  async getAvailableReportTypes(): Promise<ApiResponse<{ report_types: Array<{ type: string; name: string; description: string }> }>> {
    return this.get('/reports/types/available');
  }

  // Approvals
  async getApprovals(): Promise<ApiResponse<any[]>> {
    return this.get('/approvals');
  }

  async approveItem(itemId: number, itemType: 'revenue' | 'expense'): Promise<ApiResponse<any>> {
    if (itemType === 'revenue') {
      return this.post(`/revenue/${itemId}/approve`);
    } else {
      return this.post(`/expenses/${itemId}/approve`);
    }
  }

  async rejectItem(itemId: number, itemType: 'revenue' | 'expense', reason?: string): Promise<ApiResponse<any>> {
    // Note: Backend may not have reject endpoints for revenue/expense directly
    // This might need to go through approval workflows
    return this.post(`/approvals/${itemType}/${itemId}/reject`, { reason });
  }

  async approveWorkflow(workflowId: number): Promise<ApiResponse<any>> {
    return this.post(`/approvals/${workflowId}/approve`);
  }

  async rejectWorkflow(workflowId: number, reason: string): Promise<ApiResponse<any>> {
    return this.post(`/approvals/${workflowId}/reject`, { rejection_reason: reason });
  }

  // Notifications
  async getNotifications(unreadOnly?: boolean): Promise<ApiResponse<any[]>> {
    return this.get('/notifications', { params: { unread_only: unreadOnly } });
  }

  async getNotification(notificationId: number): Promise<ApiResponse<any>> {
    return this.get(`/notifications/${notificationId}`);
  }

  async markNotificationAsRead(notificationId: number): Promise<ApiResponse<{ message: string }>> {
    return this.post(`/notifications/${notificationId}/mark-read`);
  }

  async markAllNotificationsAsRead(): Promise<ApiResponse<{ message: string }>> {
    return this.post('/notifications/mark-all-read');
  }

  async deleteNotification(notificationId: number): Promise<ApiResponse<{ message: string }>> {
    return this.delete(`/notifications/${notificationId}`);
  }

  async getUnreadCount(): Promise<ApiResponse<{ unread_count: number }>> {
    return this.get('/notifications/unread/count');
  }

  // Admin endpoints
  async getAdminSystemStats(): Promise<ApiResponse<any>> {
    return this.get('/admin/system/stats');
  }

  async getHierarchy(): Promise<ApiResponse<any>> {
    return this.get('/admin/hierarchy');
  }

  async triggerBackup(includeFiles = false): Promise<ApiResponse<{ message: string }>> {
    return this.post('/admin/backup/create', undefined, { params: { include_files: includeFiles } });
  }

  // Department endpoints
  async getDepartments(): Promise<ApiResponse<any[]>> {
    return this.get('/departments');
  }

  async getDepartment(departmentId: number): Promise<ApiResponse<any>> {
    return this.get(`/departments/${departmentId}`);
  }

  async createDepartment(departmentData: any): Promise<ApiResponse<any>> {
    return this.post('/departments', departmentData);
  }

  async updateDepartment(departmentId: number, departmentData: any): Promise<ApiResponse<any>> {
    return this.put(`/departments/${departmentId}`, departmentData);
  }

  async deleteDepartment(departmentId: number): Promise<ApiResponse<{ message: string }>> {
    return this.delete(`/departments/${departmentId}`);
  }

  // Project endpoints
  async getProjects(filters?: Record<string, any>): Promise<ApiResponse<any[]>> {
    return this.get('/projects', { params: filters });
  }

  async getProject(projectId: number): Promise<ApiResponse<any>> {
    return this.get(`/projects/${projectId}`);
  }

  async createProject(projectData: any): Promise<ApiResponse<any>> {
    return this.post('/projects', projectData);
  }

  async updateProject(projectId: number, projectData: any): Promise<ApiResponse<any>> {
    return this.put(`/projects/${projectId}`, projectData);
  }

  async deleteProject(projectId: number): Promise<ApiResponse<{ message: string }>> {
    return this.delete(`/projects/${projectId}`);
  }

  // Generic request method
  async request<T = any>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.request<T>(config);
    return this.normalizeResponse<T>(response.data);
  }
}

export const apiClient = new ApiClient();
export default apiClient;