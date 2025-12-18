// lib/services/corporate-client-service.ts
// Finance service for internal management (revenues, expenses, transactions, etc.)
// Connected to actual API client

import apiClient from '../api';

type Revenue = {
  id?: number | string;
  date?: string;
  created_at?: string;
  [key: string]: unknown;
};

type Expense = {
  id?: number | string;
  date?: string;
  created_at?: string;
  [key: string]: unknown;
};

type Transaction = (Revenue | Expense) & { type: 'revenue' | 'expense' };

type Filters = Record<string, string | number | boolean | undefined>;

interface FinanceServiceInterface {
  createRevenue(revenueData: Revenue): Promise<Revenue>;
  createExpense(expenseData: Expense): Promise<Expense>;
  getTransactions(): Promise<Transaction[]>;
  approveTransaction(transactionId: number, itemType: 'revenue' | 'expense'): Promise<boolean>;
  getRevenues(filters?: Filters): Promise<Revenue[]>;
  getExpenses(filters?: Filters): Promise<Expense[]>;
}

export class FinanceService implements FinanceServiceInterface {
  /**
   * Create a new revenue entry
   */
  async createRevenue(revenueData: Revenue): Promise<Revenue> {
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
  async createExpense(expenseData: Expense): Promise<Expense> {
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
  async getTransactions(): Promise<Transaction[]> {
    try {
      const [revenuesResponse, expensesResponse] = await Promise.all([
        apiClient.getRevenues(),
        apiClient.getExpenses(),
      ]);

      const revenues = (revenuesResponse.data || []).map((r: Revenue): Transaction => ({
        ...r,
        type: 'revenue' as const,
      }));

      const expenses = (expensesResponse.data || []).map((e: Expense): Transaction => ({
        ...e,
        type: 'expense' as const,
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
  async getRevenues(filters?: Filters): Promise<Revenue[]> {
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
  async getExpenses(filters?: Filters): Promise<Expense[]> {
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