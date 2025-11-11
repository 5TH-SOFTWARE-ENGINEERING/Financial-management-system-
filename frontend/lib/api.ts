// lib/api.ts
'use client'; // Ensure client-side only for browser APIs like localStorage

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

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
  full_name: string;
  role: 'admin' | 'finance_manager' | 'accountant' | 'employee';
  department?: string;
  is_active: boolean;
  created_at?: string;
  manager_id?: number;
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token from localStorage
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle errors (e.g., 401 logout)
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          // Note: Basic JWT; no refresh implemented in backend yet. Stub for future.
          // If refresh endpoint added: await this.refreshToken();
          localStorage.removeItem('access_token');
          window.location.href = '/auth/login';
          return Promise.reject(error);
        }

        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(email: string, password: string): Promise<ApiResponse<AuthTokens>> {
    const response = await this.client.post('/auth/login', { username: email, password }); // Matches OAuth2PasswordRequestForm
    const { access_token, token_type } = response.data;
    
    localStorage.setItem('access_token', access_token);
    
    return { data: { access_token, token_type } };
  }

  async register(userData: any): Promise<ApiResponse<User>> {
    const response = await this.client.post('/auth/register', userData);
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      await this.client.post('/auth/logout'); // Optional; if implemented
    } finally {
      localStorage.removeItem('access_token');
    }
  }

  // Stub for future refresh (add /auth/refresh endpoint in backend)
  async refreshToken(): Promise<ApiResponse<{ access_token: string }>> {
    const token = localStorage.getItem('access_token');
    if (!token) throw new Error('No token to refresh');
    const response = await this.client.post('/auth/refresh', { token });
    const { access_token } = response.data;
    localStorage.setItem('access_token', access_token);
    return response.data;
  }

  async generateOTP(): Promise<ApiResponse<{ otp_code: string; message: string }>> {
    const response = await this.client.post('/auth/generate-otp');
    return response.data;
  }

  async verifyOTP(otp_code: string): Promise<ApiResponse<{ message: string }>> {
    const response = await this.client.post('/auth/verify-otp', { otp_code });
    return response.data;
  }

  async requestOTP(email: string): Promise<ApiResponse<{ message: string }>> {
    const response = await this.client.post('/auth/request-otp', { email });
    return response.data;
  }

  async resetPassword(email: string, code: string, newPassword: string): Promise<ApiResponse<{ message: string }>> {
    const response = await this.client.post('/auth/reset-password', { email, code, newPassword });
    return response.data;
  }

  // User endpoints
  async getCurrentUser(): Promise<ApiResponse<User>> {
    const response = await this.client.get('/users/me');
    return response.data;
  }

  async getUsers(): Promise<ApiResponse<User[]>> {
    const response = await this.client.get('/users');
    return response.data;
  }

  async getSubordinates(managerId: number): Promise<ApiResponse<User[]>> {
    const response = await this.client.get(`/users/${managerId}/subordinates`);
    return response.data;
  }

  async createUser(userData: any): Promise<ApiResponse<User>> {
    const response = await this.client.post('/users', userData);
    return response.data;
  }

  async updateUser(userId: number, userData: any): Promise<ApiResponse<User>> {
    const response = await this.client.put(`/users/${userId}`, userData);
    return response.data;
  }

  async deleteUser(userId: number): Promise<ApiResponse<{ message: string }>> {
    const response = await this.client.delete(`/users/${userId}`);
    return response.data;
  }

  // Financial endpoints
  async getRevenues(filters?: any): Promise<ApiResponse<any[]>> {
    const response = await this.client.get('/revenue', { params: filters });
    return response.data;
  }

  async createRevenue(revenueData: any): Promise<ApiResponse<any>> {
    const response = await this.client.post('/revenue', revenueData);
    return response.data;
  }

  async updateRevenue(revenueId: number, revenueData: any): Promise<ApiResponse<any>> {
    const response = await this.client.put(`/revenue/${revenueId}`, revenueData);
    return response.data;
  }

  async deleteRevenue(revenueId: number): Promise<ApiResponse<{ message: string }>> {
    const response = await this.client.delete(`/revenue/${revenueId}`);
    return response.data;
  }

  async getExpenses(filters?: any): Promise<ApiResponse<any[]>> {
    const response = await this.client.get('/expenses', { params: filters });
    return response.data;
  }

  async createExpense(expenseData: any): Promise<ApiResponse<any>> {
    const response = await this.client.post('/expenses', expenseData);
    return response.data;
  }

  async updateExpense(expenseId: number, expenseData: any): Promise<ApiResponse<any>> {
    const response = await this.client.put(`/expenses/${expenseId}`, expenseData);
    return response.data;
  }

  async deleteExpense(expenseId: number): Promise<ApiResponse<{ message: string }>> {
    const response = await this.client.delete(`/expenses/${expenseId}`);
    return response.data;
  }

  async getDashboardData(): Promise<ApiResponse<any>> {
    const response = await this.client.get('/dashboard/kpis');
    return response.data;
  }

  async getReports(filters?: any): Promise<ApiResponse<any[]>> {
    const response = await this.client.get('/reports', { params: filters });
    return response.data;
  }

  async generateReport(reportData: any): Promise<ApiResponse<any>> {
    const response = await this.client.post('/reports/generate', reportData);
    return response.data;
  }

  async exportReport(format: 'pdf' | 'excel' | 'csv', filters?: any): Promise<ApiResponse<{ download_url: string }>> {
    const response = await this.client.get(`/reports/export/${format}`, { params: filters });
    return response.data;
  }

  async getApprovals(): Promise<ApiResponse<any[]>> {
    const response = await this.client.get('/approvals');
    return response.data;
  }

  async approveItem(itemId: number, itemType: 'revenue' | 'expense'): Promise<ApiResponse<any>> {
    const response = await this.client.post(`/approvals/${itemType}/${itemId}/approve`);
    return response.data;
  }

  async rejectItem(itemId: number, itemType: 'revenue' | 'expense', reason?: string): Promise<ApiResponse<any>> {
    const response = await this.client.post(`/approvals/${itemType}/${itemId}/reject`, { reason });
    return response.data;
  }

  // Notifications
  async getNotifications(): Promise<ApiResponse<any[]>> {
    const response = await this.client.get('/notifications');
    return response.data;
  }

  // Admin endpoints
  async createFinanceManager(fmData: any): Promise<ApiResponse<User>> {
    const response = await this.client.post('/admin/finance-managers', fmData);
    return response.data;
  }

  async getHierarchy(): Promise<ApiResponse<any>> {
    const response = await this.client.get('/admin/hierarchy');
    return response.data;
  }

  async triggerBackup(): Promise<ApiResponse<{ message: string }>> {
    const response = await this.client.post('/admin/backup');
    return response.data;
  }

  // Generic request method
  async request<T = any>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.request(config);
    // Normalize response if backend doesn't wrap in {data}
    if (response.data && typeof response.data === 'object' && !('data' in response.data)) {
      return { data: response.data };
    }
    return response.data;
  }
}

export const apiClient = new ApiClient();
export default apiClient;