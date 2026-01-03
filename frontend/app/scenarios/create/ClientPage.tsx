'use client';
import React, { useEffect, useState, Suspense, useCallback } from 'react';
import styled from 'styled-components';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Target, ArrowLeft, Save, X, AlertCircle
} from 'lucide-react';
import Layout from '@/components/layout';
import apiClient from '@/lib/api';
import { theme } from '@/components/common/theme';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Link from 'next/link';
import { ComponentGate } from '@/lib/rbac/component-gate';
import { ComponentId } from '@/lib/rbac/component-access';

export const dynamic = 'force-dynamic';

// Type definitions for error handling
type ErrorWithDetails = {
  code?: string;
  message?: string;
  response?: {
    status: number;
    data?: {
      detail?: string;
    };
  };
};
export const revalidate = 0;

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
  display: flex;
  flex-direction: column;
  gap: 28px;
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

  &[type="number"] {
    -moz-appearance: textfield;
    
    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
  }
`;

const StyledTextarea = styled.textarea`
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
  resize: vertical;
  min-height: 100px;

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

const ItemCard = styled.div`
  background: #f9fafb;
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.sm};
  padding: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.md};
`;

const ItemHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing.sm};
  
  .item-name {
    font-weight: ${theme.typography.fontWeights.bold};
    color: ${TEXT_COLOR_DARK};
  }
  
  .item-type {
    font-size: ${theme.typography.fontSizes.xs};
    padding: ${theme.spacing.xs} ${theme.spacing.sm};
    border-radius: ${theme.borderRadius.sm};
    background: ${PRIMARY_COLOR}15;
    color: ${PRIMARY_COLOR};
    text-transform: capitalize;
  }
