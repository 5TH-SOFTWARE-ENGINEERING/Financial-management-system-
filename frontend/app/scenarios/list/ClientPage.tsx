'use client';
import React, { useEffect, useState, useCallback } from 'react';
import styled from 'styled-components';
import { useRouter } from 'next/navigation';
import {
  Target, Plus, ArrowLeft, Filter, Search, Building2, Trash2, Loader2, Eye, EyeOff, Lock, XCircle
} from 'lucide-react';
import Layout from '@/components/layout';
import apiClient from '@/lib/api';
import { theme } from '@/components/common/theme';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Link from 'next/link';
import { useAuth } from '@/lib/rbac/auth-context';

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
  display: grid;
  grid-template-columns: auto auto 1fr auto auto;
  gap: ${theme.spacing.md};
  align-items: center;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
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

const FilterGroup = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  
  @media (max-width: 768px) {
    width: 100%;
  }
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
`;

const ScenarioTitle = styled.h3`
  font-size: ${theme.typography.fontSizes.lg};
  font-weight: ${theme.typography.fontWeights.bold};
  color: ${TEXT_COLOR_DARK};
  margin: 0;
  flex: 1;
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

const ModalOverlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: ${props => props.$isOpen ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(4px);
`;

const ModalContent = styled.div`
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  padding: ${theme.spacing.lg};
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease-out;

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${theme.spacing.lg};
  padding-bottom: ${theme.spacing.md};
  border-bottom: 1px solid ${theme.colors.border};
  
  h3 {
    font-size: ${theme.typography.fontSizes.lg};
    font-weight: ${theme.typography.fontWeights.bold};
    color: ${TEXT_COLOR_DARK};
    margin: 0;
    display: flex;
    align-items: center;
    gap: ${theme.spacing.sm};
  }
  
  button {
    background: none;
    border: none;
    cursor: pointer;
    color: ${TEXT_COLOR_MUTED};
    padding: ${theme.spacing.xs};
    border-radius: ${theme.borderRadius.sm};
    transition: all ${theme.transitions.default};
    
    &:hover {
      background: ${theme.colors.backgroundSecondary};
      color: ${TEXT_COLOR_DARK};
    }
    
    svg {
      width: 20px;
      height: 20px;
    }
  }
`;

const ModalTitle = styled.h3`
  font-size: ${theme.typography.fontSizes.lg};
  font-weight: ${theme.typography.fontWeights.bold};
  color: ${TEXT_COLOR_DARK};
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
`;

const WarningBox = styled.div`
  padding: ${theme.spacing.md};
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: ${theme.borderRadius.md};
  margin-bottom: ${theme.spacing.lg};
  
  p {
    margin: 0;
    color: #dc2626;
    font-size: ${theme.typography.fontSizes.sm};
    line-height: 1.5;
  }
`;

const Label = styled.label`
  display: block;
  font-size: ${theme.typography.fontSizes.sm};
  font-weight: ${theme.typography.fontWeights.medium};
  color: ${TEXT_COLOR_DARK};
  margin-bottom: ${theme.spacing.sm};
`;

const PasswordInputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  
  input {
    width: 100%;
    padding: ${theme.spacing.sm} ${theme.spacing.md};
    padding-right: 48px;
    border: 1px solid ${theme.colors.border};
    border-radius: ${theme.borderRadius.md};
    background: ${theme.colors.background};
    font-size: ${theme.typography.fontSizes.md};
    color: ${TEXT_COLOR_DARK};
    transition: all ${theme.transitions.default};
    
    &:focus {
      outline: none;
      border-color: ${PRIMARY_COLOR};
      box-shadow: 0 0 0 3px rgba(0, 170, 0, 0.1);
    }
    
    &::placeholder {
      color: ${TEXT_COLOR_MUTED};
      opacity: 0.5;
    }
    
    &:disabled {
      background-color: ${theme.colors.backgroundSecondary};
      color: ${TEXT_COLOR_MUTED};
      cursor: not-allowed;
      opacity: 0.7;
    }
  }
  
  button {
    position: absolute;
    right: ${theme.spacing.sm};
    background: none;
    border: none;
    cursor: pointer;
    color: ${TEXT_COLOR_MUTED};
    padding: ${theme.spacing.xs};
    border-radius: ${theme.borderRadius.sm};
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all ${theme.transitions.default};
    
    &:hover {
      color: ${TEXT_COLOR_DARK};
      background: ${theme.colors.backgroundSecondary};
    }
    
    svg {
      width: 18px;
      height: 18px;
    }
  }
`;

const ErrorText = styled.p`
  color: #dc2626;
  font-size: ${theme.typography.fontSizes.sm};
  margin: ${theme.spacing.xs} 0 0 0;
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
`;

const ModalActions = styled.div`
  display: flex;
  gap: 16px;
  justify-content: space-between;
  margin-top: ${theme.spacing.lg};
`;

const ActionButtons = styled.div`
  display: flex;
  gap: ${theme.spacing.sm};
  align-items: center;
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
  adjustments?: Record<string, { amount_multiplier?: number; amount?: number }>;
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [scenarioToDelete, setScenarioToDelete] = useState<Scenario | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletePasswordError, setDeletePasswordError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [verifyingPassword, setVerifyingPassword] = useState(false);

  useEffect(() => {
    loadBudgets();
  }, []);

  const loadBudgets = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getBudgets();
      setBudgets(Array.isArray(response.data) ? response.data : []);
    } catch (error: unknown) {
      const err = error as ErrorWithDetails;
      toast.error(err.message || 'Failed to load budgets');
    } finally {
      setLoading(false);
    }
  };

  const loadScenarios = useCallback(async () => {
    if (!selectedBudgetId) return;

    try {
      setLoadingScenarios(true);
      const response = await apiClient.getScenarios(parseInt(selectedBudgetId));
      setScenarios(Array.isArray(response.data) ? response.data : []);
    } catch (error: unknown) {
      const err = error as ErrorWithDetails;
      toast.error(err.message || 'Failed to load scenarios');
    } finally {
      setLoadingScenarios(false);
    }
  }, [selectedBudgetId]);

  useEffect(() => {
    if (selectedBudgetId) {
      loadScenarios();
    } else {
      setScenarios([]);
    }
  }, [selectedBudgetId, loadScenarios]);

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

  const verifyPassword = async (password: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      // Use login endpoint to verify password
      const identifier = user.email || '';
      await apiClient.request({
        method: 'POST',
        url: '/auth/login-json',
        data: {
          username: identifier,
          password: password
        }
      });
      return true;
    } catch (err: unknown) {
      // If login fails, password is incorrect
      return false;
    }
  };

  const handleDeleteClick = (scenario: Scenario, e: React.MouseEvent) => {
    e.stopPropagation();
    setScenarioToDelete(scenario);
    setDeletePassword('');
    setDeletePasswordError(null);
    setShowDeleteModal(true);
    setShowDeletePassword(false);
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setScenarioToDelete(null);
    setDeletePassword('');
    setDeletePasswordError(null);
    setShowDeletePassword(false);
  };

  const handleDelete = async () => {
    if (!scenarioToDelete || !scenarioToDelete.id) return;

    if (!deletePassword.trim()) {
      setDeletePasswordError('Password is required');
      return;
    }

    setVerifyingPassword(true);
    setDeletePasswordError(null);

    try {
      // First verify password
      const isValid = await verifyPassword(deletePassword.trim());
      
      if (!isValid) {
        setDeletePasswordError('Incorrect password. Please try again.');
        setVerifyingPassword(false);
        return;
      }

      // Password is correct, proceed with deletion
      setDeleting(true);
      await apiClient.deleteScenario(parseInt(selectedBudgetId), scenarioToDelete.id, deletePassword.trim());
      toast.success('Scenario deleted successfully');
      setShowDeleteModal(false);
      setScenarioToDelete(null);
      setDeletePassword('');
      setShowDeletePassword(false);
      loadScenarios();
    } catch (error: unknown) {
      const err = error as ErrorWithDetails;
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to delete scenario';
      setDeletePasswordError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setDeleting(false);
      setVerifyingPassword(false);
    }
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
            <FilterGroup>
              <Building2 size={20} color={TEXT_COLOR_MUTED} />
              <label style={{ fontWeight: theme.typography.fontWeights.medium, color: TEXT_COLOR_DARK, whiteSpace: 'nowrap' }}>
                Select Budget:
              </label>
            </FilterGroup>
            <StyledSelect
              value={selectedBudgetId}
              onChange={(e) => setSelectedBudgetId(e.target.value)}
              style={{ minWidth: '250px' }}
            >
              <option value="">Select a budget...</option>
              {budgets.map((budget) => (
                <option key={budget.id} value={budget.id}>
                  {budget.name} ({budget.status})
                </option>
              ))}
            </StyledSelect>
            {selectedBudgetId && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, position: 'relative' }}>
                  <Search size={20} color={TEXT_COLOR_MUTED} style={{ position: 'absolute', left: '12px', zIndex: 1 }} />
                  <StyledInput
                    type="text"
                    placeholder="Search scenarios..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ paddingLeft: '40px' }}
                  />
                </div>
                <FilterGroup>
                  <Filter size={20} color={TEXT_COLOR_MUTED} />
                  <StyledSelect
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                  >
                    <option value="">All Types</option>
                    <option value="best_case">Best Case</option>
                    <option value="worst_case">Worst Case</option>
                    <option value="most_likely">Most Likely</option>
                    <option value="custom">Custom</option>
                  </StyledSelect>
                </FilterGroup>
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
                      <ScenarioTitle>{scenario.name}</ScenarioTitle>
                      <ActionButtons>
                        <ScenarioTypeBadge $type={scenario.scenario_type}>
                          {scenario.scenario_type.replace('_', ' ')}
                        </ScenarioTypeBadge>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => handleDeleteClick(scenario, e)}
                          disabled={deleting}
                          style={{ padding: '6px', minWidth: 'auto' }}
                          title="Delete scenario"
                        >
                          {deleting && scenarioToDelete?.id === scenario.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </Button>
                      </ActionButtons>
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

          {/* Delete Confirmation Modal */}
          {showDeleteModal && scenarioToDelete && (
            <ModalOverlay $isOpen={showDeleteModal} onClick={handleDeleteCancel}>
              <ModalContent onClick={(e) => e.stopPropagation()}>
                <ModalHeader>
                  <ModalTitle>
                    <Trash2 size={20} style={{ color: '#ef4444' }} />
                    Delete Scenario
                  </ModalTitle>
                  <button onClick={handleDeleteCancel} title="Close" type="button">
                    <XCircle />
                  </button>
                </ModalHeader>
                
                <WarningBox>
                  <p>
                    <strong>Warning:</strong> You are about to permanently delete this scenario. 
                    This action cannot be undone. Please enter <strong>your own password</strong> to verify this action.
                  </p>
                </WarningBox>

                <div style={{
                  background: theme.colors.backgroundSecondary,
                  border: '1px solid ' + theme.colors.border,
                  borderRadius: theme.borderRadius.md,
                  padding: theme.spacing.lg,
                  marginBottom: theme.spacing.lg
                }}>
                  <h4 style={{
                    fontSize: theme.typography.fontSizes.md,
                    fontWeight: theme.typography.fontWeights.bold,
                    color: TEXT_COLOR_DARK,
                    margin: `0 0 ${theme.spacing.md} 0`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing.sm
                  }}>
                    <Target size={18} />
                    Scenario Details to be Deleted
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: theme.spacing.md, flexWrap: 'wrap' }}>
                      <div style={{ flex: '1 1 200px' }}>
                        <strong style={{ display: 'block', fontSize: theme.typography.fontSizes.xs, color: TEXT_COLOR_MUTED, marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Scenario Name</strong>
                        <span style={{ fontSize: theme.typography.fontSizes.md, color: TEXT_COLOR_DARK, fontWeight: theme.typography.fontWeights.medium }}>
                          {scenarioToDelete.name || 'N/A'}
                        </span>
                      </div>
                      <div style={{ flex: '1 1 200px' }}>
                        <strong style={{ display: 'block', fontSize: theme.typography.fontSizes.xs, color: TEXT_COLOR_MUTED, marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Type</strong>
                        <ScenarioTypeBadge $type={scenarioToDelete.scenario_type}>
                          {scenarioToDelete.scenario_type.replace('_', ' ')}
                        </ScenarioTypeBadge>
                      </div>
                    </div>
                    {scenarioToDelete.description && (
                      <div style={{ paddingTop: theme.spacing.sm, borderTop: '1px solid ' + theme.colors.border }}>
                        <strong style={{ display: 'block', fontSize: theme.typography.fontSizes.xs, color: TEXT_COLOR_MUTED, marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Description</strong>
                        <span style={{ fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_DARK, lineHeight: 1.6 }}>
                          {scenarioToDelete.description}
                        </span>
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: theme.spacing.md, flexWrap: 'wrap', paddingTop: theme.spacing.sm, borderTop: '1px solid ' + theme.colors.border }}>
                      <div style={{ flex: '1 1 150px' }}>
                        <strong style={{ display: 'block', fontSize: theme.typography.fontSizes.xs, color: TEXT_COLOR_MUTED, marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Revenue</strong>
                        <span style={{ fontSize: theme.typography.fontSizes.md, color: '#10b981', fontWeight: theme.typography.fontWeights.bold }}>
                          {formatCurrency(scenarioToDelete.total_revenue)}
                        </span>
                      </div>
                      <div style={{ flex: '1 1 150px' }}>
                        <strong style={{ display: 'block', fontSize: theme.typography.fontSizes.xs, color: TEXT_COLOR_MUTED, marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Expenses</strong>
                        <span style={{ fontSize: theme.typography.fontSizes.md, color: '#ef4444', fontWeight: theme.typography.fontWeights.bold }}>
                          {formatCurrency(scenarioToDelete.total_expenses)}
                        </span>
                      </div>
                      <div style={{ flex: '1 1 150px' }}>
                        <strong style={{ display: 'block', fontSize: theme.typography.fontSizes.xs, color: TEXT_COLOR_MUTED, marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Profit</strong>
                        <span style={{ fontSize: theme.typography.fontSizes.md, color: scenarioToDelete.total_profit >= 0 ? '#10b981' : '#ef4444', fontWeight: theme.typography.fontWeights.bold }}>
                          {formatCurrency(scenarioToDelete.total_profit)}
                        </span>
                      </div>
                    </div>
                    <div style={{ paddingTop: theme.spacing.sm, borderTop: '1px solid ' + theme.colors.border }}>
                      <strong style={{ display: 'block', fontSize: theme.typography.fontSizes.xs, color: TEXT_COLOR_MUTED, marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Created Date</strong>
                      <span style={{ fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_DARK }}>
                        {formatDate(scenarioToDelete.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                <FormGroup>
                  <Label htmlFor="delete-password">
                    <Lock size={16} style={{ display: 'inline-block', marginRight: '8px', verticalAlign: 'middle' }} />
                    Enter <strong>your own password</strong> to confirm deletion of <strong>{scenarioToDelete.name || 'this scenario'}</strong>:
                  </Label>
                  <PasswordInputWrapper>
                    <input
                      id="delete-password"
                      type={showDeletePassword ? 'text' : 'password'}
                      value={deletePassword}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setDeletePassword(e.target.value);
                        setDeletePasswordError(null);
                      }}
                      placeholder="Enter your password"
                      autoFocus
                      onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                        if (e.key === 'Enter' && deletePassword.trim() && !verifyingPassword && !deleting) {
                          handleDelete();
                        }
                      }}
                      disabled={verifyingPassword || deleting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowDeletePassword(!showDeletePassword)}
                      title={showDeletePassword ? 'Hide password' : 'Show password'}
                      disabled={verifyingPassword || deleting}
                    >
                      {showDeletePassword ? <EyeOff /> : <Eye />}
                    </button>
                  </PasswordInputWrapper>
                  {deletePasswordError && (
                    <ErrorText>{deletePasswordError}</ErrorText>
                  )}
                </FormGroup>

                <ModalActions>
                  <Button
                    variant="outline"
                    onClick={handleDeleteCancel}
                    disabled={deleting || verifyingPassword}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={!deletePassword.trim() || deleting || verifyingPassword}
                  >
                    {verifyingPassword ? (
                      <>
                        <Loader2 size={16} style={{ marginRight: theme.spacing.sm }} className="animate-spin" />
                        Verifying...
                      </>
                    ) : deleting ? (
                      <>
                        <Loader2 size={16} style={{ marginRight: theme.spacing.sm }} className="animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 size={16} style={{ marginRight: theme.spacing.sm }} />
                        Delete Scenario
                      </>
                    )}
                  </Button>
                </ModalActions>
              </ModalContent>
            </ModalOverlay>
          )}
        </ContentContainer>
      </PageContainer>
    </Layout>
  );
};

export default ScenarioListPage;

