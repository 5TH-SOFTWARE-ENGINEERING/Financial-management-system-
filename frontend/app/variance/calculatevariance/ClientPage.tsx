'use client';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useRouter } from 'next/navigation';
import {
  Calculator, ArrowLeft
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

const FormCard = styled.div`
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  box-shadow: ${CardShadow};
  padding: ${theme.spacing.xl};
  margin-bottom: ${theme.spacing.lg};
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
  margin: 0;
  margin-bottom: ${theme.spacing.md};
  
  label {
    display: block;
    font-size: ${theme.typography.fontSizes.sm};
    font-weight: ${theme.typography.fontWeights.medium};
    color: ${TEXT_COLOR_DARK};
    margin: 0;
  }
`;

const StyledInput = styled.input`
  width: 100%;
  max-width: 100%;
  padding: 10px 14px;
  border: 1.5px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  background: #ffffff;
  color: #111827;
  transition: all 0.2s ease-in-out;
  outline: none;
  box-sizing: border-box;
  margin: 0;

  &:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    background: #ffffff;
  }

  &:hover:not(:disabled) {
    border-color: #d1d5db;
  }

  &::placeholder {
    color: #9ca3af;
  }

  &:disabled {
    background-color: #f9fafb;
    color: #6b7280;
    cursor: not-allowed;
    opacity: 0.7;
    border-color: #e5e7eb;
  }

  &[type="date"] {
    cursor: pointer;
  }
`;

const StyledSelect = styled.select`
  width: 100%;
  max-width: 100%;
  padding: 10px 14px;
  border: 1.5px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  background: #ffffff;
  color: #111827;
  transition: all 0.2s ease-in-out;
  outline: none;
  box-sizing: border-box;
  margin: 0;
  cursor: pointer;

  &:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    background: #ffffff;
  }

  &:hover:not(:disabled) {
    border-color: #d1d5db;
  }

  &:disabled {
    background-color: #f9fafb;
    color: #6b7280;
    cursor: not-allowed;
    opacity: 0.7;
    border-color: #e5e7eb;
  }
`;

const TwoColumnGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 28px;
  width: 100%;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 28px;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 16px;
  justify-content: space-between;
  margin-top: ${theme.spacing.xl};
  padding-top: ${theme.spacing.lg};
  border-top: 1px solid ${theme.colors.border};
`;

const ResultCard = styled.div`
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  box-shadow: ${CardShadow};
  padding: ${theme.spacing.xl};
  margin-top: ${theme.spacing.lg};
`;

const ResultGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${theme.spacing.md};
  margin-top: ${theme.spacing.md};
  
  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ResultItem = styled.div`
  padding: ${theme.spacing.md};
  background: #f9fafb;
  border-radius: ${theme.borderRadius.sm};
  border-left: 4px solid ${PRIMARY_COLOR};
  
  .label {
    font-size: ${theme.typography.fontSizes.xs};
    color: ${TEXT_COLOR_MUTED};
    margin-bottom: ${theme.spacing.xs};
  }
  
  .value {
    font-size: ${theme.typography.fontSizes.lg};
    font-weight: ${theme.typography.fontWeights.bold};
    color: ${TEXT_COLOR_DARK};
  }
  
  .variance {
    font-size: ${theme.typography.fontSizes.sm};
    margin-top: ${theme.spacing.xs};
    
    &.positive {
      color: #10b981;
    }
    
    &.negative {
      color: #ef4444;
    }
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 40vh;
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
  period: string;
  start_date: string;
  end_date: string;
  status: string;
}

interface VarianceResult {
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
}

const CalculateVariancePage: React.FC = () => {
  const router = useRouter();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [formData, setFormData] = useState({
    budget_id: '',
    period_start: '',
    period_end: ''
  });
  const [varianceResult, setVarianceResult] = useState<VarianceResult | null>(null);

  useEffect(() => {
    loadBudgets();
  }, []);

  const loadBudgets = async () => {
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.budget_id || !formData.period_start || !formData.period_end) {
      toast.error('Please fill in all fields');
      return;
    }

    if (new Date(formData.period_end) < new Date(formData.period_start)) {
      toast.error('End date must be after start date');
      return;
    }

    try {
      setCalculating(true);
      const response = await apiClient.calculateVariance(
        parseInt(formData.budget_id),
        formData.period_start,
        formData.period_end
      );
      setVarianceResult(response.data as VarianceResult);
      toast.success('Variance calculated successfully!');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to calculate variance';
      toast.error(message);
    } finally {
      setCalculating(false);
    }
  };

  const formatCurrency = (value: number) => {
    return `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
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
              <Calculator size={36} />
              Calculate Variance
            </h1>
            <p style={{ marginTop: theme.spacing.sm, opacity: 0.9 }}>
              Compare budgeted amounts with actual revenue and expenses for a specific period
            </p>
          </HeaderContainer>

          <form onSubmit={handleSubmit}>
            <FormCard>
              <h2 style={{ marginBottom: theme.spacing.lg, color: TEXT_COLOR_DARK }}>
                Select Budget and Period
              </h2>

              <FormGroup>
                <label>Budget </label>
                <StyledSelect
                  value={formData.budget_id}
                  onChange={(e) => setFormData({ ...formData, budget_id: e.target.value })}
                  required
                >
                  <option value="">Select a budget...</option>
                  {budgets.map((budget) => (
                    <option key={budget.id} value={budget.id}>
                      {budget.name} ({budget.status})
                    </option>
                  ))}
                </StyledSelect>
              </FormGroup>

              <TwoColumnGrid>
                <FormGroup>
                  <label>Period Start Date </label>
                  <StyledInput
                    type="date"
                    value={formData.period_start}
                    onChange={(e) => setFormData({ ...formData, period_start: e.target.value })}
                    required
                  />
                </FormGroup>

                <FormGroup>
                  <label>Period End Date </label>
                  <StyledInput
                    type="date"
                    value={formData.period_end}
                    onChange={(e) => setFormData({ ...formData, period_end: e.target.value })}
                    required
                  />
                </FormGroup>
              </TwoColumnGrid>

              <ActionButtons>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={calculating}
                >
                  <Calculator size={16} />
                  {calculating ? 'Calculating...' : 'Calculate Variance'}
                </Button>
              </ActionButtons>
            </FormCard>
          </form>

          {varianceResult && (
            <ResultCard>
              <h2 style={{ marginBottom: theme.spacing.md, color: TEXT_COLOR_DARK }}>
                Variance Results
              </h2>
              <p style={{ color: TEXT_COLOR_MUTED, fontSize: theme.typography.fontSizes.sm, marginBottom: theme.spacing.md }}>
                Period: {new Date(varianceResult.period_start).toLocaleDateString()} - {new Date(varianceResult.period_end).toLocaleDateString()}
              </p>

              <ResultGrid>
                <ResultItem>
                  <div className="label">Budgeted Revenue</div>
                  <div className="value">{formatCurrency(varianceResult.budgeted_revenue)}</div>
                </ResultItem>
                <ResultItem>
                  <div className="label">Actual Revenue</div>
                  <div className="value">{formatCurrency(varianceResult.actual_revenue)}</div>
                  <div className={`variance ${varianceResult.revenue_variance >= 0 ? 'positive' : 'negative'}`}>
                    {formatCurrency(varianceResult.revenue_variance)} ({formatPercent(varianceResult.revenue_variance_percent)})
                  </div>
                </ResultItem>
                <ResultItem>
                  <div className="label">Revenue Variance</div>
                  <div className={`value ${varianceResult.revenue_variance >= 0 ? 'positive' : 'negative'}`}>
                    {formatCurrency(varianceResult.revenue_variance)}
                  </div>
                  <div className="variance">
                    {formatPercent(varianceResult.revenue_variance_percent)}
                  </div>
                </ResultItem>

                <ResultItem>
                  <div className="label">Budgeted Expenses</div>
                  <div className="value">{formatCurrency(varianceResult.budgeted_expenses)}</div>
                </ResultItem>
                <ResultItem>
                  <div className="label">Actual Expenses</div>
                  <div className="value">{formatCurrency(varianceResult.actual_expenses)}</div>
                  <div className={`variance ${varianceResult.expense_variance <= 0 ? 'positive' : 'negative'}`}>
                    {formatCurrency(varianceResult.expense_variance)} ({formatPercent(varianceResult.expense_variance_percent)})
                  </div>
                </ResultItem>
                <ResultItem>
                  <div className="label">Expense Variance</div>
                  <div className={`value ${varianceResult.expense_variance <= 0 ? 'positive' : 'negative'}`}>
                    {formatCurrency(varianceResult.expense_variance)}
                  </div>
                  <div className="variance">
                    {formatPercent(varianceResult.expense_variance_percent)}
                  </div>
                </ResultItem>

                <ResultItem>
                  <div className="label">Budgeted Profit</div>
                  <div className="value">{formatCurrency(varianceResult.budgeted_profit)}</div>
                </ResultItem>
                <ResultItem>
                  <div className="label">Actual Profit</div>
                  <div className="value">{formatCurrency(varianceResult.actual_profit)}</div>
                  <div className={`variance ${varianceResult.profit_variance >= 0 ? 'positive' : 'negative'}`}>
                    {formatCurrency(varianceResult.profit_variance)} ({formatPercent(varianceResult.profit_variance_percent)})
                  </div>
                </ResultItem>
                <ResultItem>
                  <div className="label">Profit Variance</div>
                  <div className={`value ${varianceResult.profit_variance >= 0 ? 'positive' : 'negative'}`}>
                    {formatCurrency(varianceResult.profit_variance)}
                  </div>
                  <div className="variance">
                    {formatPercent(varianceResult.profit_variance_percent)}
                  </div>
                </ResultItem>
              </ResultGrid>
            </ResultCard>
          )}
        </ContentContainer>
      </PageContainer>
    </Layout>
  );
};

export default CalculateVariancePage;

