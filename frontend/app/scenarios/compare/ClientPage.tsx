'use client';
import React, { useEffect, useState, Suspense, useCallback } from 'react';
import styled, { useTheme, keyframes, css } from 'styled-components';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  GitCompare, ArrowLeft, Building2
} from 'lucide-react';
import Layout from '@/components/layout';
import apiClient from '@/lib/api';
import { theme as staticTheme } from '@/components/common/theme';
import { toast } from 'sonner';
import Link from 'next/link';
import { ComponentGate } from '@/lib/rbac/component-gate';
import { ComponentId } from '@/lib/rbac/component-access';
import { Button } from '@/components/ui/button';

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

const PRIMARY_COLOR = (props: any) => props.theme.colors.primary || '#00AA00';
const PRIMARY_HOVER = (props: any) => props.theme.mode === 'dark' ? '#00cc00' : '#008800';
const TEXT_COLOR_DARK = (props: any) => props.theme.colors.textDark;
const TEXT_COLOR_MUTED = (props: any) => props.theme.colors.textSecondary || '#666';
const BACKGROUND_GRADIENT = (props: any) => props.theme.mode === 'dark' ? `linear-gradient(180deg, #0f172a 0%, #1e293b 60%, ${props.theme.colors.background} 100%)` : `linear-gradient(180deg, #f9fafb 0%, #f3f4f6 60%, ${props.theme.colors.background} 100%)`;
const BORDER_COLOR = (props: any) => props.theme.colors.border;
const BG_SECONDARY = (props: any) => props.theme.colors.backgroundSecondary;

const CardShadow = (props: any) => `
  0 2px 4px -1px rgba(0, 0, 0, 0.06),
  0 1px 2px -1px rgba(0, 0, 0, 0.03),
  inset 0 0 0 1px ${props.theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'}
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
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.sm} ${props => props.theme.spacing.sm};
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  color: ${TEXT_COLOR_MUTED};
  text-decoration: none;
  margin-bottom: ${props => props.theme.spacing.md};
  transition: color ${props => props.theme.transitions.default};

  &:hover {
    color: ${TEXT_COLOR_DARK};
  }
`;

const HeaderContainer = styled.div`
  background: linear-gradient(135deg, ${PRIMARY_COLOR} 0%, ${PRIMARY_HOVER} 100%);
  color: #ffffff;
  padding: ${props => props.theme.spacing.xl};
  margin-bottom: ${props => props.theme.spacing.xl};
  border-radius: ${props => props.theme.borderRadius.md};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  
  h1 {
    font-size: clamp(28px, 3.5vw, 36px);
    font-weight: ${props => props.theme.typography.fontWeights.bold};
    margin: 0;
    display: flex;
    align-items: center;
    gap: ${props => props.theme.spacing.md};
  }
`;

const ComparisonCard = styled.div`
  background: ${props => props.theme.colors.background};
  border-radius: ${props => props.theme.borderRadius.md};
  border: 1px solid ${BORDER_COLOR};
  box-shadow: ${CardShadow};
  padding: ${props => props.theme.spacing.xl};
  margin-bottom: ${props => props.theme.spacing.lg};
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
`;

const ScenarioSelector = styled.div`
  background: ${BG_SECONDARY};
  border: 1px solid ${BORDER_COLOR};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.lg};
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xs};
`;

const FilterGroup = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  
  @media (max-width: 768px) {
    width: 100%;
  }
`;

const StyledSelect = styled.select`
  width: 100%;
  max-width: 100%;
  padding: 10px 14px;
  border: 1.5px solid ${props => props.theme.mode === 'dark' ? '#334155' : '#e5e7eb'};
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  background: ${props => props.theme.colors.background};
  color: ${TEXT_COLOR_DARK};
  transition: all 0.2s ease-in-out;
  outline: none;
  box-sizing: border-box;
  margin: 0;
  cursor: pointer;

  &:focus {
    border-color: ${PRIMARY_COLOR};
    box-shadow: 0 0 0 3px ${props => props.theme.mode === 'dark' ? 'rgba(0, 170, 0, 0.2)' : 'rgba(0, 170, 0, 0.1)'};
    background: ${props => props.theme.colors.background};
  }

  &:hover:not(:disabled) {
    border-color: ${props => props.theme.mode === 'dark' ? '#475569' : '#d1d5db'};
  }

  &:disabled {
    background-color: ${BG_SECONDARY};
    color: ${TEXT_COLOR_MUTED};
    cursor: not-allowed;
    opacity: 0.7;
    border-color: ${BORDER_COLOR};
  }
