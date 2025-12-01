'use client';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/rbac/auth-context';
import {
  BarChart3, ArrowLeft, TrendingUp, TrendingDown, AlertCircle,
  Filter, RefreshCw, TrendingUp as TrendingUpIcon
} from 'lucide-react';
import Layout from '@/components/layout';
import apiClient from '@/lib/api';
import { theme } from '@/components/common/theme';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Link from 'next/link';

const PRIMARY_COLOR = theme.colors.primary || '#00AA00';
const TEXT_COLOR_DARK = '#111827';
const TEXT_COLOR_MUTED = theme.colors.textSecondary || '#666';
const BACKGROUND_GRADIENT = `linear-gradient(180deg, #f9fafb 0%, #f3f4f6 60%, ${theme.colors.background} 100%)`;

const CardShadow = `
  0 2px 4px -1px rgba(0, 0, 0, 0.06),
  0 1px 2px -1px rgba(0, 0, 0, 0.03),
  inset 0 0 0 1px rgba(0, 0, 0, 0.02)
`;

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: ${BACKGROUND_GRADIENT};
`;

const ContentContainer = styled.div`
  flex: 1;
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
  padding: ${theme.spacing.lg};
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  color: ${TEXT_COLOR_MUTED};
  text-decoration: none;
  margin-bottom: ${theme.spacing.md};
  transition: color ${theme.transitions.default};

  &:hover {
    color: ${TEXT_COLOR_DARK};
  }
`;

const HeaderContainer = styled.div`
  background: linear-gradient(135deg, ${PRIMARY_COLOR} 0%, #008800 100%);
  color: #ffffff;
  padding: ${theme.spacing.xl};
  margin-bottom: ${theme.spacing.xl};
  border-radius: ${theme.borderRadius.md};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  
  h1 {
    font-size: clamp(28px, 3.5vw, 36px);
    font-weight: ${theme.typography.fontWeights.bold};
    margin: 0;
    display: flex;
    align-items: center;
    gap: ${theme.spacing.md};
  }
`;

const FiltersContainer = styled.div`
  background: ${theme.colors.background};
  padding: ${theme.spacing.lg};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  box-shadow: ${CardShadow};
  margin-bottom: ${theme.spacing.xl};
  display: flex;
  gap: ${theme.spacing.md};
  align-items: center;
  flex-wrap: wrap;
`;

const SummaryCard = styled.div`
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  box-shadow: ${CardShadow};
  padding: ${theme.spacing.xl};
  margin-bottom: ${theme.spacing.lg};
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.xl};
  
  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const SummaryItem = styled.div`
  padding: ${theme.spacing.lg};
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  border-radius: ${theme.borderRadius.md};
  border-left: 4px solid ${PRIMARY_COLOR};
  
  .label {
    font-size: ${theme.typography.fontSizes.sm};
    color: ${TEXT_COLOR_MUTED};
    margin-bottom: ${theme.spacing.xs};
    display: flex;
    align-items: center;
    gap: ${theme.spacing.xs};
  }
  
  .value {
    font-size: clamp(24px, 3vw, 32px);
    font-weight: ${theme.typography.fontWeights.bold};
    color: ${TEXT_COLOR_DARK};
    margin-bottom: ${theme.spacing.xs};
  }
  
  .subvalue {
    font-size: ${theme.typography.fontSizes.sm};
    color: ${TEXT_COLOR_MUTED};
  }
  
  &.positive {
    border-left-color: #10b981;
  }
  
  &.negative {
    border-left-color: #ef4444;
  }
`;

const PeriodTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: ${theme.spacing.md};
  
  th {
    text-align: left;
    padding: ${theme.spacing.md};
    background: #f9fafb;
    font-weight: ${theme.typography.fontWeights.medium};
    font-size: ${theme.typography.fontSizes.sm};
    color: ${TEXT_COLOR_DARK};
    border-bottom: 2px solid ${theme.colors.border};
  }
  
  td {
    padding: ${theme.spacing.md};
    border-bottom: 1px solid ${theme.colors.border};
    font-size: ${theme.typography.fontSizes.sm};
    color: ${TEXT_COLOR_DARK};
  }
  
  tr:hover {
    background: #f9fafb;
  }
`;

const VarianceBadge = styled.span<{ $isPositive: boolean }>`
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.sm};
  font-size: ${theme.typography.fontSizes.xs};
  font-weight: ${theme.typography.fontWeights.medium};
  background: ${props => props.$isPositive ? '#d1fae5' : '#fecaca'};
  color: ${props => props.$isPositive ? '#065f46' : '#991b1b'};
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

interface Budget {
  id: number;
  name: string;
  status: string;
}

