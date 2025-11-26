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

  async generateReport(reportData: any): Promise<ApiResponse<any>> {
    return this.post('/reports/generate', reportData);
  }

  async exportReport(format: 'pdf' | 'excel' | 'csv', filters?: Record<string, any>): Promise<ApiResponse<{ download_url: string }>> {
    return this.get(`/reports/export/${format}`, { params: filters });
  }

  // Approvals
  async getApprovals(): Promise<ApiResponse<any[]>> {
    return this.get('/approvals');
  }

  async approveItem(itemId: number, itemType: 'revenue' | 'expense'): Promise<ApiResponse<any>> {
    return this.post(`/approvals/${itemType}/${itemId}/approve`);
  }

  async rejectItem(itemId: number, itemType: 'revenue' | 'expense', reason?: string): Promise<ApiResponse<any>> {
    return this.post(`/approvals/${itemType}/${itemId}/reject`, { reason });
  }

  // Notifications
  async getNotifications(): Promise<ApiResponse<any[]>> {
    return this.get('/notifications');
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

  // Generic request method
  async request<T = any>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.request<T>(config);
    return this.normalizeResponse<T>(response.data);
  }
}

export const apiClient = new ApiClient();
export default apiClient;