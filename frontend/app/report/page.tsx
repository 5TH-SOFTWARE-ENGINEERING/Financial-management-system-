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
import { theme } from '@/components/common/theme';
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
  BarChart3,
  AlertCircle
} from 'lucide-react';

const PRIMARY_COLOR = theme.colors.primary || '#00AA00';
const TEXT_COLOR_DARK = '#111827';
const TEXT_COLOR_MUTED = theme.colors.textSecondary || '#666';

const CardShadow = `
  0 2px 4px -1px rgba(0, 0, 0, 0.06),
  0 1px 2px -1px rgba(0, 0, 0, 0.03),
  inset 0 0 0 1px rgba(0, 0, 0, 0.02)
`;
const CardShadowHover = `
  0 8px 12px -2px rgba(0, 0, 0, 0.08),
  0 4px 6px -2px rgba(0, 0, 0, 0.04),
  inset 0 0 0 1px rgba(0, 0, 0, 0.03)
`;

const PageContainer = styled.div`
  flex: 1;
  width: 100%;
  max-width: 980px;
  margin-left: auto;
  margin-right: 0;
  padding: ${theme.spacing.sm} ${theme.spacing.sm} ${theme.spacing.sm};
`;

const HeaderContainer = styled.div`
  background: linear-gradient(135deg, ${PRIMARY_COLOR} 0%, #008800 100%);
  color: #ffffff;
  padding: ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.lg};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-radius: ${theme.borderRadius.md};
  border-bottom: 3px solid rgba(255, 255, 255, 0.1);
  
  h1 {
    font-size: clamp(24px, 3vw, 36px);
    font-weight: ${theme.typography.fontWeights.bold};
    margin: 0 0 ${theme.spacing.xs};
    color: #ffffff;
  }
  
  p {
    font-size: ${theme.typography.fontSizes.md};
    font-weight: ${theme.typography.fontWeights.medium};
    opacity: 0.9;
    margin: 0;
    color: rgba(255, 255, 255, 0.95);
  }
`;

const DateFilterCard = styled.div`
  background: ${theme.colors.background};
  padding: ${theme.spacing.lg};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  box-shadow: ${CardShadow};
  margin-bottom: ${theme.spacing.lg};
  display: flex;
  gap: ${theme.spacing.md};
  align-items: flex-end;
  flex-wrap: wrap;
  transition: box-shadow ${theme.transitions.default};

  &:hover {
    box-shadow: ${CardShadowHover};
  }
`;

const DateInputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.sm};
  flex: 1;
  min-width: 200px;
`;

const ReportSection = styled.div`
  margin-bottom: ${theme.spacing.xl};
`;

const ReportCard = styled.div`
  background: ${theme.colors.background};
  padding: ${theme.spacing.xl};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  box-shadow: ${CardShadow};
  margin-bottom: ${theme.spacing.lg};
  transition: box-shadow ${theme.transitions.default};

  &:hover {
    box-shadow: ${CardShadowHover};
  }
`;

const ReportHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing.lg};
  padding-bottom: ${theme.spacing.md};
  border-bottom: 2px solid ${theme.colors.border};
  
  h2 {
    font-size: ${theme.typography.fontSizes.lg};
    font-weight: ${theme.typography.fontWeights.bold};
    color: ${TEXT_COLOR_DARK};
    display: flex;
    align-items: center;
    gap: ${theme.spacing.md};
    margin: 0;
    
    svg {
      width: 24px;
      height: 24px;
      color: ${PRIMARY_COLOR};
    }
  }
  
  p {
    color: ${TEXT_COLOR_MUTED};
    font-size: ${theme.typography.fontSizes.sm};
    margin: ${theme.spacing.xs} 0 0;
  }
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.xl};
`;

