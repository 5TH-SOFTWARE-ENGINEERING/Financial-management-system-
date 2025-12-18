'use client';
import React, { useEffect, useState, useCallback } from 'react';
import styled from 'styled-components';
import { useRouter } from 'next/navigation';
import {
  DollarSign, FileText, Plus, Edit, Trash2, Calendar,
  Building2, FolderKanban, Filter, Search, Loader2, X
} from 'lucide-react';
import Layout from '@/components/layout';
import apiClient from '@/lib/api';
import { theme } from '@/components/common/theme';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

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
  grid-template-columns: 1fr auto;
  gap: ${theme.spacing.md};
  align-items: center;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const BudgetsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.xl};
`;

const BudgetCard = styled.div`
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

const BudgetHeader = styled.div`
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

const StatusBadge = styled.span<{ $status: string }>`
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.sm};
  font-size: ${theme.typography.fontSizes.xs};
  font-weight: ${theme.typography.fontWeights.medium};
  background: ${props => {
    switch (props.$status) {
      case 'draft': return '#f3f4f6';
      case 'approved': return '#d1fae5';
      case 'active': return '#dbeafe';
      case 'archived': return '#f3f4f6';
      default: return '#fef3c7';
    }
  }};
  color: ${props => {
    switch (props.$status) {
      case 'draft': return '#6b7280';
      case 'approved': return '#065f46';
      case 'active': return '#1e40af';
      case 'archived': return '#6b7280';
      default: return '#92400e';
    }
  }};
`;

const BudgetMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.xs};
  margin-bottom: ${theme.spacing.md};
  font-size: ${theme.typography.fontSizes.sm};
  color: ${TEXT_COLOR_MUTED};
`;

const BudgetTotals = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.md};
  background: ${PRIMARY_LIGHT};
  border-radius: ${theme.borderRadius.sm};
  margin-bottom: ${theme.spacing.md};
`;

const TotalItem = styled.div`
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

const BudgetActions = styled.div`
  display: flex;
  gap: ${theme.spacing.sm};
  justify-content: flex-end;
  margin-top: ${theme.spacing.md};
  padding-top: ${theme.spacing.md};
  border-top: 1px solid ${theme.colors.border};
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: ${theme.spacing.lg};
`;

const ModalContent = styled.div`
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.md};
  padding: ${theme.spacing.xl};
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing.lg};
  
  h2 {
    font-size: ${theme.typography.fontSizes.lg};
    font-weight: ${theme.typography.fontWeights.bold};
    color: ${TEXT_COLOR_DARK};
    margin: 0;
  }
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

  &[type="number"] {
    -moz-appearance: textfield;
    
    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
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

const ModalTitle = styled.h3`
  font-size: ${theme.typography.fontSizes.lg};
  font-weight: ${theme.typography.fontWeights.bold};
  color: ${TEXT_COLOR_DARK};
  margin: 0 0 ${theme.spacing.lg};
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

const PasswordInput = styled.input`
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

const ErrorText = styled.p`
  color: #dc2626;
  font-size: ${theme.typography.fontSizes.sm};
  margin: ${theme.spacing.xs} 0 0 0;
`;

const ModalActions = styled.div`
  display: flex;
  gap: 16px;
  justify-content: space-between;
  margin-top: ${theme.spacing.lg};