`;

const ScenarioCheckbox = styled.label`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.sm};
  cursor: pointer;
  border-radius: ${props => props.theme.borderRadius.sm};
  transition: background ${props => props.theme.transitions.default};
  
  &:hover {
    background: ${props => props.theme.mode === 'dark' ? 'rgba(0, 170, 0, 0.1)' : 'rgba(0, 170, 0, 0.05)'};
  }
  
  input[type="checkbox"] {
    width: 20px;
    height: 20px;
    cursor: pointer;
  }
`;

const ComparisonTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: ${props => props.theme.spacing.md};
  
  th {
    text-align: left;
    padding: ${props => props.theme.spacing.md};
    background: ${BG_SECONDARY};
    font-weight: ${props => props.theme.typography.fontWeights.medium};
    font-size: ${props => props.theme.typography.fontSizes.sm};
    color: ${TEXT_COLOR_DARK};
    border-bottom: 2px solid ${BORDER_COLOR};
  }
  
  td {
    padding: ${props => props.theme.spacing.md};
    border-bottom: 1px solid ${BORDER_COLOR};
    font-size: ${props => props.theme.typography.fontSizes.sm};
    color: ${TEXT_COLOR_DARK};
  }
  
  tr:hover {
    background: ${BG_SECONDARY};
  }
  
  .base-budget {
    background: ${props => props.theme.mode === 'dark' ? 'rgba(59, 130, 246, 0.1)' : '#f0f9ff'};
    font-weight: ${props => props.theme.typography.fontWeights.bold};
  }
`;

const MetricCard = styled.div<{ $highlight?: boolean }>`
  background: ${props => props.$highlight ? (props.theme.mode === 'dark' ? 'rgba(0, 170, 0, 0.15)' : 'rgba(0, 170, 0, 0.05)') : BG_SECONDARY};
  border: 1px solid ${props => props.$highlight ? PRIMARY_COLOR : BORDER_COLOR};
  border-radius: ${props => props.theme.borderRadius.sm};
  padding: ${props => props.theme.spacing.md};
  text-align: center;
  
  .label {
    font-size: ${props => props.theme.typography.fontSizes.xs};
    color: ${TEXT_COLOR_MUTED};
    margin-bottom: ${props => props.theme.spacing.xs};
  }
  
  .value {
    font-size: ${props => props.theme.typography.fontSizes.lg};
    font-weight: ${props => props.theme.typography.fontWeights.bold};
    color: ${TEXT_COLOR_DARK};
  }
`;

const ComparisonGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${props => props.theme.spacing.md};
  margin-top: 0;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: ${props => props.theme.spacing.md};
  
  p {
    color: ${TEXT_COLOR_MUTED};
    font-size: ${props => props.theme.typography.fontSizes.md};
  }
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid ${BORDER_COLOR};
  border-top-color: ${PRIMARY_COLOR};
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

interface Scenario {
  id: number;
  name: string;
  scenario_type: string;
  total_revenue: number;
  total_expenses: number;
  total_profit: number;
}

interface ComparisonResult {
  base: {
    name: string;
    total_revenue: number;
    total_expenses: number;
    total_profit: number;
  };
  scenarios: Scenario[];
}

interface Budget {
  id: number;
  name: string;
  status: string;
}