const SummaryCard = styled.div<{ $type?: 'revenue' | 'expense' | 'profit' | 'cash' }>`
  background: ${(p) => {
    if (p.$type === 'revenue') return '#f0fdf4';
    if (p.$type === 'expense') return '#fef2f2';
    if (p.$type === 'profit') return '#eff6ff';
    return theme.colors.backgroundSecondary;
  }};
  border: 1px solid ${(p) => {
    if (p.$type === 'revenue') return '#bbf7d0';
    if (p.$type === 'expense') return '#fecaca';
    if (p.$type === 'profit') return '#bfdbfe';
    return theme.colors.border;
  }};
  padding: ${theme.spacing.lg};
  border-radius: ${theme.borderRadius.md};
  transition: transform ${theme.transitions.default}, box-shadow ${theme.transitions.default};
  box-shadow: ${CardShadow};

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${CardShadowHover};
  }
  
  .label {
    font-size: ${theme.typography.fontSizes.sm};
    color: ${TEXT_COLOR_MUTED};
    margin-bottom: ${theme.spacing.sm};
    display: flex;
    align-items: center;
    gap: ${theme.spacing.xs};
    font-weight: ${theme.typography.fontWeights.medium};
  }
  
  .value {
    font-size: clamp(20px, 4vw, 28px);
    font-weight: ${theme.typography.fontWeights.bold};
    color: ${TEXT_COLOR_DARK};
    margin-bottom: ${theme.spacing.xs};
  }
  
  .sub-value {
    font-size: ${theme.typography.fontSizes.sm};
    color: ${TEXT_COLOR_MUTED};
    margin-top: ${theme.spacing.xs};
  }
`;