`;

interface Budget {
  id: number;
  name: string;
  description?: string;
  period: string;
  start_date: string;
  end_date: string;
  department?: string;
  project?: string;
  status: string;
  total_revenue: number;
  total_expenses: number;
  total_profit: number;
  created_at: string;
}

const BudgetsPage: React.FC = () => {
  const router = useRouter();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteBudgetId, setDeleteBudgetId] = useState<number | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletePasswordError, setDeletePasswordError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadBudgets = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (selectedStatus) params.status = selectedStatus;
      const response = await apiClient.getBudgets(params);
      setBudgets(Array.isArray(response.data) ? response.data : []);
    } catch (error: unknown) {
      const message =
        (typeof error === 'object' &&
          error !== null &&
          'message' in error &&
          typeof (error as { message?: string }).message === 'string'
          ? (error as { message?: string }).message
          : 'Failed to load budgets');
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [selectedStatus]);

  useEffect(() => {
    loadBudgets();
  }, [selectedStatus, loadBudgets]);

  const handleDeleteClick = (id: number) => {
    setDeleteBudgetId(id);
    setDeletePassword('');
    setDeletePasswordError(null);
    setShowDeleteModal(true);
  };

  const handleDelete = async (password: string) => {
    if (!deleteBudgetId) return;

    if (!password.trim()) {
      setDeletePasswordError('Password is required');
      return;
    }

    setDeleting(true);
    setDeletePasswordError(null);

    try {
      await apiClient.deleteBudget(deleteBudgetId, password.trim());
      toast.success('Budget deleted successfully');
      setShowDeleteModal(false);
      setDeleteBudgetId(null);
      setDeletePassword('');
      loadBudgets();
    } catch (error: unknown) {
      const errorMessage =
        (typeof error === 'object' &&
          error !== null &&
          'response' in error &&
          (error as { response?: { data?: { detail?: string } } }).response?.data?.detail) ||
        (typeof error === 'object' &&
          error !== null &&
          'message' in error &&
          typeof (error as { message?: string }).message === 'string'
          ? (error as { message?: string }).message
          : 'Failed to delete budget');
      const finalMessage = errorMessage ?? 'Failed to delete budget';
      setDeletePasswordError(finalMessage);
      toast.error(finalMessage);
    } finally {
      setDeleting(false);
    }
  };

  const filteredBudgets = budgets.filter(budget => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        budget.name.toLowerCase().includes(query) ||
        budget.description?.toLowerCase().includes(query) ||
        budget.department?.toLowerCase().includes(query) ||
        budget.project?.toLowerCase().includes(query)
      );
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
          <LoadingContainer>
            <Spinner />
            <p>Loading budgets...</p>
          </LoadingContainer>
        </PageContainer>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageContainer>
        <ContentContainer>
          <HeaderContainer>
            <HeaderContent>
              <div>
                <h1>
                  <DollarSign size={36} />
                  Budget Management
                </h1>
                <p style={{ marginTop: theme.spacing.sm, opacity: 0.9 }}>
                  Create and manage budgets for revenues, expenses, and projects
                </p>
              </div>
              <div style={{ display: 'flex', gap: theme.spacing.sm }}>
                <Button
                  variant="outline"
                  onClick={() => setShowTemplateModal(true)}
                  style={{ background: 'rgba(255, 255, 255, 0.2)', color: 'white', borderColor: 'rgba(255, 255, 255, 0.3)' }}
                >
                  <FileText size={16} />
                  From Template
                </Button>
                <Button
                  onClick={() => router.push('/budgets/create')}
                  style={{ background: 'white', color: PRIMARY_COLOR }}
                >
                  <Plus size={16} />
                  New Budget
                </Button>
              </div>
            </HeaderContent>
          </HeaderContainer>

          <FiltersContainer>
            <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, position: 'relative' }}>
              <Search size={20} color={TEXT_COLOR_MUTED} style={{ position: 'absolute', left: '12px', zIndex: 1 }} />
              <StyledInput
                type="text"
                placeholder="Search budgets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '40px' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
              <Filter size={20} color={TEXT_COLOR_MUTED} />
              <StyledSelect
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="approved">Approved</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </StyledSelect>
            </div>
          </FiltersContainer>

          {filteredBudgets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: theme.spacing.xl, color: TEXT_COLOR_MUTED }}>
              <FileText size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
              <p>No budgets found. Create your first budget to get started.</p>
            </div>
          ) : (
            <BudgetsGrid>
              {filteredBudgets.map((budget) => (
                <BudgetCard
                  key={budget.id}
                  onClick={() => router.push(`/budgets/${budget.id}`)}
                >
                  <BudgetHeader>
                    <h3>{budget.name}</h3>
                    <StatusBadge $status={budget.status}>
                      {budget.status.toUpperCase()}
                    </StatusBadge>
                  </BudgetHeader>
                  
                  <BudgetMeta>
                    <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
                      <Calendar size={14} />
                      <span>
                        {formatDate(budget.start_date)} - {formatDate(budget.end_date)}
                      </span>
                    </div>
                    {budget.department && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
                        <Building2 size={14} />
                        <span>{budget.department}</span>
                      </div>
                    )}
                    {budget.project && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
                        <FolderKanban size={14} />
                        <span>{budget.project}</span>
                      </div>
                    )}
                  </BudgetMeta>

                  <BudgetTotals>
                    <TotalItem>
                      <div className="label">Revenue</div>
                      <div className="value" style={{ color: '#059669' }}>
                        {formatCurrency(budget.total_revenue)}
                      </div>
                    </TotalItem>
                    <TotalItem>
                      <div className="label">Expenses</div>
                      <div className="value" style={{ color: '#ef4444' }}>
                        {formatCurrency(budget.total_expenses)}
                      </div>
                    </TotalItem>
                    <TotalItem>
                      <div className="label">Profit</div>
                      <div className="value" style={{ color: budget.total_profit >= 0 ? '#059669' : '#ef4444' }}>
                        {formatCurrency(budget.total_profit)}
                      </div>
                    </TotalItem>
                  </BudgetTotals>

                  <BudgetActions onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/budgets/edit/${budget.id}`)}
                    >
                      <Edit size={14} />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(budget.id);
                      }}
                      style={{ color: '#ef4444', borderColor: '#ef4444' }}
                    >
                      <Trash2 size={14} />
                      Delete
                    </Button>
                  </BudgetActions>
                </BudgetCard>
              ))}
            </BudgetsGrid>
          )}

          {/* Template Modal */}
          {showTemplateModal && (
            <ModalOverlay onClick={() => setShowTemplateModal(false)}>
              <ModalContent onClick={(e) => e.stopPropagation()}>
                <ModalHeader>
                  <h2>Create Budget from Template</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowTemplateModal(false)}
                  >
                    <X size={20} />
                  </Button>
                </ModalHeader>
                
                <TemplateForm
                  onClose={() => setShowTemplateModal(false)}
                  onSuccess={() => {
                    setShowTemplateModal(false);
                    loadBudgets();
                  }}
                />
              </ModalContent>
            </ModalOverlay>
          )}

          {/* Delete Modal with Password Verification */}
          {showDeleteModal && deleteBudgetId && (() => {
            const budgetToDelete = budgets.find((b: Budget) => b.id === deleteBudgetId);
            
            return (
              <ModalOverlay onClick={() => {
                setShowDeleteModal(false);
                setDeleteBudgetId(null);
                setDeletePassword('');
                setDeletePasswordError(null);
              }}>
                <ModalContent onClick={(e) => e.stopPropagation()}>
                  <ModalTitle>
                    <Trash2 size={20} style={{ color: '#ef4444' }} />
                    Delete Budget
                  </ModalTitle>
                  
                  <WarningBox>
                    <p>
                      <strong>Warning:</strong> You are about to permanently delete this budget. 
                      This action cannot be undone. Please enter your password to confirm this deletion.
                    </p>
                  </WarningBox>

                  {budgetToDelete && (
                    <div style={{
                      background: '#f9fafb',
                      border: '1px solid #e5e7eb',
                      borderRadius: theme.borderRadius.md,
                      padding: theme.spacing.md,
                      marginBottom: theme.spacing.lg
                    }}>
                      <h4 style={{
                        fontSize: theme.typography.fontSizes.sm,
                        fontWeight: theme.typography.fontWeights.bold,
                        color: TEXT_COLOR_DARK,
                        margin: `0 0 ${theme.spacing.md} 0`
                      }}>
                        Budget Details to be Deleted:
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                          <strong style={{ minWidth: '120px', fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_DARK }}>Name:</strong>
                          <span style={{ fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_MUTED }}>
                            {budgetToDelete.name || 'N/A'}
                          </span>
                        </div>
                        {budgetToDelete.description && (
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: theme.spacing.sm }}>
                            <strong style={{ minWidth: '120px', fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_DARK }}>Description:</strong>
                            <span style={{ fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_MUTED, flex: 1 }}>
                              {budgetToDelete.description}
                            </span>
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                          <strong style={{ minWidth: '120px', fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_DARK }}>Status:</strong>
                          <StatusBadge $status={budgetToDelete.status}>
                            {budgetToDelete.status.toUpperCase()}
                          </StatusBadge>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                          <strong style={{ minWidth: '120px', fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_DARK }}>Period:</strong>
                          <span style={{ fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_MUTED }}>
                            {formatDate(budgetToDelete.start_date)} - {formatDate(budgetToDelete.end_date)}
                          </span>
                        </div>
                        {budgetToDelete.department && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                            <strong style={{ minWidth: '120px', fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_DARK }}>Department:</strong>
                            <span style={{ fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_MUTED }}>
                              {budgetToDelete.department}
                            </span>
                          </div>
                        )}
                        {budgetToDelete.project && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                            <strong style={{ minWidth: '120px', fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_DARK }}>Project:</strong>
                            <span style={{ fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_MUTED }}>
                              {budgetToDelete.project}
                            </span>
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                          <strong style={{ minWidth: '120px', fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_DARK }}>Total Revenue:</strong>
                          <span style={{ 
                            fontSize: theme.typography.fontSizes.sm, 
                            fontWeight: theme.typography.fontWeights.bold, 
                            color: '#059669'
                          }}>
                            {formatCurrency(budgetToDelete.total_revenue)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                          <strong style={{ minWidth: '120px', fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_DARK }}>Total Expenses:</strong>
                          <span style={{ 
                            fontSize: theme.typography.fontSizes.sm, 
                            fontWeight: theme.typography.fontWeights.bold, 
                            color: '#ef4444'
                          }}>
                            {formatCurrency(budgetToDelete.total_expenses)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                          <strong style={{ minWidth: '120px', fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_DARK }}>Total Profit:</strong>
                          <span style={{ 
                            fontSize: theme.typography.fontSizes.sm, 
                            fontWeight: theme.typography.fontWeights.bold, 
                            color: budgetToDelete.total_profit >= 0 ? '#059669' : '#ef4444'
                          }}>
                            {formatCurrency(budgetToDelete.total_profit)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <FormGroup>
                    <Label htmlFor="delete-password">
                      Enter your password to confirm deletion:
                    </Label>
                    <PasswordInput
                      id="delete-password"
                      type="password"
                      value={deletePassword}
                      onChange={(e) => {
                        setDeletePassword(e.target.value);
                        setDeletePasswordError(null);
                      }}
                      placeholder="Enter your password"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && deletePassword.trim()) {
                          handleDelete(deletePassword);
                        }
                      }}
                      autoFocus
                    />
                    {deletePasswordError && (
                      <ErrorText>{deletePasswordError}</ErrorText>
                    )}
                  </FormGroup>

                <ModalActions>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDeleteModal(false);
                      setDeleteBudgetId(null);
                      setDeletePassword('');
                      setDeletePasswordError(null);
                    }}
                    disabled={deleting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleDelete(deletePassword)}
                    disabled={!deletePassword.trim() || deleting}
                  >
                    {deleting ? (
                      <>
                        <Loader2 size={16} style={{ marginRight: theme.spacing.sm }} className="animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 size={16} style={{ marginRight: theme.spacing.sm }} />
                        Delete
                      </>
                    )}
                  </Button>
                </ModalActions>
              </ModalContent>
            </ModalOverlay>
            );
          })()}
        </ContentContainer>
      </PageContainer>
    </Layout>
  );
};

