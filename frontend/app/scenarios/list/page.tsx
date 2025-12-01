'use client';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/rbac/auth-context';
import {
  Target, Plus, ArrowLeft, Filter, Search, Building2,
  TrendingUp, AlertCircle, CheckCircle, BarChart3
} from 'lucide-react';
import Layout from '@/components/layout';
import apiClient from '@/lib/api';
import { theme } from '@/components/common/theme';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import Link from 'next/link';

const PRIMARY_COLOR = theme.colors.primary || '#00AA00';
const PRIMARY_LIGHT = '#e8f5e9';
const TEXT_COLOR_DARK = '#111827';
const TEXT_COLOR_MUTED = theme.colors.textSecondary || '#666';
const BACKGROUND_GRADIENT = `linear-gradient(180deg, #f9fafb 0%, #f3f4f6 60%, ${theme.colors.background} 100%)`;

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
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: ${BACKGROUND_GRADIENT};
`;

const ContentContainer = styled.div`
  flex: 1;
  width: 100%;
  max-width: 1600px;
  margin-left: auto;
  margin-right: auto;
  padding: ${theme.spacing.sm} ${theme.spacing.lg} ${theme.spacing.sm};
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
  padding: ${theme.spacing.xl} clamp(${theme.spacing.lg}, 4vw, ${theme.spacing.xl});
  margin-bottom: ${theme.spacing.xl};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-bottom: 3px solid rgba(255, 255, 255, 0.1);
`;

const HeaderContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: ${theme.spacing.md};
  
  h1 {
    font-size: clamp(28px, 3.5vw, 42px);
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

const ScenariosGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.xl};
`;

const ScenarioCard = styled.div`
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  box-shadow: ${CardShadow};
  padding: ${theme.spacing.lg};
  transition: all ${theme.transitions.default};
  cursor: pointer;
  
  &:hover {
    box-shadow: ${CardShadowHover};
    transform: translateY(-2px);
    border-color: ${PRIMARY_COLOR};
  }
`;

const ScenarioHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${theme.spacing.md};
  
  h3 {
    font-size: ${theme.typography.fontSizes.lg};
    font-weight: ${theme.typography.fontWeights.bold};
    color: ${TEXT_COLOR_DARK};
    margin: 0;
    flex: 1;
  }
`;

const ScenarioTypeBadge = styled.span<{ $type: string }>`
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.sm};
  font-size: ${theme.typography.fontSizes.xs};
  font-weight: ${theme.typography.fontWeights.medium};
  background: ${props => {
    switch (props.$type) {
      case 'best_case': return '#d1fae5';
      case 'worst_case': return '#fecaca';
      case 'most_likely': return '#dbeafe';
      default: return '#f3f4f6';
    }
  }};
  color: ${props => {
    switch (props.$type) {
      case 'best_case': return '#065f46';
      case 'worst_case': return '#991b1b';
      case 'most_likely': return '#1e40af';
      default: return '#6b7280';
    }
  }};
  text-transform: capitalize;
`;

const ScenarioInfo = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.md};
  background: ${PRIMARY_LIGHT};
  border-radius: ${theme.borderRadius.sm};
  margin-bottom: ${theme.spacing.md};
`;