const CompareScenariosPageInner: React.FC = () => {
  const theme = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const budgetIdParam = searchParams?.get('budget_id');
  const scenariosParam = searchParams?.get('scenarios');

  const [loading, setLoading] = useState(true);
  const [loadingComparison, setLoadingComparison] = useState(false);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [selectedBudgetId, setSelectedBudgetId] = useState<string>(budgetIdParam || '');
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedScenarios, setSelectedScenarios] = useState<number[]>([]);
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [budgetName, setBudgetName] = useState<string>('');

  const loadBudgets = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.getBudgets();
      setBudgets(Array.isArray(response.data) ? response.data : []);
    } catch (error: unknown) {
      const err = error as ErrorWithDetails;
      toast.error(err.message || 'Failed to load budgets');
    } finally {
      if (!budgetIdParam) {
        setLoading(false);
      }
    }
  }, [budgetIdParam]);

  const loadScenarios = useCallback(async () => {
    if (!selectedBudgetId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [scenariosResponse, budgetResponse] = await Promise.all([
        apiClient.getScenarios(parseInt(selectedBudgetId)),
        apiClient.getBudget(parseInt(selectedBudgetId))
      ]);

      setScenarios(Array.isArray(scenariosResponse.data) ? scenariosResponse.data : []);
      const budget = budgetResponse.data as { name?: string };
      setBudgetName(budget.name || 'Budget');
    } catch (error: unknown) {
      const err = error as ErrorWithDetails;
      toast.error(err.message || 'Failed to load scenarios');
    } finally {
      setLoading(false);
    }
  }, [selectedBudgetId]);

  const compareScenarios = useCallback(async () => {
    if (!selectedBudgetId || selectedScenarios.length === 0) return;

    try {
      setLoadingComparison(true);
      const response = await apiClient.compareScenarios(parseInt(selectedBudgetId), selectedScenarios);
      setComparison(response.data as ComparisonResult);
    } catch (error: unknown) {
      const err = error as ErrorWithDetails;
      toast.error(err.message || 'Failed to compare scenarios');
    } finally {
      setLoadingComparison(false);
    }
  }, [selectedBudgetId, selectedScenarios]);

  useEffect(() => {
    loadBudgets();
  }, [loadBudgets]);

  useEffect(() => {
    // Wait for searchParams to be ready
    if (!searchParams) {
      return; // Still loading
    }

    if (budgetIdParam) {
      setSelectedBudgetId(budgetIdParam);
      if (scenariosParam) {
        const ids = scenariosParam.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
        setSelectedScenarios(ids);
      }
    }
  }, [budgetIdParam, scenariosParam, searchParams]);

  useEffect(() => {
    if (selectedBudgetId) {
      loadScenarios();
    }
  }, [selectedBudgetId, loadScenarios]);

  useEffect(() => {
    if (selectedScenarios.length > 0 && selectedBudgetId) {
      compareScenarios();
    } else {
      setComparison(null);
    }
  }, [selectedScenarios, selectedBudgetId, compareScenarios]);

  const handleScenarioToggle = (scenarioId: number) => {
    setSelectedScenarios(prev => {
      if (prev.includes(scenarioId)) {
        return prev.filter(id => id !== scenarioId);
      } else {
        return [...prev, scenarioId];
      }
    });
  };

  const handleBudgetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newBudgetId = e.target.value;
    setSelectedBudgetId(newBudgetId);
    setSelectedScenarios([]);
    setComparison(null);
    // Update URL without refreshing
    const params = new URLSearchParams(searchParams?.toString());
    if (newBudgetId) {
      params.set('budget_id', newBudgetId);
    } else {
      params.delete('budget_id');
    }
    params.delete('scenarios');
    router.push(`/scenarios/compare?${params.toString()}`);
  };

  const formatCurrency = (value: number) => {
    return `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const calculateDifference = (base: number, scenario: number) => {
    return scenario - base;
  };

  const calculatePercentChange = (base: number, scenario: number) => {
    if (base === 0) return 0;
    return ((scenario - base) / base) * 100;
  };

  if (loading) {
    return (
      <Layout>
        <PageContainer>
          <ContentContainer>
            <LoadingContainer>
              <Spinner />
              <p>Loading scenarios...</p>
            </LoadingContainer>
          </ContentContainer>
        </PageContainer>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageContainer>
        <ComponentGate componentId={ComponentId.SCENARIO_COMPARE}>
          <ContentContainer>
            <BackLink href={selectedBudgetId ? `/scenarios/list?budget_id=${selectedBudgetId}` : '/scenarios/list'}>
              <ArrowLeft size={16} />
              Back to Scenarios
            </BackLink>

            <HeaderContainer>
              <h1>
                <GitCompare size={36} />
                Compare Scenarios: {selectedBudgetId ? budgetName : 'Select Budget'}
              </h1>
              <p style={{ marginTop: theme.spacing.xl, opacity: 0.9 }}>
                Select a budget and scenarios to compare side by side
              </p>
            </HeaderContainer>

            <ComparisonCard>
              <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md, flexWrap: 'wrap' }}>
                  <FilterGroup>
                    <Building2 size={20} color={TEXT_COLOR_MUTED({ theme })} />
                    <label style={{ fontWeight: theme.typography.fontWeights.medium, color: TEXT_COLOR_DARK({ theme }), whiteSpace: 'nowrap' }}>
                      Budget:
                    </label>
                  </FilterGroup>
                  <StyledSelect
                    value={selectedBudgetId}
                    onChange={handleBudgetChange}
                    style={{ minWidth: '250px', flex: 1 }}
                  >
                    <option value="">Select a budget...</option>
                    {budgets.map((budget) => (
                      <option key={budget.id} value={budget.id}>
                        {budget.name} ({budget.status})
                      </option>
                    ))}
                  </StyledSelect>
                </div>

                {selectedBudgetId && (
                  <>
                    <hr style={{ border: 0, borderTop: `1px solid ${theme.colors.border}`, margin: `${theme.spacing.sm} 0` }} />
                    <h2 style={{ marginTop: 0, marginBottom: 0, fontSize: theme.typography.fontSizes.lg, fontWeight: theme.typography.fontWeights.bold, color: TEXT_COLOR_DARK({ theme }) }}>
                      Select Scenarios to Compare
                    </h2>
                    <ScenarioSelector>
                      {scenarios.length === 0 ? (
                        <p style={{ color: TEXT_COLOR_MUTED({ theme }), textAlign: 'center', padding: theme.spacing.lg }}>
                          No scenarios available for this budget.
                        </p>
                      ) : (
                        scenarios.map((scenario) => (
                          <ScenarioCheckbox key={scenario.id}>
                            <input
                              type="checkbox"
                              checked={selectedScenarios.includes(scenario.id)}
                              onChange={() => handleScenarioToggle(scenario.id)}
                            />
                            <span>{scenario.name}</span>
                            <span style={{ marginLeft: 'auto', fontSize: theme.typography.fontSizes.xs, color: TEXT_COLOR_MUTED({ theme }) }}>
                              ({scenario.scenario_type.replace('_', ' ')})
                            </span>
                          </ScenarioCheckbox>
                        ))
                      )}
                    </ScenarioSelector>
                  </>
                )}
              </div>
            </ComparisonCard>

            {loadingComparison ? (
              <LoadingContainer>
                <Spinner />
                <p>Comparing scenarios...</p>
              </LoadingContainer>
            ) : comparison && comparison.scenarios.length > 0 ? (
              <ComparisonCard>
                <h2 style={{ marginTop: 0, marginBottom: 0, fontSize: theme.typography.fontSizes.lg, fontWeight: theme.typography.fontWeights.bold, color: TEXT_COLOR_DARK({ theme }) }}>
                  Comparison Results
                </h2>

                <div style={{ overflowX: 'auto', marginTop: 0 }}>
                  <ComparisonTable>
                    <thead>
                      <tr>
                        <th>Metric</th>
                        <th className="base-budget">Base Budget</th>
                        {comparison.scenarios.map((scenario) => (
                          <th key={scenario.id}>{scenario.name}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>Total Revenue</strong></td>
                        <td className="base-budget">{formatCurrency(comparison.base.total_revenue)}</td>
                        {comparison.scenarios.map((scenario) => {
                          const diff = calculateDifference(comparison.base.total_revenue, scenario.total_revenue);
                          const percent = calculatePercentChange(comparison.base.total_revenue, scenario.total_revenue);
                          return (
                            <td key={scenario.id}>
                              {formatCurrency(scenario.total_revenue)}
                              <br />
                              <span style={{
                                fontSize: theme.typography.fontSizes.xs,
                                color: diff >= 0 ? '#10b981' : (theme.mode === 'dark' ? '#f87171' : '#ef4444')
                              }}>
                                {diff >= 0 ? '+' : ''}{formatCurrency(diff)} ({percent >= 0 ? '+' : ''}{percent.toFixed(2)}%)
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                      <tr>
                        <td><strong>Total Expenses</strong></td>
                        <td className="base-budget">{formatCurrency(comparison.base.total_expenses)}</td>
                        {comparison.scenarios.map((scenario) => {
                          const diff = calculateDifference(comparison.base.total_expenses, scenario.total_expenses);
                          const percent = calculatePercentChange(comparison.base.total_expenses, scenario.total_expenses);
                          return (
                            <td key={scenario.id}>
                              {formatCurrency(scenario.total_expenses)}
                              <br />
                              <span style={{
                                fontSize: theme.typography.fontSizes.xs,
                                color: diff <= 0 ? '#10b981' : (theme.mode === 'dark' ? '#f87171' : '#ef4444')
                              }}>
                                {diff >= 0 ? '+' : ''}{formatCurrency(diff)} ({percent >= 0 ? '+' : ''}{percent.toFixed(2)}%)
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                      <tr>
                        <td><strong>Total Profit</strong></td>
                        <td className="base-budget">{formatCurrency(comparison.base.total_profit)}</td>
                        {comparison.scenarios.map((scenario) => {
                          const diff = calculateDifference(comparison.base.total_profit, scenario.total_profit);
                          const percent = calculatePercentChange(comparison.base.total_profit, scenario.total_profit);
                          return (
                            <td key={scenario.id}>
                              {formatCurrency(scenario.total_profit)}
                              <br />
                              <span style={{
                                fontSize: theme.typography.fontSizes.xs,
                                color: diff >= 0 ? '#10b981' : (theme.mode === 'dark' ? '#f87171' : '#ef4444')
                              }}>
                                {diff >= 0 ? '+' : ''}{formatCurrency(diff)} ({percent >= 0 ? '+' : ''}{percent.toFixed(2)}%)
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </ComparisonTable>
                </div>

                <ComparisonGrid>
                  {comparison.scenarios.map((scenario) => {
                    const profitDiff = calculateDifference(comparison.base.total_profit, scenario.total_profit);
                    const isBest = profitDiff === Math.max(...comparison.scenarios.map(s =>
                      calculateDifference(comparison.base.total_profit, s.total_profit)
                    ));

                    return (
                      <MetricCard key={scenario.id} $highlight={isBest}>
                        <div className="label">{scenario.name}</div>
                        <div className="value">{formatCurrency(scenario.total_profit)}</div>
                        <div style={{
                          fontSize: theme.typography.fontSizes.xs,
                          color: profitDiff >= 0 ? '#10b981' : (theme.mode === 'dark' ? '#f87171' : '#ef4444'),
                          marginTop: theme.spacing.xs
                        }}>
                          {profitDiff >= 0 ? '+' : ''}{formatCurrency(profitDiff)} vs Base
                        </div>
                      </MetricCard>
                    );
                  })}
                </ComparisonGrid>
              </ComparisonCard>
            ) : selectedScenarios.length === 0 ? (
              <ComparisonCard>
                <div style={{ textAlign: 'center', padding: theme.spacing.xl, color: TEXT_COLOR_MUTED({ theme }) }}>
                  <GitCompare size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                  <p>Select at least one scenario to compare.</p>
                </div>
              </ComparisonCard>
            ) : null}
          </ContentContainer>
        </ComponentGate>
      </PageContainer>
    </Layout>
  );
};

const CompareScenariosFallback = () => (
  <Layout>
    <PageContainer>
      <ContentContainer>
        <LoadingContainer>
          <Spinner />
          <p>Loading scenarios...</p>
        </LoadingContainer>
      </ContentContainer>
    </PageContainer>
  </Layout>
);

export default function CompareScenariosPage() {
  return (
    <Suspense fallback={<CompareScenariosFallback />}>
      <CompareScenariosPageInner />
    </Suspense>
  );
}

