// lib/services/corporate-client-service.ts
// Finance service for internal management (revenues, expenses, transactions, etc.)
// Connected to actual API client

import apiClient from '../api';

interface FinanceServiceInterface {
  createRevenue(revenueData: any): Promise<any>;
  createExpense(expenseData: any): Promise<any>;
  getTransactions(): Promise<any[]>;
  approveTransaction(transactionId: number, itemType: 'revenue' | 'expense'): Promise<boolean>;
  getRevenues(filters?: Record<string, any>): Promise<any[]>;
  getExpenses(filters?: Record<string, any>): Promise<any[]>;
}

export class FinanceService implements FinanceServiceInterface {
  /**
   * Create a new revenue entry
   */
  async createRevenue(revenueData: any): Promise<any> {
    try {
      const response = await apiClient.createRevenue(revenueData);
      return response.data;
    } catch (error) {
      console.error('Error creating revenue:', error);
      throw error;
    }
  }

  /**
   * Create a new expense entry
   */
  async createExpense(expenseData: any): Promise<any> {
    try {
      const response = await apiClient.createExpense(expenseData);
      return response.data;
    } catch (error) {
      console.error('Error creating expense:', error);
      throw error;
    }
  }

  /**
   * Get all transactions (revenues + expenses combined)
   */
  async getTransactions(): Promise<any[]> {
    try {
      const [revenuesResponse, expensesResponse] = await Promise.all([
        apiClient.getRevenues(),
        apiClient.getExpenses(),
      ]);

      const revenues = (revenuesResponse.data || []).map((r: any) => ({
        ...r,
        type: 'revenue',
      }));

      const expenses = (expensesResponse.data || []).map((e: any) => ({
        ...e,
        type: 'expense',
      }));

      return [...revenues, ...expenses].sort((a, b) => {
        const dateA = new Date(a.date || a.created_at || 0).getTime();
        const dateB = new Date(b.date || b.created_at || 0).getTime();
        return dateB - dateA; // Most recent first
      });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  }

  /**
   * Approve a transaction (revenue or expense)
   */
  async approveTransaction(transactionId: number, itemType: 'revenue' | 'expense'): Promise<boolean> {
    try {
      await apiClient.approveItem(transactionId, itemType);
      return true;
    } catch (error) {
      console.error('Error approving transaction:', error);
      throw error;
    }
  }

  /**
   * Get all revenue entries
   */
  async getRevenues(filters?: Record<string, any>): Promise<any[]> {
    try {
      const response = await apiClient.getRevenues(filters);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching revenues:', error);
      throw error;
    }
  }

  /**
   * Get all expense entries
   */
  async getExpenses(filters?: Record<string, any>): Promise<any[]> {
    try {
      const response = await apiClient.getExpenses(filters);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching expenses:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const financeService = new FinanceService();

// Also export as default for backward compatibility
export default financeService;