'use client';
import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Layout from '@/components/layout';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/lib/rbac/auth-context';
import { toast } from 'sonner';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Download,
  RefreshCw,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  BarChart3
} from 'lucide-react';

// ──────────────────────────────────────────
// Styled Components
// ──────────────────────────────────────────
const PageContainer = styled.div`
  padding: 32px;
  max-width: 800px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: 32px;
  
  h1 {
    font-size: 32px;
    font-weight: 700;
    margin-bottom: 8px;
    color: var(--foreground);
  }
  
  p {
    color: var(--muted-foreground);
    font-size: 16px;
  }
`;

const DateFilterCard = styled.div`
  background: #fff;
  padding: 24px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
  margin-bottom: 24px;
  display: flex;
  gap: 16px;
  align-items: flex-end;
  flex-wrap: wrap;
`;

const DateInputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-width: 200px;
`;

const ReportSection = styled.div`
  margin-bottom: 32px;
`;

const ReportCard = styled.div`
  background: #fff;
  padding: 28px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
  margin-bottom: 24px;
`;

const ReportHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e5e7eb;
  
  h2 {
    font-size: 24px;
    font-weight: 600;
    color: var(--foreground);
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  p {
    color: var(--muted-foreground);
    font-size: 14px;
    margin-top: 4px;
  }
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
`;

const SummaryCard = styled.div<{ $type?: 'revenue' | 'expense' | 'profit' | 'cash' }>`
  background: ${(p) => {
    if (p.$type === 'revenue') return '#f0fdf4';
    if (p.$type === 'expense') return '#fef2f2';
    if (p.$type === 'profit') return '#eff6ff';
    return '#f9fafb';
  }};
  border: 1px solid ${(p) => {
    if (p.$type === 'revenue') return '#bbf7d0';
    if (p.$type === 'expense') return '#fecaca';
    if (p.$type === 'profit') return '#bfdbfe';
    return '#e5e7eb';
  }};
  padding: 20px;
  border-radius: 8px;
  
  .label {
    font-size: 14px;
    color: var(--muted-foreground);
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  
  .value {
    font-size: 28px;
    font-weight: 700;
    color: var(--foreground);
  }
  
  .sub-value {
    font-size: 14px;
    color: var(--muted-foreground);
    margin-top: 4px;
  }
`;

const CategoryTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 16px;
  
  thead {
    background: var(--muted);
    border-bottom: 2px solid var(--border);
    
    th {
      text-align: left;
      padding: 12px 16px;
      font-weight: 600;
      color: var(--foreground);
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
  }
  
  tbody {
    tr {
      border-bottom: 1px solid var(--border);
      transition: background-color 0.2s;
      
      &:hover {
        background: var(--muted);
      }
      
      td {
        padding: 12px 16px;
        color: var(--muted-foreground);
        font-size: 14px;
        
        &:last-child {
          font-weight: 600;
          color: var(--foreground);
        }
      }
    }
  }
`;

const CashFlowTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 16px;
  
  thead {
    background: var(--muted);
    border-bottom: 2px solid var(--border);
    
    th {
      text-align: left;
      padding: 12px 16px;
      font-weight: 600;
      color: var(--foreground);
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
  }
  
  tbody {
    tr {
      border-bottom: 1px solid var(--border);
      transition: background-color 0.2s;
      
      &:hover {
        background: var(--muted);
      }
      
      td {
        padding: 12px 16px;
        color: var(--muted-foreground);
        font-size: 14px;
        
        &:nth-child(2) {
          color: #059669;
          font-weight: 500;
        }
        
        &:nth-child(3) {
          color: #dc2626;
          font-weight: 500;
        }
        
        &:last-child {
          font-weight: 600;
          color: var(--foreground);
        }
      }
    }
  }
`;

const LoadingContainer = styled.div`
  padding: 48px;
  text-align: center;
  
  p {
    color: var(--muted-foreground);
    margin-top: 16px;
  }
`;

const Spinner = styled.div`
  width: 32px;
  height: 32px;
  border: 3px solid var(--border);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const ErrorMessage = styled.div`
  background: #fee2e2;
  border: 1px solid #fecaca;
  color: #991b1b;
  padding: 14px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 48px 24px;
  color: var(--muted-foreground);
  
  svg {
    margin: 0 auto 16px;
    color: var(--muted-foreground);
  }
  
  h3 {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 8px;
    color: var(--foreground);
  }
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 16px;
`;

interface IncomeStatement {
  period: { start_date?: string; end_date?: string };
  revenue: {
    total: number;
    by_category: Record<string, number>;
  };
  expenses: {
    total: number;
    by_category: Record<string, number>;
  };
  profit: number;
  profit_margin: number;
}

interface CashFlow {
  period: { start_date?: string; end_date?: string };
  summary: {
    total_inflow: number;
    total_outflow: number;
    net_cash_flow: number;
  };
  daily_cash_flow: Record<string, { inflow: number; outflow: number; net: number }>;
}

interface FinancialSummary {
  period: { start_date?: string; end_date?: string };
  financials: {
    total_revenue: number;
    total_expenses: number;
    profit: number;
    profit_margin: number;
  };
  revenue_by_category: Record<string, number>;
  expenses_by_category: Record<string, number>;
  transaction_counts: {
    revenue: number;
    expenses: number;
    total: number;
  };
  generated_at: string;
}

export default function ReportPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Date filters - Default to last 12 months to ensure we capture all data
  const [startDate, setStartDate] = useState<string>(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 1); // Last 12 months
    date.setDate(1); // Start of month
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1); // Include today
    return tomorrow.toISOString().split('T')[0];
  });
  
  // Report data
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [incomeStatement, setIncomeStatement] = useState<IncomeStatement | null>(null);
  const [cashFlow, setCashFlow] = useState<CashFlow | null>(null);

  // Load reports when user is available
  useEffect(() => {
    if (user) {
      // Small delay to ensure state is ready
      const timer = setTimeout(() => {
        loadReports(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [user]);

  // Reload when date filters change (with debounce)
  useEffect(() => {
    if (user && startDate && endDate) {
      const timer = setTimeout(() => {
        loadReports(true);
      }, 300); // Debounce date changes
      return () => clearTimeout(timer);
    }
  }, [startDate, endDate]);

  const loadReports = async (useDateFilter: boolean = true) => {
    setLoading(true);
    setError(null);
    
    // Debug: Log user info
    console.log('Loading reports for user:', {
      user_id: user?.id,
      user_email: user?.email,
      user_role: user?.role,
      useDateFilter,
    });
    
    try {
      // Load reports - optionally without date filters to get all data
      const dateParams = useDateFilter ? { startDate, endDate } : { startDate: undefined, endDate: undefined };
      
      console.log('Fetching reports with params:', dateParams);
      
      // Use Promise.allSettled to handle partial failures gracefully
      const [summaryResult, incomeResult, cashFlowResult] = await Promise.allSettled([
        apiClient.getFinancialSummary(dateParams.startDate, dateParams.endDate),
        apiClient.getIncomeStatement(dateParams.startDate, dateParams.endDate),
        apiClient.getCashFlow(dateParams.startDate, dateParams.endDate),
      ]);
      
      console.log('Report fetch results:', {
        summary: summaryResult.status,
        income: incomeResult.status,
        cashFlow: cashFlowResult.status,
      });
      
      // Handle summary result
      if (summaryResult.status === 'fulfilled') {
        const summaryData = summaryResult.value.data || summaryResult.value;
        // Ensure we have valid data structure
        if (summaryData && (summaryData.financials || summaryData.revenue_by_category || summaryData.expenses_by_category)) {
          console.log('Financial Summary loaded:', {
            total_revenue: summaryData.financials?.total_revenue,
            total_expenses: summaryData.financials?.total_expenses,
            revenue_categories: Object.keys(summaryData.revenue_by_category || {}).length,
            expense_categories: Object.keys(summaryData.expenses_by_category || {}).length,
          });
          setFinancialSummary(summaryData);
        } else {
          console.warn('Invalid summary data structure:', summaryData);
          setFinancialSummary(null);
        }
      } else {
        console.error('Failed to load financial summary:', summaryResult.reason);
        // Try to load income statement as fallback
        if (incomeResult.status === 'fulfilled') {
          const incomeData = incomeResult.value.data;
          // We can't get exact transaction counts from income statement alone,
          // so we'll fetch them separately or use a reasonable estimate
          // For now, use category count as a proxy (will be updated when we have actual data)
          const revenueCategories = Object.keys(incomeData.revenue.by_category).length;
          const expenseCategories = Object.keys(incomeData.expenses.by_category).length;
          setFinancialSummary({
            period: { start_date: startDate, end_date: endDate },
            financials: {
              total_revenue: incomeData.revenue.total,
              total_expenses: incomeData.expenses.total,
              profit: incomeData.profit,
              profit_margin: incomeData.profit_margin,
            },
            revenue_by_category: incomeData.revenue.by_category,
            expenses_by_category: incomeData.expenses.by_category,
            transaction_counts: {
              revenue: revenueCategories > 0 ? revenueCategories : 0,
              expenses: expenseCategories > 0 ? expenseCategories : 0,
              total: revenueCategories + expenseCategories,
            },
            generated_at: new Date().toISOString(),
          });
        } else {
          // If both failed, set empty summary to show empty state
          setFinancialSummary(null);
        }
      }
      
      // Handle income statement result
      if (incomeResult.status === 'fulfilled') {
        const incomeData = incomeResult.value.data || incomeResult.value;
        // Ensure we have valid data structure
        if (incomeData && (incomeData.revenue || incomeData.expenses)) {
          console.log('Income Statement loaded:', {
            revenue_total: incomeData.revenue?.total,
            expenses_total: incomeData.expenses?.total,
            profit: incomeData.profit,
          });
          setIncomeStatement(incomeData);
        } else {
          console.warn('Invalid income statement data structure:', incomeData);
          setIncomeStatement(null);
        }
      } else {
        console.error('Failed to load income statement:', incomeResult.reason);
        setIncomeStatement(null);
      }
      
      // Handle cash flow result
      if (cashFlowResult.status === 'fulfilled') {
        const cashFlowData = cashFlowResult.value.data || cashFlowResult.value;
        // Ensure we have valid data structure
        if (cashFlowData && (cashFlowData.summary || cashFlowData.daily_cash_flow)) {
          console.log('Cash Flow loaded:', {
            total_inflow: cashFlowData.summary?.total_inflow,
            total_outflow: cashFlowData.summary?.total_outflow,
            net_cash_flow: cashFlowData.summary?.net_cash_flow,
            daily_entries: Object.keys(cashFlowData.daily_cash_flow || {}).length,
          });
          setCashFlow(cashFlowData);
        } else {
          console.warn('Invalid cash flow data structure:', cashFlowData);
          setCashFlow(null);
        }
      } else {
        console.error('Failed to load cash flow:', cashFlowResult.reason);
        setCashFlow(null);
      }
      
      // If all failed, show error but don't throw (allow empty state display)
      if (summaryResult.status === 'rejected' && incomeResult.status === 'rejected' && cashFlowResult.status === 'rejected') {
        const firstError = summaryResult.reason || incomeResult.reason || cashFlowResult.reason;
        // Extract error message
        let errorMsg = 'Failed to load reports';
        if (firstError?.response?.data?.detail) {
          const detail = firstError.response.data.detail;
          if (typeof detail === 'string') {
            errorMsg = detail;
          } else if (Array.isArray(detail)) {
            errorMsg = detail.map((e: any) => typeof e === 'string' ? e : e.msg || JSON.stringify(e)).join(', ');
          }
        } else if (firstError?.message) {
          errorMsg = firstError.message;
        }
        setError(errorMsg);
        toast.error(errorMsg);
        // Set empty states
        setFinancialSummary(null);
        setIncomeStatement(null);
        setCashFlow(null);
      }
      
    } catch (err: any) {
      let errorMessage = 'Failed to load reports';
      
      // Handle different error formats
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        
        // If it's an array of validation errors (Pydantic format)
        if (Array.isArray(detail)) {
          errorMessage = detail.map((e: any) => {
            if (typeof e === 'string') return e;
            if (e.msg) return `${e.loc?.join('.') || 'Field'}: ${e.msg}`;
            return JSON.stringify(e);
          }).join(', ');
        }
        // If it's a single validation error object
        else if (typeof detail === 'object' && detail.msg) {
          errorMessage = `${detail.loc?.join('.') || 'Field'}: ${detail.msg}`;
        }
        // If it's a string
        else if (typeof detail === 'string') {
          errorMessage = detail;
        }
        // Otherwise stringify it
        else {
          errorMessage = JSON.stringify(detail);
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const capitalize = (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');
  };

  if (!user) {
    return (
      <Layout>
        <PageContainer>
          <EmptyState>
            <FileText size={48} />
            <h3>Please log in to view reports</h3>
          </EmptyState>
        </PageContainer>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageContainer>
        <Header>
          <h1>Financial Reports</h1>
          <p>Income Statement and Cash Flow Analysis</p>
        </Header>

        {/* Date Filters */}
        <DateFilterCard>
          <DateInputGroup>
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </DateInputGroup>
          <DateInputGroup>
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </DateInputGroup>
          <ButtonRow>
            <Button 
              onClick={() => {
                // Set date range to last year to show all data
                const oneYearAgo = new Date();
                oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
                oneYearAgo.setDate(1); // Start of month
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                setStartDate(oneYearAgo.toISOString().split('T')[0]);
                setEndDate(tomorrow.toISOString().split('T')[0]);
                loadReports(true);
              }}
              variant="outline"
              disabled={loading}
            >
              Show All Data (1 Year)
            </Button>
            <Button 
              onClick={(e) => {
                e.preventDefault();
                loadReports(false);
              }}
              variant="outline"
              disabled={loading}
            >
              Load Without Date Filter
            </Button>
            <Button onClick={() => loadReports(true)} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </>
              )}
            </Button>
          </ButtonRow>
        </DateFilterCard>

        {error && (
          <ErrorMessage>
            <BarChart3 size={18} />
            <span>{error}</span>
          </ErrorMessage>
        )}

        {loading ? (
          <LoadingContainer>
            <Spinner />
            <p>Loading financial reports...</p>
          </LoadingContainer>
        ) : (
          <>
            {/* Financial Summary Report */}
            <ReportSection>
              <ReportCard>
                <ReportHeader>
                  <div>
                    <h2>
                      <BarChart3 size={24} />
                      Financial Summary Report
                    </h2>
                    <p>
                      Period: {formatDate(startDate)} - {formatDate(endDate)}
                      {financialSummary?.generated_at && (
                        <> • Generated: {formatDate(financialSummary.generated_at)}</>
                      )}
                    </p>
                  </div>
                </ReportHeader>

                {financialSummary ? (
                  <>
                    <SummaryGrid>
                      <SummaryCard $type="revenue">
                        <div className="label">
                          <ArrowUpRight size={16} />
                          Total Revenue
                        </div>
                        <div className="value">
                          {formatCurrency(financialSummary.financials?.total_revenue || 0)}
                        </div>
                        <div className="sub-value">
                          {financialSummary.transaction_counts.revenue} revenue transactions
                        </div>
                      </SummaryCard>
                      <SummaryCard $type="expense">
                        <div className="label">
                          <ArrowDownRight size={16} />
                          Total Expenses
                        </div>
                        <div className="value">
                          {formatCurrency(financialSummary.financials?.total_expenses || 0)}
                        </div>
                        <div className="sub-value">
                          {financialSummary.transaction_counts?.expenses || 0} expense transactions
                        </div>
                      </SummaryCard>
                      <SummaryCard $type="profit">
                        <div className="label">
                          <TrendingUp size={16} />
                          Net Profit
                        </div>
                        <div className="value">
                          {formatCurrency(financialSummary.financials?.profit || 0)}
                        </div>
                        <div className="sub-value">
                          Profit Margin: {(financialSummary.financials?.profit_margin || 0).toFixed(2)}%
                        </div>
                      </SummaryCard>
                      <SummaryCard>
                        <div className="label">
                          <FileText size={16} />
                          Total Transactions
                        </div>
                        <div className="value">{financialSummary.transaction_counts?.total || 0}</div>
                        <div className="sub-value">
                          {financialSummary.transaction_counts?.revenue || 0} revenue + {financialSummary.transaction_counts?.expenses || 0} expenses
                        </div>
                      </SummaryCard>
                    </SummaryGrid>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginTop: '32px' }}>
                      <div>
                        <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>
                          Top Revenue Categories
                        </h3>
                        <CategoryTable>
                          <thead>
                            <tr>
                              <th>Category</th>
                              <th style={{ textAlign: 'right' }}>Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {financialSummary.revenue_by_category && Object.entries(financialSummary.revenue_by_category).length > 0 ? (
                              Object.entries(financialSummary.revenue_by_category)
                                .sort(([, a], [, b]) => (b as number) - (a as number))
                                .slice(0, 5)
                                .map(([category, amount]) => (
                                  <tr key={category}>
                                    <td>{capitalize(category)}</td>
                                    <td style={{ textAlign: 'right' }}>{formatCurrency(amount as number)}</td>
                                  </tr>
                                ))
                            ) : (
                              <tr>
                                <td colSpan={2} style={{ textAlign: 'center', color: 'var(--muted-foreground)' }}>
                                  No revenue data
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </CategoryTable>
                      </div>

                      <div>
                        <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>
                          Top Expense Categories
                        </h3>
                        <CategoryTable>
                          <thead>
                            <tr>
                              <th>Category</th>
                              <th style={{ textAlign: 'right' }}>Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {financialSummary.expenses_by_category && Object.entries(financialSummary.expenses_by_category).length > 0 ? (
                              Object.entries(financialSummary.expenses_by_category)
                                .sort(([, a], [, b]) => (b as number) - (a as number))
                                .slice(0, 5)
                                .map(([category, amount]) => (
                                  <tr key={category}>
                                    <td>{capitalize(category)}</td>
                                    <td style={{ textAlign: 'right' }}>{formatCurrency(amount as number)}</td>
                                  </tr>
                                ))
                            ) : (
                              <tr>
                                <td colSpan={2} style={{ textAlign: 'center', color: 'var(--muted-foreground)' }}>
                                  No expense data
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </CategoryTable>
                      </div>
                    </div>
                  </>
                ) : (
                  <EmptyState>
                    <BarChart3 size={48} />
                    <h3>No summary data available</h3>
                  </EmptyState>
                )}
              </ReportCard>
            </ReportSection>

            {/* Income Statement (Profit & Loss) */}
            <ReportSection>
              <ReportCard>
                <ReportHeader>
                  <div>
                    <h2>
                      <FileText size={24} />
                      Income Statement (Profit & Loss)
                    </h2>
                    <p>
                      Period: {formatDate(startDate)} - {formatDate(endDate)}
                    </p>
                  </div>
                </ReportHeader>

                {incomeStatement ? (
                  <>
                    <SummaryGrid>
                      <SummaryCard $type="revenue">
                        <div className="label">
                          <ArrowUpRight size={16} />
                          Total Revenue
                        </div>
                        <div className="value">
                          {formatCurrency(incomeStatement.revenue?.total || 0)}
                        </div>
                      </SummaryCard>
                      <SummaryCard $type="expense">
                        <div className="label">
                          <ArrowDownRight size={16} />
                          Total Expenses
                        </div>
                        <div className="value">
                          {formatCurrency(incomeStatement.expenses?.total || 0)}
                        </div>
                      </SummaryCard>
                      <SummaryCard $type="profit">
                        <div className="label">
                          <TrendingUp size={16} />
                          Net Profit
                        </div>
                        <div className="value">
                          {formatCurrency(incomeStatement.profit || 0)}
                        </div>
                        <div className="sub-value">
                          Profit Margin: {(incomeStatement.profit_margin || 0).toFixed(2)}%
                        </div>
                      </SummaryCard>
                    </SummaryGrid>

                    <div style={{ marginTop: '32px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>
                        Revenue by Category
                      </h3>
                      <CategoryTable>
                        <thead>
                          <tr>
                            <th>Category</th>
                            <th style={{ textAlign: 'right' }}>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {incomeStatement.revenue?.by_category && Object.entries(incomeStatement.revenue.by_category).length > 0 ? (
                            Object.entries(incomeStatement.revenue.by_category)
                              .sort(([, a], [, b]) => (b as number) - (a as number))
                              .map(([category, amount]) => (
                                <tr key={category}>
                                  <td>{capitalize(category)}</td>
                                  <td style={{ textAlign: 'right' }}>{formatCurrency(amount as number)}</td>
                                </tr>
                              ))
                          ) : (
                            <tr>
                              <td colSpan={2} style={{ textAlign: 'center', color: 'var(--muted-foreground)' }}>
                                No revenue data for this period
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </CategoryTable>
                    </div>

                    <div style={{ marginTop: '32px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>
                        Expenses by Category
                      </h3>
                      <CategoryTable>
                        <thead>
                          <tr>
                            <th>Category</th>
                            <th style={{ textAlign: 'right' }}>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {incomeStatement.expenses?.by_category && Object.entries(incomeStatement.expenses.by_category).length > 0 ? (
                            Object.entries(incomeStatement.expenses.by_category)
                              .sort(([, a], [, b]) => (b as number) - (a as number))
                              .map(([category, amount]) => (
                                <tr key={category}>
                                  <td>{capitalize(category)}</td>
                                  <td style={{ textAlign: 'right' }}>{formatCurrency(amount as number)}</td>
                                </tr>
                              ))
                          ) : (
                            <tr>
                              <td colSpan={2} style={{ textAlign: 'center', color: 'var(--muted-foreground)' }}>
                                No expense data for this period
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </CategoryTable>
                    </div>
                  </>
                ) : (
                  <EmptyState>
                    <FileText size={48} />
                    <h3>No income statement data available</h3>
                  </EmptyState>
                )}
              </ReportCard>
            </ReportSection>

            {/* Cash Flow Statement */}
            <ReportSection>
              <ReportCard>
                <ReportHeader>
                  <div>
                    <h2>
                      <BarChart3 size={24} />
                      Cash Flow Statement
                    </h2>
                    <p>
                      Period: {formatDate(startDate)} - {formatDate(endDate)}
                    </p>
                  </div>
                </ReportHeader>

                {cashFlow ? (
                  <>
                    <SummaryGrid>
                      <SummaryCard $type="revenue">
                        <div className="label">
                          <ArrowUpRight size={16} />
                          Cash Inflow
                        </div>
                        <div className="value">
                          {formatCurrency(cashFlow.summary?.total_inflow || 0)}
                        </div>
                        <div className="sub-value">Money coming in</div>
                      </SummaryCard>
                      <SummaryCard $type="expense">
                        <div className="label">
                          <ArrowDownRight size={16} />
                          Cash Outflow
                        </div>
                        <div className="value">
                          {formatCurrency(cashFlow.summary?.total_outflow || 0)}
                        </div>
                        <div className="sub-value">Money going out</div>
                      </SummaryCard>
                      <SummaryCard $type="profit">
                        <div className="label">
                          <TrendingUp size={16} />
                          Net Cash Flow
                        </div>
                        <div className="value">
                          {formatCurrency(cashFlow.summary?.net_cash_flow || 0)}
                        </div>
                        <div className="sub-value">Actual cash available</div>
                      </SummaryCard>
                    </SummaryGrid>

                    <div style={{ marginTop: '32px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>
                        Daily Cash Flow
                      </h3>
                      <CashFlowTable>
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th style={{ textAlign: 'right' }}>Inflow</th>
                            <th style={{ textAlign: 'right' }}>Outflow</th>
                            <th style={{ textAlign: 'right' }}>Net</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cashFlow.daily_cash_flow && Object.entries(cashFlow.daily_cash_flow).length > 0 ? (
                            Object.entries(cashFlow.daily_cash_flow)
                              .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
                              .map(([date, flow]: [string, any]) => (
                                <tr key={date}>
                                  <td>{formatDate(date)}</td>
                                  <td style={{ textAlign: 'right' }}>
                                    {flow.inflow > 0 ? formatCurrency(flow.inflow) : '—'}
                                  </td>
                                  <td style={{ textAlign: 'right' }}>
                                    {flow.outflow > 0 ? formatCurrency(flow.outflow) : '—'}
                                  </td>
                                  <td style={{ textAlign: 'right' }}>
                                    {formatCurrency(flow.net || 0)}
                                  </td>
                                </tr>
                              ))
                          ) : (
                            <tr>
                              <td colSpan={4} style={{ textAlign: 'center', color: 'var(--muted-foreground)' }}>
                                No cash flow data for this period
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </CashFlowTable>
                    </div>
                  </>
                ) : (
                  <EmptyState>
                    <BarChart3 size={48} />
                    <h3>No cash flow data available</h3>
                  </EmptyState>
                )}
              </ReportCard>
            </ReportSection>
          </>
        )}
      </PageContainer>
    </Layout>
  );
}