interface VarianceSummary {
  period_start: string;
  period_end: string;
  revenue_variance: number;
  revenue_variance_percent: number;
  expense_variance: number;
  expense_variance_percent: number;
  profit_variance: number;
  profit_variance_percent: number;
  budgeted_revenue: number;
  actual_revenue: number;
  budgeted_expenses: number;
  actual_expenses: number;
}

const VarianceSummaryPage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [selectedBudgetId, setSelectedBudgetId] = useState<string>('');
  const [summary, setSummary] = useState<VarianceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(false);

  useEffect(() => {
    loadBudgets();
  }, []);

  useEffect(() => {
    if (selectedBudgetId) {
      loadSummary();
    } else {
      setSummary([]);
    }
  }, [selectedBudgetId]);

  const loadBudgets = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getBudgets();
      setBudgets(Array.isArray(response.data) ? response.data : []);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load budgets');
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    if (!selectedBudgetId) return;
    
    try {
      setLoadingSummary(true);
      const response = await apiClient.getVarianceSummary(parseInt(selectedBudgetId));
      setSummary(Array.isArray(response.data) ? response.data : []);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load variance summary');
    } finally {
      setLoadingSummary(false);
    }
  };

  const formatCurrency = (value: number) => {
    return `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Calculate overall statistics
  const overallStats = summary.length > 0 ? {
    avgRevenueVariance: summary.reduce((sum, s) => sum + s.revenue_variance, 0) / summary.length,
    avgExpenseVariance: summary.reduce((sum, s) => sum + s.expense_variance, 0) / summary.length,
    avgProfitVariance: summary.reduce((sum, s) => sum + s.profit_variance, 0) / summary.length,
    totalRevenueVariance: summary.reduce((sum, s) => sum + s.revenue_variance, 0),
    totalExpenseVariance: summary.reduce((sum, s) => sum + s.expense_variance, 0),
    totalProfitVariance: summary.reduce((sum, s) => sum + s.profit_variance, 0),
    totalBudgetedRevenue: summary.reduce((sum, s) => sum + s.budgeted_revenue, 0),
    totalActualRevenue: summary.reduce((sum, s) => sum + s.actual_revenue, 0),
    totalBudgetedExpenses: summary.reduce((sum, s) => sum + s.budgeted_expenses, 0),
    totalActualExpenses: summary.reduce((sum, s) => sum + s.actual_expenses, 0)
  } : null;

  if (loading) {
    return (
      <Layout>
        <PageContainer>
          <ContentContainer>
            <LoadingContainer>
              <Spinner />
              <p>Loading budgets...</p>
            </LoadingContainer>
          </ContentContainer>
        </PageContainer>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageContainer>
        <ContentContainer>
          <BackLink href="/budgets">
            <ArrowLeft size={16} />
            Back to Budgets
          </BackLink>

          <HeaderContainer>
            <h1>
              <BarChart3 size={36} />
              Variance Summary
            </h1>
            <p style={{ marginTop: theme.spacing.sm, opacity: 0.9 }}>
              Overview of budget variance performance across all periods
            </p>
          </HeaderContainer>

          <FiltersContainer>
            <Filter size={20} color={TEXT_COLOR_MUTED} />
            <label style={{ fontWeight: theme.typography.fontWeights.medium, color: TEXT_COLOR_DARK }}>
              Select Budget:
            </label>
            <select
              value={selectedBudgetId}
              onChange={(e) => setSelectedBudgetId(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                fontSize: theme.typography.fontSizes.sm,
                minWidth: '250px'
              }}
            >
              <option value="">Select a budget...</option>
              {budgets.map((budget) => (
                <option key={budget.id} value={budget.id}>
                  {budget.name} ({budget.status})
                </option>
              ))}
            </select>
            {selectedBudgetId && (
              <Button
                variant="outline"
                size="sm"
                onClick={loadSummary}
                disabled={loadingSummary}
              >
                <RefreshCw size={16} />
                Refresh
              </Button>
            )}
          </FiltersContainer>

          {selectedBudgetId ? (
            loadingSummary ? (
              <LoadingContainer>
                <Spinner />
                <p>Loading variance summary...</p>
              </LoadingContainer>
            ) : summary.length === 0 ? (
              <SummaryCard>
                <div style={{ textAlign: 'center', padding: theme.spacing.xl, color: TEXT_COLOR_MUTED }}>
                  <BarChart3 size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                  <p>No variance summary available. Calculate variance first.</p>
                </div>
              </SummaryCard>
            ) : (
              <>
                {overallStats && (
                  <SummaryCard>
                    <h2 style={{ marginBottom: theme.spacing.lg, color: TEXT_COLOR_DARK }}>
                      Overall Summary ({summary.length} periods)
                    </h2>
                    <SummaryGrid>
                      <SummaryItem className={overallStats.totalRevenueVariance >= 0 ? 'positive' : 'negative'}>
                        <div className="label">
                          <TrendingUpIcon size={16} />
                          Total Revenue Variance
                        </div>
                        <div className="value">{formatCurrency(overallStats.totalRevenueVariance)}</div>
                        <div className="subvalue">
                          Avg: {formatCurrency(overallStats.avgRevenueVariance)} per period
                        </div>
                      </SummaryItem>
                      <SummaryItem className={overallStats.totalExpenseVariance <= 0 ? 'positive' : 'negative'}>
                        <div className="label">
                          <TrendingDown size={16} />
                          Total Expense Variance
                        </div>
                        <div className="value">{formatCurrency(overallStats.totalExpenseVariance)}</div>
                        <div className="subvalue">
                          Avg: {formatCurrency(overallStats.avgExpenseVariance)} per period
                        </div>
                      </SummaryItem>
                      <SummaryItem className={overallStats.totalProfitVariance >= 0 ? 'positive' : 'negative'}>
                        <div className="label">
                          <BarChart3 size={16} />
                          Total Profit Variance
                        </div>
                        <div className="value">{formatCurrency(overallStats.totalProfitVariance)}</div>
                        <div className="subvalue">
                          Avg: {formatCurrency(overallStats.avgProfitVariance)} per period
                        </div>
                      </SummaryItem>
                      <SummaryItem>
                        <div className="label">Total Budgeted Revenue</div>
                        <div className="value">{formatCurrency(overallStats.totalBudgetedRevenue)}</div>
                        <div className="subvalue">
                          vs Actual: {formatCurrency(overallStats.totalActualRevenue)}
                        </div>
                      </SummaryItem>
                      <SummaryItem>
                        <div className="label">Total Budgeted Expenses</div>
                        <div className="value">{formatCurrency(overallStats.totalBudgetedExpenses)}</div>
                        <div className="subvalue">
                          vs Actual: {formatCurrency(overallStats.totalActualExpenses)}
                        </div>
                      </SummaryItem>
                      <SummaryItem>
                        <div className="label">Performance Ratio</div>
                        <div className="value">
                          {overallStats.totalBudgetedRevenue > 0
                            ? ((overallStats.totalActualRevenue / overallStats.totalBudgetedRevenue) * 100).toFixed(1)
                            : '0'}%
                        </div>
                        <div className="subvalue">
                          Revenue vs Budget
                        </div>
                      </SummaryItem>
                    </SummaryGrid>
                  </SummaryCard>
                )}

                <SummaryCard>
                  <h2 style={{ marginBottom: theme.spacing.lg, color: TEXT_COLOR_DARK }}>
                    Period-by-Period Summary
                  </h2>
                  <div style={{ overflowX: 'auto' }}>
                    <PeriodTable>
                      <thead>
                        <tr>
                          <th>Period</th>
                          <th>Revenue Variance</th>
                          <th>Expense Variance</th>
                          <th>Profit Variance</th>
                          <th>Budgeted vs Actual Revenue</th>
                          <th>Budgeted vs Actual Expenses</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summary.map((item, index) => (
                          <tr key={index}>
                            <td>
                              {formatDate(item.period_start)}<br />
                              <span style={{ fontSize: theme.typography.fontSizes.xs, color: TEXT_COLOR_MUTED }}>
                                to {formatDate(item.period_end)}
                              </span>
                            </td>
                            <td>
                              <VarianceBadge $isPositive={item.revenue_variance >= 0}>
                                {formatCurrency(item.revenue_variance)} ({formatPercent(item.revenue_variance_percent)})
                              </VarianceBadge>
                            </td>
                            <td>
                              <VarianceBadge $isPositive={item.expense_variance <= 0}>
                                {formatCurrency(item.expense_variance)} ({formatPercent(item.expense_variance_percent)})
                              </VarianceBadge>
                            </td>
                            <td>
                              <VarianceBadge $isPositive={item.profit_variance >= 0}>
                                {formatCurrency(item.profit_variance)} ({formatPercent(item.profit_variance_percent)})
                              </VarianceBadge>
                            </td>
                            <td>
                              {formatCurrency(item.budgeted_revenue)} → {formatCurrency(item.actual_revenue)}
                            </td>
                            <td>
                              {formatCurrency(item.budgeted_expenses)} → {formatCurrency(item.actual_expenses)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </PeriodTable>
                  </div>
                </SummaryCard>
              </>
            )
          ) : (
            <SummaryCard>
              <div style={{ textAlign: 'center', padding: theme.spacing.xl, color: TEXT_COLOR_MUTED }}>
                <BarChart3 size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                <p>Please select a budget to view variance summary.</p>
              </div>
            </SummaryCard>
          )}
        </ContentContainer>
      </PageContainer>
    </Layout>
  );
};

export default VarianceSummaryPage;

