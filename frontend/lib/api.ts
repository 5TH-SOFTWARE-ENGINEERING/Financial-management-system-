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
export interface ApiRole {
  id: number;
  name: string;
  description?: string;
  permissions?: string[];
  user_count?: number;
  permission_count?: number;
  created_at?: string;
  updated_at?: string;
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000, // Increased timeout for large data requests (30 seconds)
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
        
        // Handle 401 Unauthorized - redirect to home page (not login, as per user preference)
        if (error.response?.status === 401 && !originalRequest?._retry) {
          originalRequest._retry = true;
          if (typeof window !== 'undefined') {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            // Redirect to home page instead of login page
            window.location.href = '/';
          }
        }
        
        // Handle 403 Forbidden - user doesn't have permission
        if (error.response?.status === 403) {
          const url = error.config?.url || '';
          // Suppress warnings for expected 403s on role-restricted endpoints
          // These are handled gracefully by the calling code
          const suppressWarnings = url.includes('/inventory/summary') || 
                                   url.includes('/sales/summary') || 
                                   url.includes('/sales/summary/overview') ||
                                   url.includes('/sales/journal-entries') ||
                                   url.includes('/backup');
          
          if (!suppressWarnings && typeof window !== 'undefined') {
            console.warn('Access forbidden:', error.response?.data?.detail || 'Insufficient permissions');
          }
        }
        