// Template Form Component
interface TemplateFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

const TemplateForm: React.FC<TemplateFormProps> = ({ onClose, onSuccess }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    templateName: 'monthly_department',
    name: '',
    start_date: '',
    end_date: '',
    department: '',
    project: ''
  });

  const templates = [
    { value: 'monthly_department', label: 'Monthly Department Budget', description: 'Standard monthly budget template for departments' },
    { value: 'quarterly_project', label: 'Quarterly Project Budget', description: 'Budget template for quarterly projects' },
    { value: 'yearly_company', label: 'Annual Company Budget', description: 'Comprehensive yearly budget' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.start_date || !formData.end_date) {
      toast.error('Please select start and end dates');
      return;
    }

    try {
      setLoading(true);
      await apiClient.createBudgetFromTemplate(formData.templateName, {
        name: formData.name || `${templates.find(t => t.value === formData.templateName)?.label} - ${formData.start_date}`,
        start_date: formData.start_date,
        end_date: formData.end_date,
        department: formData.department || undefined,
        project: formData.project || undefined
      });
      
      toast.success('Budget created from template successfully!');
      onSuccess();
      router.push('/budgets');
    } catch (error: unknown) {
      const message =
        (typeof error === 'object' &&
          error !== null &&
          'message' in error &&
          typeof (error as { message?: string }).message === 'string'
          ? (error as { message?: string }).message
          : 'Failed to create budget from template');
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <FormGroup>
        <label>Template </label>
        <StyledSelect
          value={formData.templateName}
          onChange={(e) => setFormData(prev => ({ ...prev, templateName: e.target.value }))}
          required
        >
          {templates.map(template => (
            <option key={template.value} value={template.value}>
              {template.label}
            </option>
          ))}
        </StyledSelect>
        <p style={{ fontSize: theme.typography.fontSizes.xs, color: TEXT_COLOR_MUTED, marginTop: theme.spacing.xs }}>
          {templates.find(t => t.value === formData.templateName)?.description}
        </p>
      </FormGroup>

      <FormGroup>
        <label>Budget Name</label>
        <StyledInput
          type="text"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Leave empty for default name"
        />
      </FormGroup>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px' }}>
        <FormGroup>
          <label>Start Date </label>
          <StyledInput
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
            required
          />
        </FormGroup>

        <FormGroup>
          <label>End Date </label>
          <StyledInput
            type="date"
            value={formData.end_date}
            onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
            required
          />
        </FormGroup>
      </div>

      <FormGroup>
        <label>Department</label>
        <StyledInput
          type="text"
          value={formData.department}
          onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
          placeholder="Optional"
        />
      </FormGroup>

      <FormGroup>
        <label>Project</label>
        <StyledInput
          type="text"
          value={formData.project}
          onChange={(e) => setFormData(prev => ({ ...prev, project: e.target.value }))}
          placeholder="Optional"
        />
      </FormGroup>

      <div style={{ display: 'flex', gap: '16px', justifyContent: 'space-between', marginTop: theme.spacing.lg }}>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Budget'}
        </Button>
      </div>
    </form>
  );
};

export default BudgetsPage;

