'use client';
import React, { useEffect, useState, useCallback } from 'react';
import styled from 'styled-components';
import {
  History, ArrowLeft,
  Filter, RefreshCw
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
  max-width: 980px;
  margin-left: auto;
  margin-right: 0;
  padding: ${theme.spacing.sm} ${theme.spacing.sm} ${theme.spacing.sm};
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

const HistoryCard = styled.div`
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  box-shadow: ${CardShadow};
  padding: ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.lg};
`;

const HistoryTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  
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

interface VarianceHistory {
  id: number;
  budget_id: number;
  period_start: string;
  period_end: string;
  budgeted_revenue: number;
  budgeted_expenses: number;
  budgeted_profit: number;
  actual_revenue: number;
  actual_expenses: number;
  actual_profit: number;
  revenue_variance: number;
  expense_variance: number;
  profit_variance: number;
  revenue_variance_percent: number;
  expense_variance_percent: number;
  profit_variance_percent: number;
  calculated_at: string;
}

const VarianceHistoryPage: React.FC = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [selectedBudgetId, setSelectedBudgetId] = useState<string>('');
  const [history, setHistory] = useState<VarianceHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadBudgets = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.getBudgets();
      setBudgets(Array.isArray(response.data) ? response.data : []);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load budgets';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    if (!selectedBudgetId) return;
    
    try {
      setLoadingHistory(true);
      const response = await apiClient.getVarianceHistory(parseInt(selectedBudgetId), { limit: 50 });
      setHistory(Array.isArray(response.data) ? response.data : []);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load variance history';
      toast.error(message);
    } finally {
      setLoadingHistory(false);
    }
  }, [selectedBudgetId]);

  useEffect(() => {
    loadBudgets();
  }, [loadBudgets]);

  useEffect(() => {
    if (selectedBudgetId) {
      loadHistory();
    } else {
      setHistory([]);
    }
  }, [selectedBudgetId, loadHistory]);

  const formatCurrency = (value: number) => {
    return `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

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
          <BackLink href="/variance">
            <ArrowLeft size={16} />
            Back to Variance Analysis
          </BackLink>

          <HeaderContainer>
            <h1>
              <History size={36} />
              Variance History
            </h1>
            <p style={{ marginTop: theme.spacing.sm, opacity: 0.9 }}>
              View historical variance calculations for budgets
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
                onClick={loadHistory}
                disabled={loadingHistory}
              >
                <RefreshCw size={16} />
                Refresh
              </Button>
            )}
          </FiltersContainer>

          {selectedBudgetId ? (
            loadingHistory ? (
              <LoadingContainer>
                <Spinner />
                <p>Loading variance history...</p>
              </LoadingContainer>
            ) : history.length === 0 ? (
              <HistoryCard>
                <div style={{ textAlign: 'center', padding: theme.spacing.xl, color: TEXT_COLOR_MUTED }}>
                  <History size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                  <p>No variance history found for this budget. Calculate variance first.</p>
                </div>
              </HistoryCard>
            ) : (
              <HistoryCard>
                <h2 style={{ marginBottom: theme.spacing.lg, color: TEXT_COLOR_DARK }}>
                  Variance History ({history.length} records)
                </h2>
                <div style={{ overflowX: 'auto' }}>
                  <HistoryTable>
                    <thead>
                      <tr>
                        <th>Period</th>
                        <th>Budgeted Revenue</th>
                        <th>Actual Revenue</th>
                        <th>Revenue Variance</th>
                        <th>Budgeted Expenses</th>
                        <th>Actual Expenses</th>
                        <th>Expense Variance</th>
                        <th>Budgeted Profit</th>
                        <th>Actual Profit</th>
                        <th>Profit Variance</th>
                        <th>Calculated At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((variance) => (
                        <tr key={variance.id}>
                          <td>
                            {formatDate(variance.period_start)}<br />
                            <span style={{ fontSize: theme.typography.fontSizes.xs, color: TEXT_COLOR_MUTED }}>
                              to {formatDate(variance.period_end)}
                            </span>
                          </td>
                          <td>{formatCurrency(variance.budgeted_revenue)}</td>
                          <td>{formatCurrency(variance.actual_revenue)}</td>
                          <td>
                            <VarianceBadge $isPositive={variance.revenue_variance >= 0}>
                              {formatCurrency(variance.revenue_variance)} ({formatPercent(variance.revenue_variance_percent)})
                            </VarianceBadge>
                          </td>
                          <td>{formatCurrency(variance.budgeted_expenses)}</td>
                          <td>{formatCurrency(variance.actual_expenses)}</td>
                          <td>
                            <VarianceBadge $isPositive={variance.expense_variance <= 0}>
                              {formatCurrency(variance.expense_variance)} ({formatPercent(variance.expense_variance_percent)})
                            </VarianceBadge>
                          </td>
                          <td>{formatCurrency(variance.budgeted_profit)}</td>
                          <td>{formatCurrency(variance.actual_profit)}</td>
                          <td>
                            <VarianceBadge $isPositive={variance.profit_variance >= 0}>
                              {formatCurrency(variance.profit_variance)} ({formatPercent(variance.profit_variance_percent)})
                            </VarianceBadge>
                          </td>
                          <td>
                            {formatDate(variance.calculated_at)}
                            <br />
                            <span style={{ fontSize: theme.typography.fontSizes.xs, color: TEXT_COLOR_MUTED }}>
                              {new Date(variance.calculated_at).toLocaleTimeString()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </HistoryTable>
                </div>
              </HistoryCard>
            )
          ) : (
            <HistoryCard>
              <div style={{ textAlign: 'center', padding: theme.spacing.xl, color: TEXT_COLOR_MUTED }}>
                <History size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                <p>Please select a budget to view variance history.</p>
              </div>
            </HistoryCard>
          )}
        </ContentContainer>
      </PageContainer>
    </Layout>
  );
};

export default VarianceHistoryPage;

