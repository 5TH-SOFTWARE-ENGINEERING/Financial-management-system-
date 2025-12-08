'use client';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/rbac/auth-context';
import {
  GitCompare, ArrowLeft, CheckSquare, Square, AlertCircle, BarChart3
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

const ComparisonCard = styled.div`
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  box-shadow: ${CardShadow};
  padding: ${theme.spacing.xl};
  margin-bottom: ${theme.spacing.lg};
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
`;

const ScenarioSelector = styled.div`
  background: #f9fafb;
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  padding: ${theme.spacing.lg};
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.xs};
`;

const ScenarioCheckbox = styled.label`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.sm};
  cursor: pointer;
  border-radius: ${theme.borderRadius.sm};
  transition: background ${theme.transitions.default};
  
  &:hover {
    background: ${PRIMARY_COLOR}10;
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
  
  .base-budget {
    background: #f0f9ff;
    font-weight: ${theme.typography.fontWeights.bold};
  }
`;

const MetricCard = styled.div<{ $highlight?: boolean }>`
  background: ${props => props.$highlight ? PRIMARY_COLOR + '15' : '#f9fafb'};
  border: 1px solid ${props => props.$highlight ? PRIMARY_COLOR : theme.colors.border};
  border-radius: ${theme.borderRadius.sm};
  padding: ${theme.spacing.md};
  text-align: center;
  
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
`;

const ComparisonGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${theme.spacing.md};
  margin-top: 0;
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

const CompareScenariosPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const budgetIdParam = searchParams?.get('budget_id');
  const scenariosParam = searchParams?.get('scenarios');
  
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [loadingComparison, setLoadingComparison] = useState(false);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedScenarios, setSelectedScenarios] = useState<number[]>([]);
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [budgetName, setBudgetName] = useState<string>('');

  useEffect(() => {
    if (budgetIdParam) {
      loadScenarios();
      if (scenariosParam) {
        const ids = scenariosParam.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
        setSelectedScenarios(ids);
      }
    } else {
      toast.error('Budget ID is required');
      router.push('/scenarios/list');
    }
  }, [budgetIdParam, scenariosParam]);

  useEffect(() => {
    if (selectedScenarios.length > 0 && budgetIdParam) {
      compareScenarios();
    } else {
      setComparison(null);
    }
  }, [selectedScenarios, budgetIdParam]);

  const loadScenarios = async () => {
    if (!budgetIdParam) return;
    
    try {
      setLoading(true);
      const [scenariosResponse, budgetResponse] = await Promise.all([
        apiClient.getScenarios(parseInt(budgetIdParam)),
        apiClient.getBudget(parseInt(budgetIdParam))
      ]);
      
      setScenarios(Array.isArray(scenariosResponse.data) ? scenariosResponse.data : []);
      const budget = budgetResponse.data as any;
      setBudgetName(budget.name || 'Budget');
    } catch (error: any) {
      toast.error(error.message || 'Failed to load scenarios');
    } finally {
      setLoading(false);
    }
  };

  const compareScenarios = async () => {
    if (!budgetIdParam || selectedScenarios.length === 0) return;
    
    try {
      setLoadingComparison(true);
      const response = await apiClient.compareScenarios(parseInt(budgetIdParam), selectedScenarios);
      setComparison(response.data as ComparisonResult);
    } catch (error: any) {
      toast.error(error.message || 'Failed to compare scenarios');
    } finally {
      setLoadingComparison(false);
    }
  };

  const handleScenarioToggle = (scenarioId: number) => {
    setSelectedScenarios(prev => {
      if (prev.includes(scenarioId)) {
        return prev.filter(id => id !== scenarioId);
      } else {
        return [...prev, scenarioId];
      }
    });
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
        <ContentContainer>
          <BackLink href={`/scenarios/list?budget_id=${budgetIdParam}`}>
            <ArrowLeft size={16} />
            Back to Scenarios
          </BackLink>

          <HeaderContainer>
            <h1>
              <GitCompare size={36} />
              Compare Scenarios: {budgetName}
            </h1>
            <p style={{ marginTop: theme.spacing.sm, opacity: 0.9 }}>
              Select scenarios to compare side by side with the base budget
            </p>
          </HeaderContainer>

          <ComparisonCard>
            <h2 style={{ marginTop: 0, marginBottom: 0, fontSize: theme.typography.fontSizes.lg, fontWeight: theme.typography.fontWeights.bold, color: TEXT_COLOR_DARK }}>
              Select Scenarios to Compare
            </h2>
            <ScenarioSelector>
              {scenarios.length === 0 ? (
                <p style={{ color: TEXT_COLOR_MUTED, textAlign: 'center', padding: theme.spacing.lg }}>
                  No scenarios available. Create scenarios first.
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
                    <span style={{ marginLeft: 'auto', fontSize: theme.typography.fontSizes.xs, color: TEXT_COLOR_MUTED }}>
                      ({scenario.scenario_type.replace('_', ' ')})
                    </span>
                  </ScenarioCheckbox>
                ))
              )}
            </ScenarioSelector>
          </ComparisonCard>

          {loadingComparison ? (
            <LoadingContainer>
              <Spinner />
              <p>Comparing scenarios...</p>
            </LoadingContainer>
          ) : comparison && comparison.scenarios.length > 0 ? (
            <ComparisonCard>
              <h2 style={{ marginTop: 0, marginBottom: 0, fontSize: theme.typography.fontSizes.lg, fontWeight: theme.typography.fontWeights.bold, color: TEXT_COLOR_DARK }}>
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
                              color: diff >= 0 ? '#10b981' : '#ef4444'
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
                              color: diff <= 0 ? '#10b981' : '#ef4444'
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
                              color: diff >= 0 ? '#10b981' : '#ef4444'
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
                        color: profitDiff >= 0 ? '#10b981' : '#ef4444',
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
              <div style={{ textAlign: 'center', padding: theme.spacing.xl, color: TEXT_COLOR_MUTED }}>
                <GitCompare size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                <p>Select at least one scenario to compare.</p>
              </div>
            </ComparisonCard>
          ) : null}
        </ContentContainer>
      </PageContainer>
    </Layout>
  );
};

export default CompareScenariosPage;