const CategoryTable = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin-top: ${theme.spacing.md};
  
  thead {
    background: ${theme.colors.backgroundSecondary};
    border-bottom: 2px solid ${theme.colors.border};
    
    th {
      text-align: left;
      padding: ${theme.spacing.md} ${theme.spacing.lg};
      font-weight: ${theme.typography.fontWeights.medium};
      color: ${TEXT_COLOR_MUTED};
      font-size: ${theme.typography.fontSizes.xs};
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
  }
  
  tbody {
    tr {
      border-bottom: 1px solid ${theme.colors.border};
      transition: background-color ${theme.transitions.default};
      
      &:hover {
        background: ${theme.colors.backgroundSecondary};
      }
      
      &:last-child {
        border-bottom: none;
      }
      
      td {
        padding: ${theme.spacing.md} ${theme.spacing.lg};
        color: ${TEXT_COLOR_MUTED};
        font-size: ${theme.typography.fontSizes.sm};
        
        &:last-child {
          font-weight: ${theme.typography.fontWeights.bold};
          color: ${TEXT_COLOR_DARK};
        }
      }
    }
  }
`;

const CashFlowTable = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin-top: ${theme.spacing.md};
  
  thead {
    background: ${theme.colors.backgroundSecondary};
    border-bottom: 2px solid ${theme.colors.border};
    
    th {
      text-align: left;
      padding: ${theme.spacing.md} ${theme.spacing.lg};
      font-weight: ${theme.typography.fontWeights.medium};
      color: ${TEXT_COLOR_MUTED};
      font-size: ${theme.typography.fontSizes.xs};
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
  }
  
  tbody {
    tr {
      border-bottom: 1px solid ${theme.colors.border};
      transition: background-color ${theme.transitions.default};
      
      &:hover {
        background: ${theme.colors.backgroundSecondary};
      }
      
      &:last-child {
        border-bottom: none;
      }
      
      td {
        padding: ${theme.spacing.md} ${theme.spacing.lg};
        color: ${TEXT_COLOR_MUTED};
        font-size: ${theme.typography.fontSizes.sm};
        
        &:nth-child(2) {
          color: #059669;
          font-weight: ${theme.typography.fontWeights.medium};
        }
        
        &:nth-child(3) {
          color: #dc2626;
          font-weight: ${theme.typography.fontWeights.medium};
        }
        
        &:last-child {
          font-weight: ${theme.typography.fontWeights.bold};
          color: ${TEXT_COLOR_DARK};
        }
      }
    }
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: ${theme.spacing.md};
  
  p {
    color: ${TEXT_COLOR_MUTED};
    font-size: ${theme.typography.fontSizes.md};
    margin: 0;
  }
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid ${theme.colors.border};
  border-top-color: ${PRIMARY_COLOR};
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const ErrorBanner = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.lg};
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: ${theme.borderRadius.md};
  color: #dc2626;
  font-size: ${theme.typography.fontSizes.sm};

  svg {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${theme.spacing.xxl} ${theme.spacing.lg};
  color: ${TEXT_COLOR_MUTED};
  
  svg {
    width: 48px;
    height: 48px;
    margin: 0 auto ${theme.spacing.md};
    opacity: 0.5;
    color: ${TEXT_COLOR_MUTED};
  }
  
  h3 {
    font-size: ${theme.typography.fontSizes.lg};
    font-weight: ${theme.typography.fontWeights.bold};
    margin: 0 0 ${theme.spacing.sm};
    color: ${TEXT_COLOR_DARK};
  }
`;

const ButtonRow = styled.div`
  display: flex;
  gap: ${theme.spacing.md};
  margin-top: ${theme.spacing.md};
  flex-wrap: wrap;
`;

const SectionTitle = styled.h3`
  font-size: ${theme.typography.fontSizes.lg};
  font-weight: ${theme.typography.fontWeights.bold};
  margin: 0 0 ${theme.spacing.md};
  color: ${TEXT_COLOR_DARK};
`;

const TwoColumnGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${theme.spacing.xl};
  margin-top: ${theme.spacing.xl};

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: ${theme.spacing.lg};
  }
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
  
  const [startDate, setStartDate] = useState<string>(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 1);
    date.setDate(1);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [incomeStatement, setIncomeStatement] = useState<IncomeStatement | null>(null);
  const [cashFlow, setCashFlow] = useState<CashFlow | null>(null);

  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => {
        loadReports(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [user]);

  useEffect(() => {
    if (user && startDate && endDate) {
      const timer = setTimeout(() => {
        loadReports(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [startDate, endDate]);

  const loadReports = async (useDateFilter: boolean = true) => {
    setLoading(true);
    setError(null);
    
    try {
      const dateParams = useDateFilter ? { startDate, endDate } : { startDate: undefined, endDate: undefined };
      
      const [summaryResult, incomeResult, cashFlowResult] = await Promise.allSettled([
        apiClient.getFinancialSummary(dateParams.startDate, dateParams.endDate),
        apiClient.getIncomeStatement(dateParams.startDate, dateParams.endDate),
        apiClient.getCashFlow(dateParams.startDate, dateParams.endDate),
      ]);
      
      if (summaryResult.status === 'fulfilled') {
        const summaryData = summaryResult.value.data || summaryResult.value;
        if (summaryData && (summaryData.financials || summaryData.revenue_by_category || summaryData.expenses_by_category)) {
          if (process.env.NODE_ENV === 'development') {
            console.log('Financial Summary loaded:', {
              total_revenue: summaryData.financials?.total_revenue,
              total_expenses: summaryData.financials?.total_expenses,
              revenue_categories: Object.keys(summaryData.revenue_by_category || {}).length,
              expense_categories: Object.keys(summaryData.expenses_by_category || {}).length,
            });
          }
          setFinancialSummary(summaryData);
        } else {
          console.warn('Invalid summary data structure:', summaryData);
          setFinancialSummary(null);
        }
      } else {
        console.error('Failed to load financial summary:', summaryResult.reason);
        if (incomeResult.status === 'fulfilled') {
          const incomeData = incomeResult.value.data;
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
          setFinancialSummary(null);
        }
      }
      
      if (incomeResult.status === 'fulfilled') {
        const incomeData = incomeResult.value.data || incomeResult.value;
        if (incomeData && (incomeData.revenue || incomeData.expenses)) {
          setIncomeStatement(incomeData);
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.warn('Invalid income statement data structure:', incomeData);
          }
          setIncomeStatement(null);
        }
      } else {
        console.error('Failed to load income statement:', incomeResult.reason);
        setIncomeStatement(null);
      }
      
      if (cashFlowResult.status === 'fulfilled') {
        const cashFlowData = cashFlowResult.value.data || cashFlowResult.value;
        if (cashFlowData && (cashFlowData.summary || cashFlowData.daily_cash_flow)) {
          setCashFlow(cashFlowData);
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.warn('Invalid cash flow data structure:', cashFlowData);
          }
          setCashFlow(null);
        }
      } else {
        console.error('Failed to load cash flow:', cashFlowResult.reason);
        setCashFlow(null);
      }
      
      if (summaryResult.status === 'rejected' && incomeResult.status === 'rejected' && cashFlowResult.status === 'rejected') {
        const firstError = summaryResult.reason || incomeResult.reason || cashFlowResult.reason;
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
        setFinancialSummary(null);
        setIncomeStatement(null);
        setCashFlow(null);
      }
      
    } catch (err: any) {
      let errorMessage = 'Failed to load reports';
      
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        
        if (Array.isArray(detail)) {
          errorMessage = detail.map((e: any) => {
            if (typeof e === 'string') return e;
            if (e.msg) return `${e.loc?.join('.') || 'Field'}: ${e.msg}`;
            return JSON.stringify(e);
          }).join(', ');
        }
        else if (typeof detail === 'object' && detail.msg) {
          errorMessage = `${detail.loc?.join('.') || 'Field'}: ${detail.msg}`;
        }
        else if (typeof detail === 'string') {
          errorMessage = detail;
        }
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
        <HeaderContainer>
          <h1>Financial Reports</h1>
          <p>Income Statement and Cash Flow Analysis</p>
        </HeaderContainer>

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
                const oneYearAgo = new Date();
                oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
                oneYearAgo.setDate(1);
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
          <ErrorBanner>
            <AlertCircle />
            <span>{error}</span>
          </ErrorBanner>
        )}

        {loading ? (
          <LoadingContainer>
            <Spinner />
            <p>Loading financial reports...</p>
          </LoadingContainer>
        ) : (
          <>
            <ReportSection>
              <ReportCard>
                <ReportHeader>
                  <div>
                    <h2>
                      <BarChart3 />
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

                    <TwoColumnGrid>
                      <div>
                        <SectionTitle>Top Revenue Categories</SectionTitle>
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
                                <td colSpan={2} style={{ textAlign: 'center', color: TEXT_COLOR_MUTED }}>
                                  No revenue data
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </CategoryTable>
                      </div>

                      <div>
                        <SectionTitle>Top Expense Categories</SectionTitle>
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
                                <td colSpan={2} style={{ textAlign: 'center', color: TEXT_COLOR_MUTED }}>
                                  No expense data
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </CategoryTable>
                      </div>
                    </TwoColumnGrid>
                  </>
                ) : (
                  <EmptyState>
                    <BarChart3 size={48} />
                    <h3>No summary data available</h3>
                  </EmptyState>
                )}
              </ReportCard>
            </ReportSection>

            <ReportSection>
              <ReportCard>
                <ReportHeader>
                  <div>
                    <h2>
                      <FileText />
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

                    <div style={{ marginTop: theme.spacing.xl }}>
                      <SectionTitle>Revenue by Category</SectionTitle>
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
                              <td colSpan={2} style={{ textAlign: 'center', color: TEXT_COLOR_MUTED }}>
                                No revenue data for this period
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </CategoryTable>
                    </div>

                    <div style={{ marginTop: theme.spacing.xl }}>
                      <SectionTitle>Expenses by Category</SectionTitle>
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
                              <td colSpan={2} style={{ textAlign: 'center', color: TEXT_COLOR_MUTED }}>
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

            <ReportSection>
              <ReportCard>
                <ReportHeader>
                  <div>
                    <h2>
                      <BarChart3 />
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

                    <div style={{ marginTop: theme.spacing.xl }}>
                      <SectionTitle>Daily Cash Flow</SectionTitle>
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
                              <td colSpan={4} style={{ textAlign: 'center', color: TEXT_COLOR_MUTED }}>
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