const InfoItem = styled.div`
  text-align: center;
  
  .label {
    font-size: ${theme.typography.fontSizes.xs};
    color: ${TEXT_COLOR_MUTED};
    margin-bottom: ${theme.spacing.xs};
  }
  
  .value {
    font-size: ${theme.typography.fontSizes.md};
    font-weight: ${theme.typography.fontWeights.bold};
    color: ${TEXT_COLOR_DARK};
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

interface Scenario {
  id: number;
  budget_id: number;
  name: string;
  description?: string;
  scenario_type: string;
  adjustments?: any;
  total_revenue: number;
  total_expenses: number;
  total_profit: number;
  created_at: string;
}

const ScenarioListPage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [selectedBudgetId, setSelectedBudgetId] = useState<string>('');
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingScenarios, setLoadingScenarios] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');

  useEffect(() => {
    loadBudgets();
  }, []);

  useEffect(() => {
    if (selectedBudgetId) {
      loadScenarios();
    } else {
      setScenarios([]);
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

  const loadScenarios = async () => {
    if (!selectedBudgetId) return;
    
    try {
      setLoadingScenarios(true);
      const response = await apiClient.getScenarios(parseInt(selectedBudgetId));
      setScenarios(Array.isArray(response.data) ? response.data : []);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load scenarios');
    } finally {
      setLoadingScenarios(false);
    }
  };

  const filteredScenarios = scenarios.filter(scenario => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !scenario.name.toLowerCase().includes(query) &&
        !scenario.description?.toLowerCase().includes(query)
      ) {
        return false;
      }
    }
    if (selectedType && scenario.scenario_type !== selectedType) {
      return false;
    }
    return true;
  });

  const formatCurrency = (value: number) => {
    return `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
          <BackLink href="/budgets">
            <ArrowLeft size={16} />
            Back to Budgets
          </BackLink>

          <HeaderContainer>
            <HeaderContent>
              <div>
                <h1>
                  <Target size={36} />
                  Budget Scenarios
                </h1>
                <p style={{ marginTop: theme.spacing.sm, opacity: 0.9 }}>
                  Create and manage what-if scenarios for budgets
                </p>
              </div>
              {selectedBudgetId && (
                <Button
                  onClick={() => router.push(`/scenarios/create?budget_id=${selectedBudgetId}`)}
                  style={{ background: 'white', color: PRIMARY_COLOR }}
                >
                  <Plus size={16} />
                  New Scenario
                </Button>
              )}
            </HeaderContent>
          </HeaderContainer>

          <FiltersContainer>
            <Building2 size={20} color={TEXT_COLOR_MUTED} />
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
              <>
                <Search size={20} color={TEXT_COLOR_MUTED} />
                <Input
                  type="text"
                  placeholder="Search scenarios..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ flex: 1, maxWidth: '300px' }}
                />
                <Filter size={20} color={TEXT_COLOR_MUTED} />
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                  <option value="">All Types</option>
                  <option value="best_case">Best Case</option>
                  <option value="worst_case">Worst Case</option>
                  <option value="most_likely">Most Likely</option>
                  <option value="custom">Custom</option>
                </select>
              </>
            )}
          </FiltersContainer>

          {selectedBudgetId ? (
            loadingScenarios ? (
              <LoadingContainer>
                <Spinner />
                <p>Loading scenarios...</p>
              </LoadingContainer>
            ) : filteredScenarios.length === 0 ? (
              <div style={{ textAlign: 'center', padding: theme.spacing.xl, color: TEXT_COLOR_MUTED }}>
                <Target size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                <p>No scenarios found. Create your first scenario to get started.</p>
              </div>
            ) : (
              <ScenariosGrid>
                {filteredScenarios.map((scenario) => (
                  <ScenarioCard
                    key={scenario.id}
                    onClick={() => router.push(`/scenarios/campare?budget_id=${selectedBudgetId}`)}
                  >
                    <ScenarioHeader>
                      <h3>{scenario.name}</h3>
                      <ScenarioTypeBadge $type={scenario.scenario_type}>
                        {scenario.scenario_type.replace('_', ' ')}
                      </ScenarioTypeBadge>
                    </ScenarioHeader>
                    
                    {scenario.description && (
                      <p style={{ fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_MUTED, marginBottom: theme.spacing.md }}>
                        {scenario.description}
                      </p>
                    )}

                    <ScenarioInfo>
                      <InfoItem>
                        <div className="label">Revenue</div>
                        <div className="value">{formatCurrency(scenario.total_revenue)}</div>
                      </InfoItem>
                      <InfoItem>
                        <div className="label">Expenses</div>
                        <div className="value">{formatCurrency(scenario.total_expenses)}</div>
                      </InfoItem>
                      <InfoItem>
                        <div className="label">Profit</div>
                        <div className="value">{formatCurrency(scenario.total_profit)}</div>
                      </InfoItem>
                    </ScenarioInfo>

                    <div style={{ fontSize: theme.typography.fontSizes.xs, color: TEXT_COLOR_MUTED }}>
                      Created: {formatDate(scenario.created_at)}
                    </div>
                  </ScenarioCard>
                ))}
              </ScenariosGrid>
            )
          ) : (
            <div style={{ textAlign: 'center', padding: theme.spacing.xl, color: TEXT_COLOR_MUTED }}>
              <Target size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
              <p>Please select a budget to view scenarios.</p>
            </div>
          )}
        </ContentContainer>
      </PageContainer>
    </Layout>
  );
};

export default ScenarioListPage;