`;

const AdjustmentInputs = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 28px;
  
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
  items: BudgetItem[];
  total_revenue: number;
  total_expenses: number;
  total_profit: number;
}

interface BudgetItem {
  id: number;
  name: string;
  type: string;
  amount: number;
}

const ScenarioCreatePageInner: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const budgetIdParam = searchParams?.get('budget_id');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    scenario_type: 'most_likely',
    adjustments: {} as Record<string, { amount_multiplier?: number; amount?: number }>
  });

  const loadBudget = useCallback(async () => {
    if (!budgetIdParam) return;

    try {
      setLoading(true);
      const response = await apiClient.getBudget(parseInt(budgetIdParam));
      const budgetData = response.data as Budget;
      setBudget(budgetData);

      // Initialize adjustments with multiplier 1.0 for all items
      const adjustments: Record<string, { amount_multiplier: number }> = {};
      if (budgetData.items && Array.isArray(budgetData.items)) {
        budgetData.items.forEach((item: BudgetItem) => {
          adjustments[item.id.toString()] = { amount_multiplier: 1.0 };
        });
      }
      setFormData(prev => ({ ...prev, adjustments }));
    } catch (error: unknown) {
      const err = error as ErrorWithDetails;
      toast.error(err.message || 'Failed to load budget');
      router.push('/scenarios/list');
    } finally {
      setLoading(false);
    }
  }, [budgetIdParam, router]);

  useEffect(() => {
    // Wait for searchParams to be ready
    if (!searchParams) {
      return; // Still loading
    }

    if (budgetIdParam) {
      loadBudget();
    } else {
      // No budget_id in URL, redirect to list page
      router.push('/scenarios/list');
    }
  }, [budgetIdParam, loadBudget, router, searchParams]);

  const handleAdjustmentChange = (itemId: number, field: 'amount_multiplier' | 'amount', value: number) => {
    setFormData(prev => ({
      ...prev,
      adjustments: {
        ...prev.adjustments,
        [itemId]: {
          ...prev.adjustments[itemId],
          [field]: value,
          ...(field === 'amount' ? { amount_multiplier: undefined } : { amount: undefined })
        }
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Scenario name is required');
      return;
    }

    if (!budget || !budgetIdParam) {
      toast.error('Budget not loaded');
      return;
    }

    try {
      setSaving(true);
      await apiClient.createScenario(parseInt(budgetIdParam), formData);
      toast.success('Scenario created successfully!');
      router.push(`/scenarios/list?budget_id=${budgetIdParam}`);
    } catch (error: unknown) {
      const err = error as ErrorWithDetails;
      toast.error(err.message || 'Failed to create scenario');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (value: number) => {
    return `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const calculateAdjustedAmount = (item: BudgetItem): number => {
    const adjustment = formData.adjustments[item.id.toString()];
    if (!adjustment) return item.amount;

    if (adjustment.amount !== undefined) {
      return adjustment.amount;
    }

    const multiplier = adjustment.amount_multiplier || 1.0;
    return item.amount * multiplier;
  };

  if (loading) {
    return (
      <Layout>
        <PageContainer>
          <ContentContainer>
            <LoadingContainer>
              <Spinner />
              <p>Loading budget...</p>
            </LoadingContainer>
          </ContentContainer>
        </PageContainer>
      </Layout>
    );
  }

  if (!budget) {
    return (
      <Layout>
        <PageContainer>
          <ComponentGate componentId={ComponentId.SCENARIO_CREATE}>
            <ContentContainer>
              <div style={{ textAlign: 'center', padding: theme.spacing.xl }}>
                <AlertCircle size={48} style={{ margin: '0 auto 16px', color: TEXT_COLOR_MUTED }} />
                <p>Budget not found</p>
                <Button onClick={() => router.push('/scenarios/list')} style={{ marginTop: theme.spacing.md }}>
                  Back to Scenarios
                </Button>
              </div>
            </ContentContainer>
          </ComponentGate>
        </PageContainer>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageContainer>
        <ComponentGate componentId={ComponentId.SCENARIO_CREATE}>
          <ContentContainer>
            <BackLink href={`/scenarios/list?budget_id=${budgetIdParam}`}>
              <ArrowLeft size={16} />
              Back to Scenarios
            </BackLink>

            <HeaderContainer>
              <h1>
                <Target size={36} />
                Create Scenario: {budget.name}
              </h1>
            </HeaderContainer>

            <form onSubmit={handleSubmit}>
              <FormCard>
                <h2 style={{ marginTop: 0, marginBottom: 0, fontSize: theme.typography.fontSizes.lg, fontWeight: theme.typography.fontWeights.bold, color: TEXT_COLOR_DARK }}>
                  Scenario Information
                </h2>

                <FormGroup>
                  <label>Scenario Name </label>
                  <StyledInput
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Best Case - 20% Growth"
                    required
                  />
                </FormGroup>

                <FormGroup>
                  <label>Description</label>
                  <StyledTextarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Scenario description..."
                    rows={4}
                  />
                </FormGroup>

                <FormGroup>
                  <label>Scenario Type </label>
                  <StyledSelect
                    value={formData.scenario_type}
                    onChange={(e) => setFormData({ ...formData, scenario_type: e.target.value })}
                    required
                  >
                    <option value="best_case">Best Case</option>
                    <option value="worst_case">Worst Case</option>
                    <option value="most_likely">Most Likely</option>
                    <option value="custom">Custom</option>
                  </StyledSelect>
                </FormGroup>
              </FormCard>

              <FormCard>
                <h2 style={{ marginTop: 0, marginBottom: 0, fontSize: theme.typography.fontSizes.lg, fontWeight: theme.typography.fontWeights.bold, color: TEXT_COLOR_DARK }}>
                  Budget Items Adjustments
                </h2>
                <p style={{ fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_MUTED, margin: 0 }}>
                  Adjust budget items using multipliers (e.g., 1.2 for 20% increase) or fixed amounts.
                </p>

                {budget.items && budget.items.length > 0 ? (
                  budget.items.map((item) => {
                    const adjustedAmount = calculateAdjustedAmount(item);
                    const adjustment = formData.adjustments[item.id.toString()] || {};

                    return (
                      <ItemCard key={item.id}>
                        <ItemHeader>
                          <span className="item-name">{item.name}</span>
                          <span className="item-type">{item.type}</span>
                        </ItemHeader>
                        <div style={{ marginBottom: theme.spacing.sm, fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_MUTED }}>
                          Original: {formatCurrency(item.amount)} → Adjusted: {formatCurrency(adjustedAmount)}
                        </div>
                        <AdjustmentInputs>
                          <FormGroup>
                            <label style={{ fontSize: theme.typography.fontSizes.xs, margin: 0 }}>Multiplier (e.g., 1.2 = +20%)</label>
                            <StyledInput
                              type="number"
                              step="0.1"
                              value={adjustment.amount_multiplier !== undefined ? adjustment.amount_multiplier : ''}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                if (!isNaN(val)) {
                                  handleAdjustmentChange(item.id, 'amount_multiplier', val);
                                }
                              }}
                              placeholder="1.0"
                            />
                          </FormGroup>
                          <FormGroup>
                            <label style={{ fontSize: theme.typography.fontSizes.xs, margin: 0 }}>Fixed Amount</label>
                            <StyledInput
                              type="number"
                              step="0.01"
                              value={adjustment.amount !== undefined ? adjustment.amount : ''}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                if (!isNaN(val)) {
                                  handleAdjustmentChange(item.id, 'amount', val);
                                }
                              }}
                              placeholder="Fixed amount"
                            />
                          </FormGroup>
                        </AdjustmentInputs>
                      </ItemCard>
                    );
                  })
                ) : (
                  <p style={{ color: TEXT_COLOR_MUTED, textAlign: 'center', padding: theme.spacing.xl }}>
                    No budget items found. Please add items to the budget first.
                  </p>
                )}
              </FormCard>

              <ActionButtons>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  <X size={16} />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                >
                  <Save size={16} />
                  {saving ? 'Creating...' : 'Create Scenario'}
                </Button>
              </ActionButtons>
            </form>
          </ContentContainer>
        </ComponentGate>
      </PageContainer>
    </Layout>
  );
};

const ScenarioCreatePageFallback = () => (
  <Layout>
    <PageContainer>
      <ContentContainer>
        <LoadingContainer>
          <Spinner />
          <p>Loading budget...</p>
        </LoadingContainer>
      </ContentContainer>
    </PageContainer>
  </Layout>
);

export default function ScenarioCreatePage() {
  return (
    <Suspense fallback={<ScenarioCreatePageFallback />}>
      <ScenarioCreatePageInner />
    </Suspense>
  );
}