        // Handle 404 Not Found - suppress console warnings for non-critical endpoints
        if (error.response?.status === 404) {
          const url = error.config?.url || '';
          // Only log 404s in development mode to reduce console noise
          if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
            console.warn('Resource not found:', url);
          }
        }
        
        // Handle network errors - suppress repetitive errors for polling endpoints
        if (!error.response) {
          const url = error.config?.url || '';
          // Suppress errors for polling endpoints to reduce console noise
          // These are expected when backend is down
          const isPollingEndpoint = url.includes('/notifications/unread/count') || 
                                   url.includes('/dashboard/recent-activity') ||
                                   url.includes('/health');
          
          if (!isPollingEndpoint) {
            // Only log non-polling endpoint errors
            const errorMessage = error.message || 'Network error: Unable to connect to server';
            
            if (process.env.NODE_ENV === 'development') {
              console.error('Network error:', errorMessage);
              
              if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
                console.error('Backend server may not be running. Please ensure the backend is running on http://localhost:8000');
              } else if (error.code === 'ERR_NETWORK') {
                console.error('Network request failed. Check your internet connection and backend server status.');
              }
            }
          }
          // Polling endpoint errors are silently handled - they're expected when backend is down
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

  private async delete<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.delete<T>(url, { ...config, data });
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
    return this.get('/users/');
  }

  async getUser(userId: number): Promise<ApiResponse<User>> {
    return this.get(`/users/${userId}`);
  }

  async getSubordinates(userId: number): Promise<ApiResponse<User[]>> {
    return this.get(`/users/${userId}/subordinates`);
  }

  async createUser(userData: any): Promise<ApiResponse<User>> {
    return this.post('/users', userData);
  }

  /**
   * Create a subordinate (accountant or employee)
   * Used by finance managers to create accountants/employees
   */
  async createSubordinate(userData: any): Promise<ApiResponse<User>> {
    return this.post('/users/subordinates', userData);
  }

  async updateUser(userId: number, userData: any): Promise<ApiResponse<User>> {
    return this.put(`/users/${userId}`, userData);
  }

  async deleteUser(userId: number, password: string): Promise<ApiResponse<{ message: string }>> {
    return this.post(`/users/${userId}/delete`, { password });
  }

  async activateUser(userId: number): Promise<ApiResponse<{ message: string }>> {
    return this.post(`/users/${userId}/activate`);
  }

  async deactivateUser(userId: number): Promise<ApiResponse<{ message: string }>> {
    return this.post(`/users/${userId}/deactivate`);
  }

  // Financial endpoints
  async getRevenues(filters?: Record<string, any>): Promise<ApiResponse<any[]>> {
    // For reports, we need all data, so increase limit significantly
    const params = { ...filters, limit: 10000, skip: 0 };
    const response = await this.get('/revenue', { params });
    const data = Array.isArray(response.data) ? response.data : [];
    return { ...response, data };
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

  async deleteRevenue(revenueId: number, password: string): Promise<ApiResponse<{ message: string }>> {
    return this.post(`/revenue/${revenueId}/delete`, { password });
  }

  async getExpenses(filters?: Record<string, any>): Promise<ApiResponse<any[]>> {
    // For reports, we need all data, so increase limit significantly
    const params = { ...filters, limit: 10000, skip: 0 };
    const response = await this.get('/expenses', { params });
    const data = Array.isArray(response.data) ? response.data : [];
    return { ...response, data };
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

  async deleteExpense(expenseId: number, password: string): Promise<ApiResponse<{ message: string }>> {
    return this.post(`/expenses/${expenseId}/delete`, { password });
  }

  // Transactions (combined revenues and expenses)
  async getTransactions(): Promise<ApiResponse<any[]>> {
    try {
      const [revenuesResponse, expensesResponse] = await Promise.all([
        this.getRevenues(),
        this.getExpenses(),
      ]);

      const revenues = (revenuesResponse.data || []).map((r: any) => ({
        ...r,
        transaction_type: 'revenue',
        id: `revenue-${r.id}`,
      }));

      const expenses = (expensesResponse.data || []).map((e: any) => ({
        ...e,
        transaction_type: 'expense',
        id: `expense-${e.id}`,
        amount: -Math.abs(e.amount), // Make expenses negative
      }));

      const transactions = [...revenues, ...expenses].sort((a, b) => {
        const dateA = new Date(a.date || a.created_at || 0).getTime();
        const dateB = new Date(b.date || b.created_at || 0).getTime();
        return dateB - dateA; // Most recent first
      });

      return { data: transactions };
    } catch (error) {
      // Error handled by caller
      throw error;
    }
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

  // Analytics
  async getAdvancedKPIs(params?: {
    period?: 'week' | 'month' | 'quarter' | 'year' | 'custom';
    start_date?: string;
    end_date?: string;
  }): Promise<ApiResponse<any>> {
    return this.get('/analytics/kpis', { params });
  }

  async getTrendAnalysis(params?: {
    metric?: 'revenue' | 'expenses' | 'profit';
    period?: 'week' | 'month' | 'quarter' | 'year' | 'custom';
    start_date?: string;
    end_date?: string;
  }): Promise<ApiResponse<any>> {
    return this.get('/analytics/trends', { params });
  }

  async getTimeSeriesData(params?: {
    interval?: 'day' | 'week' | 'month' | 'quarter' | 'year';
    period?: 'week' | 'month' | 'quarter' | 'year' | 'custom';
    start_date?: string;
    end_date?: string;
  }): Promise<ApiResponse<any>> {
    return this.get('/analytics/time-series', { params });
  }

  async getCategoryBreakdown(params?: {
    period?: 'week' | 'month' | 'quarter' | 'year' | 'custom';
    start_date?: string;
    end_date?: string;
  }): Promise<ApiResponse<any>> {
    return this.get('/analytics/category-breakdown', { params });
  }

  async getAnalyticsOverview(params?: {
    period?: 'week' | 'month' | 'quarter' | 'year' | 'custom';
    start_date?: string;
    end_date?: string;
  }): Promise<ApiResponse<any>> {
    return this.get('/analytics/overview', { params });
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

  // Financial Reports - Direct data fetching
  async getIncomeStatement(startDate?: string, endDate?: string): Promise<ApiResponse<any>> {
    const params: Record<string, any> = {};
    // Convert date strings to ISO datetime format (YYYY-MM-DD -> YYYY-MM-DDTHH:mm:ss)
    if (startDate) {
      const start = new Date(startDate + 'T00:00:00');
      params.start_date = start.toISOString();
    }
    if (endDate) {
      // Set end date to end of day
      const end = new Date(endDate + 'T23:59:59');
      params.end_date = end.toISOString();
    }
    
    // Fetch revenue and expense data to calculate income statement
    // Always fetch all data first, then filter client-side if needed
    const [revenuesRes, expensesRes] = await Promise.all([
      this.getRevenues(),
      this.getExpenses(),
    ]);

    let revenues = revenuesRes.data || [];
    let expenses = expensesRes.data || [];
    
    // Filter by date range if provided (client-side filtering)
    if (startDate && endDate) {
      const start = new Date(startDate + 'T00:00:00').getTime();
      const end = new Date(endDate + 'T23:59:59').getTime();
      
      revenues = revenues.filter((r: any) => {
        const dateStr = r.date || r.created_at;
        if (!dateStr) return true; // Include entries without dates
        try {
          const entryDate = new Date(dateStr).getTime();
          return entryDate >= start && entryDate <= end;
        } catch {
          return true; // Include if date parsing fails
        }
      });
      
      expenses = expenses.filter((e: any) => {
        const dateStr = e.date || e.created_at;
        if (!dateStr) return true; // Include entries without dates
        try {
          const entryDate = new Date(dateStr).getTime();
          return entryDate >= start && entryDate <= end;
        } catch {
          return true; // Include if date parsing fails
        }
      });
    }

    // Filter to only include APPROVED revenue and expense entries
    // This ensures revenue and net profit are only calculated from approved entries
    const approvedRevenues = revenues.filter((r: any) => 
      r.is_approved === true || r.is_approved === 'true' || r.approved === true
    );
    const approvedExpenses = expenses.filter((e: any) => 
      e.is_approved === true || e.is_approved === 'true' || e.approved === true
    );
    
    // Calculate totals - ONLY from approved entries
    const totalRevenue = approvedRevenues.reduce((sum: number, r: any) => sum + Number(r.amount || 0), 0);
    const totalExpenses = approvedExpenses.reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);
    const profit = totalRevenue - totalExpenses;

    // Group by category - handle both enum and string categories - ONLY from approved entries
    const revenueByCategory: Record<string, number> = {};
    approvedRevenues.forEach((r: any) => {
      let cat = r.category;
      if (cat && typeof cat === 'object' && cat.value) {
        cat = cat.value;
      } else if (typeof cat !== 'string') {
        cat = String(cat || 'other');
      }
      cat = cat || 'other';
      revenueByCategory[cat] = (revenueByCategory[cat] || 0) + Number(r.amount || 0);
    });

    const expenseByCategory: Record<string, number> = {};
    approvedExpenses.forEach((e: any) => {
      let cat = e.category;
      if (cat && typeof cat === 'object' && cat.value) {
        cat = cat.value;
      } else if (typeof cat !== 'string') {
        cat = String(cat || 'other');
      }
      cat = cat || 'other';
      expenseByCategory[cat] = (expenseByCategory[cat] || 0) + Number(e.amount || 0);
    });

    return {
      data: {
        period: { start_date: startDate, end_date: endDate },
        revenue: {
          total: totalRevenue,
          by_category: revenueByCategory,
        },
        expenses: {
          total: totalExpenses,
          by_category: expenseByCategory,
        },
        profit,
        profit_margin: totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0,
      },
    };
  }

  async getCashFlow(startDate?: string, endDate?: string): Promise<ApiResponse<any>> {
    const params: Record<string, any> = {};
    // Convert date strings to ISO datetime format (YYYY-MM-DD -> YYYY-MM-DDTHH:mm:ss)
    if (startDate) {
      const start = new Date(startDate + 'T00:00:00');
      params.start_date = start.toISOString();
    }
    if (endDate) {
      // Set end date to end of day
      const end = new Date(endDate + 'T23:59:59');
      params.end_date = end.toISOString();
    }
    
    // Fetch revenue and expense data to calculate cash flow
    // Always fetch all data first, then filter client-side if needed
    const [revenuesRes, expensesRes] = await Promise.all([
      this.getRevenues(),
      this.getExpenses(),
    ]);

    let revenues = revenuesRes.data || [];
    let expenses = expensesRes.data || [];
    
    // Filter by date range if provided (client-side filtering)
    if (startDate && endDate) {
      const start = new Date(startDate + 'T00:00:00').getTime();
      const end = new Date(endDate + 'T23:59:59').getTime();
      
      revenues = revenues.filter((r: any) => {
        const dateStr = r.date || r.created_at;
        if (!dateStr) return true; // Include entries without dates
        try {
          const entryDate = new Date(dateStr).getTime();
          return entryDate >= start && entryDate <= end;
        } catch {
          return true; // Include if date parsing fails
        }
      });
      
      expenses = expenses.filter((e: any) => {
        const dateStr = e.date || e.created_at;
        if (!dateStr) return true; // Include entries without dates
        try {
          const entryDate = new Date(dateStr).getTime();
          return entryDate >= start && entryDate <= end;
        } catch {
          return true; // Include if date parsing fails
        }
      });
    }

    // Filter to only include APPROVED revenue and expense entries
    // This ensures cash flow is only calculated from approved entries
    const approvedRevenues = revenues.filter((r: any) => 
      r.is_approved === true || r.is_approved === 'true' || r.approved === true
    );
    const approvedExpenses = expenses.filter((e: any) => 
      e.is_approved === true || e.is_approved === 'true' || e.approved === true
    );
    
    // Calculate daily cash flow - ONLY from approved entries
    const cashFlowByDay: Record<string, { inflow: number; outflow: number; net: number }> = {};
    
    approvedRevenues.forEach((r: any) => {
      // Handle different date formats - try date, created_at, or use current date
      let dateStr = r.date || r.created_at;
      const day = dateStr ? new Date(dateStr).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      if (!cashFlowByDay[day]) {
        cashFlowByDay[day] = { inflow: 0, outflow: 0, net: 0 };
      }
      const amount = Number(r.amount || 0);
      cashFlowByDay[day].inflow += amount;
      cashFlowByDay[day].net += amount;
    });

    approvedExpenses.forEach((e: any) => {
      // Handle different date formats - try date, created_at, or use current date
      let dateStr = e.date || e.created_at;
      const day = dateStr ? new Date(dateStr).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      if (!cashFlowByDay[day]) {
        cashFlowByDay[day] = { inflow: 0, outflow: 0, net: 0 };
      }
      const amount = Number(e.amount || 0);
      cashFlowByDay[day].outflow += amount;
      cashFlowByDay[day].net -= amount;
    });

    const totalInflow = Object.values(cashFlowByDay).reduce((sum, day) => sum + day.inflow, 0);
    const totalOutflow = Object.values(cashFlowByDay).reduce((sum, day) => sum + day.outflow, 0);
    const netCashFlow = totalInflow - totalOutflow;

    return {
      data: {
        period: { start_date: startDate, end_date: endDate },
        summary: {
          total_inflow: totalInflow,
          total_outflow: totalOutflow,
          net_cash_flow: netCashFlow,
        },
        daily_cash_flow: cashFlowByDay,
      },
    };
  }

  // Financial Summary Report
  async getFinancialSummary(startDate?: string, endDate?: string): Promise<ApiResponse<any>> {
    // Always fetch all data first, then calculate summary
    const [allRevenuesRes, allExpensesRes] = await Promise.all([
      this.getRevenues(),
      this.getExpenses(),
    ]);

    let revenues = allRevenuesRes.data || [];
    let expenses = allExpensesRes.data || [];
    
    // Filter by date range if provided (client-side filtering)
    if (startDate && endDate) {
      const start = new Date(startDate + 'T00:00:00').getTime();
      const end = new Date(endDate + 'T23:59:59').getTime();
      
      revenues = revenues.filter((r: any) => {
        const dateStr = r.date || r.created_at;
        if (!dateStr) return true; // Include entries without dates
        try {
          const entryDate = new Date(dateStr).getTime();
          return entryDate >= start && entryDate <= end;
        } catch {
          return true; // Include if date parsing fails
        }
      });
      
      expenses = expenses.filter((e: any) => {
        const dateStr = e.date || e.created_at;
        if (!dateStr) return true; // Include entries without dates
        try {
          const entryDate = new Date(dateStr).getTime();
          return entryDate >= start && entryDate <= end;
        } catch {
          return true; // Include if date parsing fails
        }
      });
    }
    
    // Filter to only include APPROVED revenue entries for calculations
    // This ensures revenue and net profit are only calculated from approved entries
    const approvedRevenues = revenues.filter((r: any) => 
      r.is_approved === true || r.is_approved === 'true' || r.approved === true
    );
    
    // Filter to only include APPROVED expense entries for calculations
    const approvedExpenses = expenses.filter((e: any) => 
      e.is_approved === true || e.is_approved === 'true' || e.approved === true
    );
    
    // Calculate totals from filtered data - ONLY approved revenue and expenses
    const totalRevenue = approvedRevenues.reduce((sum: number, r: any) => sum + Number(r.amount || 0), 0);
    const totalExpenses = approvedExpenses.reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);
    const profit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

    // Process category summaries - ONLY from approved revenue
    const revenueByCategory: Record<string, number> = {};
    approvedRevenues.forEach((r: any) => {
      let cat = r.category;
      if (cat && typeof cat === 'object' && cat.value) {
        cat = cat.value;
      } else if (typeof cat !== 'string') {
        cat = String(cat || 'other');
      }
      cat = cat || 'other';
      revenueByCategory[cat] = (revenueByCategory[cat] || 0) + Number(r.amount || 0);
    });

    // Process category summaries - ONLY from approved expenses
    const expenseByCategory: Record<string, number> = {};
    approvedExpenses.forEach((e: any) => {
      let cat = e.category;
      if (cat && typeof cat === 'object' && cat.value) {
        cat = cat.value;
      } else if (typeof cat !== 'string') {
        cat = String(cat || 'other');
      }
      cat = cat || 'other';
      expenseByCategory[cat] = (expenseByCategory[cat] || 0) + Number(e.amount || 0);
    });

    // Calculate actual transaction counts - ONLY approved items
    const revenueCount = approvedRevenues.length;
    const expenseCount = approvedExpenses.length;

    const result = {
      data: {
        period: { start_date: startDate, end_date: endDate },
        financials: {
          total_revenue: totalRevenue,
          total_expenses: totalExpenses,
          profit,
          profit_margin: profitMargin,
        },
        revenue_by_category: revenueByCategory,
        expenses_by_category: expenseByCategory,
        transaction_counts: {
          revenue: revenueCount,
          expenses: expenseCount,
          total: revenueCount + expenseCount,
        },
        generated_at: new Date().toISOString(),
      },
    };

    return result;
  }

  // Approvals
  async getApprovals(): Promise<ApiResponse<any[]>> {
    return this.get('/approvals');
  }

  async getApproval(approvalId: number): Promise<ApiResponse<any>> {
    return this.get(`/approvals/${approvalId}`);
  }

  async getApprovalComments(approvalId: number): Promise<ApiResponse<any[]>> {
    return this.get(`/approvals/${approvalId}/comments`);
  }

  async createApprovalComment(approvalId: number, comment: string): Promise<ApiResponse<any>> {
    return this.post(`/approvals/${approvalId}/comments`, { comment });
  }

  async approveItem(itemId: number, itemType: 'revenue' | 'expense'): Promise<ApiResponse<any>> {
    if (itemType === 'revenue') {
      return this.post(`/revenue/${itemId}/approve`);
    } else {
      return this.post(`/expenses/${itemId}/approve`);
    }
  }

  async rejectItem(itemId: number, itemType: 'revenue' | 'expense', reason: string, password: string): Promise<ApiResponse<any>> {
    // Reject revenue or expense entry through their respective endpoints
    if (itemType === 'revenue') {
      return this.post(`/revenue/${itemId}/reject`, { reason: reason || 'No reason provided', password });
    } else {
      return this.post(`/expenses/${itemId}/reject`, { reason: reason || 'No reason provided', password });
    }
  }

  async approveWorkflow(workflowId: number): Promise<ApiResponse<any>> {
    return this.post(`/approvals/${workflowId}/approve`);
  }

  async rejectWorkflow(workflowId: number, reason: string, password: string): Promise<ApiResponse<any>> {
    return this.post(`/approvals/${workflowId}/reject`, { rejection_reason: reason, password });
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

  async getSystemSettings(): Promise<ApiResponse<any>> {
    return this.get('/admin/settings');
  }

  async getSystemHealth(): Promise<ApiResponse<any>> {
    return this.get('/admin/health');
  }

  async getHierarchy(): Promise<ApiResponse<any>> {
    return this.get('/admin/hierarchy');
  }

  async getRoles(): Promise<ApiResponse<any[]>> {
    return this.get('/admin/roles');
  }

  async getPermissions(): Promise<ApiResponse<string[]>> {
    return this.get('/admin/permissions');
  }

  async createRole(roleData: { name: string; description?: string; permissions?: string[] }): Promise<ApiResponse<ApiRole>> {
    const payload = {
      ...roleData,
      permissions: roleData.permissions?.map((perm) => perm.trim()).filter(Boolean),
    };
    return this.post('/admin/roles', payload);
  }

  async updateRole(roleId: number, roleData: { name?: string; description?: string; permissions?: string[] }): Promise<ApiResponse<ApiRole>> {
    const payload = {
      ...roleData,
      permissions: roleData.permissions?.map((perm) => perm.trim()).filter(Boolean),
    };
    return this.put(`/admin/roles/${roleId}`, payload);
  }

  async deleteRole(roleId: number): Promise<ApiResponse<null>> {
    return this.delete(`/admin/roles/${roleId}`);
  }

  // Backup endpoints
  async createBackup(includeFiles: boolean = false): Promise<ApiResponse<{ message: string }>> {
    const response = await this.client.post('/admin/backup/create', null, {
      params: { include_files: includeFiles }
    });
    return this.normalizeResponse<{ message: string }>(response.data);
  }

  async listBackups(): Promise<ApiResponse<{ backups: any[] }>> {
    return this.get('/admin/backup/list');
  }

  async restoreBackup(backupName: string): Promise<ApiResponse<{ message: string }>> {
    const response = await this.client.post('/admin/backup/restore', null, {
      params: { backup_name: backupName }
    });
    return this.normalizeResponse<{ message: string }>(response.data);
  }

  async deleteBackup(backupName: string): Promise<ApiResponse<{ message: string }>> {
    return this.delete(`/admin/backup/${encodeURIComponent(backupName)}`);
  }

  async getVerificationHistory(): Promise<ApiResponse<any[]>> {
    return this.get('/users/me/verification-history');
  }

  // 2FA endpoints
  async get2FAStatus(): Promise<ApiResponse<{ enabled: boolean }>> {
    return this.get('/users/me/2fa/status');
  }

  async setup2FA(): Promise<ApiResponse<{ secret: string; qr_code_url: string; manual_entry_key: string }>> {
    return this.post('/users/me/2fa/setup');
  }

  async verify2FA(code: string): Promise<ApiResponse<{ message: string; enabled: boolean }>> {
    return this.post('/users/me/2fa/verify', { code });
  }

  async disable2FA(currentPassword: string): Promise<ApiResponse<{ message: string; enabled: boolean }>> {
    return this.post('/users/me/2fa/disable', { current_password: currentPassword });
  }

  // IP Restriction endpoints
  async getIPRestrictionStatus(): Promise<ApiResponse<{ enabled: boolean; allowed_ips: string[] }>> {
    return this.get('/users/me/ip-restriction');
  }

  async updateIPRestriction(enabled: boolean): Promise<ApiResponse<{ enabled: boolean; allowed_ips: string[] }>> {
    return this.put('/users/me/ip-restriction', { enabled });
  }

  async addAllowedIP(ipAddress: string): Promise<ApiResponse<{ enabled: boolean; allowed_ips: string[] }>> {
    return this.post('/users/me/ip-restriction/allowed-ips', { ip_address: ipAddress });
  }

  async removeAllowedIP(ipAddress: string): Promise<ApiResponse<{ enabled: boolean; allowed_ips: string[] }>> {
    return this.delete(`/users/me/ip-restriction/allowed-ips/${encodeURIComponent(ipAddress)}`);
  }

  async triggerBackup(includeFiles = false): Promise<ApiResponse<{ message: string }>> {
    return this.post('/admin/backup/create', undefined, { params: { include_files: includeFiles } });
  }

  // Department endpoints
  async getDepartments(): Promise<ApiResponse<any[]>> {
    return this.get('/departments');
  }

  async getDepartment(departmentId: string | number): Promise<ApiResponse<any>> {
    return this.get(`/departments/${departmentId}`);
  }

  async createDepartment(departmentData: any): Promise<ApiResponse<any>> {
    return this.post('/departments', departmentData);
  }

  async updateDepartment(departmentId: string | number, departmentData: any): Promise<ApiResponse<any>> {
    return this.put(`/departments/${departmentId}`, departmentData);
  }

  async deleteDepartment(departmentId: string | number, password: string): Promise<ApiResponse<{ message: string }>> {
    return this.post(`/departments/${departmentId}/delete`, { password });
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

  async deleteProject(projectId: number, password: string): Promise<ApiResponse<{ message: string }>> {
    return this.post(`/projects/${projectId}/delete`, { password });
  }

  // Audit Logs endpoints (Admin only)
  async getAuditLogs(filters?: {
    skip?: number;
    limit?: number;
    user_id?: number;
    action?: string;
    resource_type?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<ApiResponse<any[]>> {
    const params: Record<string, any> = {};
    if (filters) {
      if (filters.skip !== undefined) params.skip = filters.skip;
      if (filters.limit !== undefined) params.limit = filters.limit;
      if (filters.user_id !== undefined) params.user_id = filters.user_id;
      if (filters.action) params.action = filters.action;
      if (filters.resource_type) params.resource_type = filters.resource_type;
      if (filters.start_date) {
        // Convert to ISO format for backend
        const start = new Date(filters.start_date + 'T00:00:00');
        params.start_date = start.toISOString();
      }
      if (filters.end_date) {
        // Convert to ISO format for backend
        const end = new Date(filters.end_date + 'T23:59:59');
        params.end_date = end.toISOString();
      }
    }
    return this.get('/admin/audit/logs', { params });
  }

  // ============================================================================
  // BUDGETING & FORECASTING (FP&A)
  // ============================================================================

  // Budget Management
  async getBudgets(params?: { skip?: number; limit?: number; status?: string; department?: string }) {
    return this.get('/budgeting/budgets', { params });
  }

  async getBudget(id: number) {
    return this.get(`/budgeting/budgets/${id}`);
  }

  async createBudget(data: any) {
    return this.post('/budgeting/budgets', data);
  }

  async createBudgetFromTemplate(templateName: string, data: any) {
    const params: any = {
      template_name: templateName
    };
    if (data.name) params.name = data.name;
    if (data.start_date) params.start_date = data.start_date;
    if (data.end_date) params.end_date = data.end_date;
    if (data.department) params.department = data.department;
    if (data.project) params.project = data.project;
    
    return this.post(`/budgeting/budgets/from-template`, {}, { params });
  }

  async updateBudget(id: number, data: any) {
    return this.put(`/budgeting/budgets/${id}`, data);
  }

  async deleteBudget(id: number, password: string) {
    return this.post(`/budgeting/budgets/${id}/delete`, { password });
  }

  async validateBudget(id: number) {
    return this.post(`/budgeting/budgets/${id}/validate`);
  }

  // Budget Items
  async getBudgetItems(budgetId: number) {
    return this.get(`/budgeting/budgets/${budgetId}/items`);
  }

  async createBudgetItem(budgetId: number, data: any) {
    return this.post(`/budgeting/budgets/${budgetId}/items`, data);
  }

  async updateBudgetItem(budgetId: number, itemId: number, data: any) {
    return this.put(`/budgeting/budgets/${budgetId}/items/${itemId}`, data);
  }

  async deleteBudgetItem(budgetId: number, itemId: number, password: string) {
    return this.post(`/budgeting/budgets/${budgetId}/items/${itemId}/delete`, { password });
  }

  // Scenario Planning
  async getScenarios(budgetId: number) {
    return this.get(`/budgeting/budgets/${budgetId}/scenarios`);
  }

  async createScenario(budgetId: number, data: any) {
    return this.post(`/budgeting/budgets/${budgetId}/scenarios`, data);
  }

  async compareScenarios(budgetId: number, scenarioIds: number[]) {
    return this.post(`/budgeting/budgets/${budgetId}/scenarios/compare`, { scenario_ids: scenarioIds });
  }

  // Forecasting
  async getForecasts(params?: { skip?: number; limit?: number }) {
    return this.get('/budgeting/forecasts', { params });
  }

  async createForecast(data: any) {
    return this.post('/budgeting/forecasts', data);
  }

  async getForecast(id: number) {
    return this.get(`/budgeting/forecasts/${id}`);
  }

  async deleteForecast(id: number) {
    return this.delete(`/budgeting/forecasts/${id}`);
  }

  // Variance Analysis
  async calculateVariance(budgetId: number, periodStart: string, periodEnd: string) {
    return this.post(`/budgeting/budgets/${budgetId}/variance`, {}, {
      params: { period_start: periodStart, period_end: periodEnd }
    });
  }

  async getVarianceHistory(budgetId: number, params?: { skip?: number; limit?: number }) {
    return this.get(`/budgeting/budgets/${budgetId}/variance`, { params });
  }

  async getVarianceSummary(budgetId: number) {
    return this.get(`/budgeting/budgets/${budgetId}/variance/summary`);
  }

  // ============================================================================
  // INVENTORY MANAGEMENT API
  // ============================================================================
  
  async createInventoryItem(itemData: {
    item_name: string;
    buying_price: number;
    expense_amount?: number;
    selling_price: number;
    quantity: number;
    description?: string;
    category?: string;
    sku?: string;
    is_active?: boolean;
  }) {
    return this.post('/inventory/items', itemData);
  }

  async getInventoryItems(params?: {
    skip?: number;
    limit?: number;
    category?: string;
    is_active?: boolean;
    search?: string;
  }) {
    return this.get('/inventory/items', { params });
  }

  async getInventoryItem(itemId: number) {
    return this.get(`/inventory/items/${itemId}`);
  }

  async updateInventoryItem(itemId: number, itemData: {
    item_name?: string;
    buying_price?: number;
    expense_amount?: number;
    selling_price?: number;
    quantity?: number;
    description?: string;
    category?: string;
    sku?: string;
    is_active?: boolean;
  }) {
    return this.put(`/inventory/items/${itemId}`, itemData);
  }

  async deleteInventoryItem(itemId: number, password: string) {
    return this.post(`/inventory/items/${itemId}/delete`, { password });
  }

  async activateInventoryItem(itemId: number, password: string) {
    return this.post(`/inventory/items/${itemId}/activate`, { password });
  }

  async deactivateInventoryItem(itemId: number, password: string) {
    return this.post(`/inventory/items/${itemId}/deactivate`, { password });
  }

  async getInventoryAuditLogs(itemId: number, params?: { skip?: number; limit?: number }) {
    return this.get(`/inventory/items/${itemId}/audit`, { params });
  }

  async getLowStockItems(threshold?: number) {
    return this.get('/inventory/items/low-stock/list', { params: { threshold } });
  }

  async getInventorySummary() {
    return this.get('/inventory/summary');
  }

  // ============================================================================
  // SALES API
  // ============================================================================

  async createSale(saleData: {
    item_id: number;
    quantity_sold: number;
    customer_name?: string;
    customer_email?: string;
    notes?: string;
  }) {
    return this.post('/sales/', saleData);
  }

  async getSales(params?: {
    skip?: number;
    limit?: number;
    status?: 'pending' | 'posted' | 'cancelled';
    item_id?: number;
    start_date?: string;
    end_date?: string;
  }) {
    return this.get('/sales', { params });
  }

  async getSale(saleId: number) {
    return this.get(`/sales/${saleId}`);
  }

  async postSale(saleId: number, postData: {
    debit_account?: string;
    credit_account?: string;
    reference_number?: string;
    notes?: string;
  }) {
    return this.post(`/sales/${saleId}/post`, postData);
  }

  async cancelSale(saleId: number) {
    return this.post(`/sales/${saleId}/cancel`, {});
  }

  async getSalesSummary(params?: { start_date?: string; end_date?: string }) {
    return this.get('/sales/summary/overview', { params });
  }

  async getReceipt(saleId: number) {
    return this.get(`/sales/receipt/${saleId}`);
  }

  async getJournalEntries(params?: {
    skip?: number;
    limit?: number;
    start_date?: string;
    end_date?: string;
  }) {
    return this.get('/sales/journal-entries/list', { params });
  }

  // Generic request method
  async request<T = any>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.request<T>(config);
    return this.normalizeResponse<T>(response.data);
  }
}

export const apiClient = new ApiClient();
export default apiClient;