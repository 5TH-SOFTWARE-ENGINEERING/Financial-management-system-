'use client';
import React, { useEffect, useState, useCallback } from 'react';
import styled from 'styled-components';
import { useRouter, useParams } from 'next/navigation';
import {
  DollarSign, Edit, Trash2, ArrowLeft, Plus, AlertCircle, CheckCircle, Loader2
} from 'lucide-react';
import Layout from '@/components/layout';
import apiClient from '@/lib/api';
import { theme } from '@/components/common/theme';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Link from 'next/link';

const PRIMARY_COLOR = theme.colors.primary || '#00AA00';
const PRIMARY_LIGHT = (props: any) => props.theme.mode === 'dark' ? 'rgba(0, 170, 0, 0.1)' : '#e8f5e9';
const TEXT_COLOR_DARK = (props: any) => props.theme.colors.textDark;
const TEXT_COLOR_MUTED = theme.colors.textSecondary || '#666';
const BACKGROUND_GRADIENT = (props: any) => props.theme.mode === 'dark' ? `linear-gradient(180deg, #0f172a 0%, #1e293b 60%, ${props.theme.colors.background} 100%)` : `linear-gradient(180deg, #f9fafb 0%, #f3f4f6 60%, ${props.theme.colors.background} 100%)`;

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
`;

const HeaderContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: ${theme.spacing.md};
  
  h1 {
    font-size: clamp(28px, 3.5vw, 36px);
    font-weight: ${theme.typography.fontWeights.bold};
    margin: 0;
    display: flex;
    align-items: center;
    gap: ${theme.spacing.md};
  }
`;

const StatusBadge = styled.span<{ $status: string }>`
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.sm};
  font-size: ${theme.typography.fontSizes.sm};
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

const InfoCard = styled.div`
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  box-shadow: ${CardShadow};
  padding: ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.lg};
`;

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  margin-bottom: ${theme.spacing.md};
  font-size: ${theme.typography.fontSizes.sm};
  color: ${TEXT_COLOR_MUTED};
  
  &:last-child {
    margin-bottom: 0;
  }
  
  strong {
    color: ${TEXT_COLOR_DARK};
    min-width: 120px;
  }
`;

const TotalsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.xl};
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const TotalCard = styled.div<{ $type: string }>`
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  box-shadow: ${CardShadow};
  padding: ${theme.spacing.lg};
  text-align: center;
  
  .label {
    font-size: ${theme.typography.fontSizes.sm};
    color: ${TEXT_COLOR_MUTED};
    margin-bottom: ${theme.spacing.xs};
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }
  
  .value {
    font-size: clamp(24px, 3vw, 32px);
    font-weight: ${theme.typography.fontWeights.bold};
    color: ${props => {
      if (props.$type === 'revenue') return '#059669';
      if (props.$type === 'expense') return '#ef4444';
      return TEXT_COLOR_DARK;
    }};
  }
`;

const ItemsCard = styled.div`
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  box-shadow: ${CardShadow};
  padding: ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.lg};
`;

const ItemsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing.md};
  
  h3 {
    font-size: ${theme.typography.fontSizes.lg};
    font-weight: ${theme.typography.fontWeights.bold};
    color: ${TEXT_COLOR_DARK};
    margin: 0;
  }
`;

const ItemsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  
  th {
    text-align: left;
    padding: ${theme.spacing.md};
    background: ${PRIMARY_LIGHT};
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
    background: ${PRIMARY_LIGHT};
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: ${theme.spacing.md};
  flex-wrap: wrap;
  margin-top: ${theme.spacing.lg};
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

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
`;

const ModalContent = styled.div`
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  padding: ${theme.spacing.xl};
  max-width: 500px;
  width: 90%;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
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
  background: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.textDark};
  transition: all 0.2s ease-in-out;
  outline: none;
  box-sizing: border-box;
  margin: 0;

  &:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    background: ${props => props.theme.colors.background};
  }

  &:hover:not(:disabled) {
    border-color: #d1d5db;
  }

  &::placeholder {
    color: #9ca3af;
  }

  &:disabled {
    background-color: ${theme.colors.backgroundSecondary};
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

interface BudgetItem {
  id: number;
  name: string;
  description?: string;
  type: string;
  category: string;
  amount: number;
}

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
  items?: BudgetItem[];
}

const BudgetDetailPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const [budget, setBudget] = useState<Budget | null>(null);
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletePasswordError, setDeletePasswordError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const budgetId = params?.id ? parseInt(params.id as string) : null;

  const loadBudget = useCallback(async () => {
    if (!budgetId) return;
    
    try {
      setLoading(true);
      const response = await apiClient.getBudget(budgetId);
      setBudget(response.data as Budget);
    } catch (error: unknown) {
      const message =
        (typeof error === 'object' &&
          error !== null &&
          'message' in error &&
          typeof (error as { message?: string }).message === 'string'
          ? (error as { message?: string }).message
          : 'Failed to load budget');
      toast.error(message);
      router.push('/budgets');
    } finally {
      setLoading(false);
    }
  }, [budgetId, router]);

  const loadItems = useCallback(async () => {
    if (!budgetId) return;
    
    try {
      const response = await apiClient.getBudgetItems(budgetId);
      setItems(Array.isArray(response.data) ? response.data : []);
    } catch (error: unknown) {
      console.error('Failed to load budget items:', error);
    }
  }, [budgetId]);

  useEffect(() => {
    if (budgetId) {
      loadBudget();
      loadItems();
    }
  }, [budgetId, loadBudget, loadItems]);

  const handleValidate = async () => {
    if (!budgetId) return;
    
    try {
      setValidating(true);
      const response = await apiClient.validateBudget(budgetId);
      const result = response.data as { valid?: boolean; warnings?: string[]; errors?: string[] } | undefined;
      
      if (result?.valid) {
        toast.success('Budget is valid!');
        if (result?.warnings && Array.isArray(result.warnings) && result.warnings.length > 0) {
          toast.warning(`Warnings: ${result.warnings.join(', ')}`);
        }
        // Reload budget to get updated totals
        loadBudget();
      } else {
        const errors = result?.errors || ['Validation failed'];
        toast.error(`Validation failed: ${Array.isArray(errors) ? errors.join(', ') : 'Unknown error'}`);
      }
    } catch (error: unknown) {
      const message =
        (typeof error === 'object' &&
          error !== null &&
          'message' in error &&
          typeof (error as { message?: string }).message === 'string'
          ? (error as { message?: string }).message
          : 'Failed to validate budget');
      toast.error(message);
    } finally {
      setValidating(false);
    }
  };

  const handleDeleteClick = () => {
    setDeletePassword('');
    setDeletePasswordError(null);
    setShowDeleteModal(true);
  };

  const handleDelete = async (password: string) => {
    if (!budgetId) return;

    if (!password.trim()) {
      setDeletePasswordError('Password is required');
      return;
    }

    setDeleting(true);
    setDeletePasswordError(null);

    try {
      await apiClient.deleteBudget(budgetId, password.trim());
      toast.success('Budget deleted successfully');
      setShowDeleteModal(false);
      setDeletePassword('');
      router.push('/budgets');
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
          : null) ||
        'Failed to delete budget';
      setDeletePasswordError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
          <ContentContainer>
            <div style={{ textAlign: 'center', padding: theme.spacing.xl }}>
              <AlertCircle size={48} style={{ margin: '0 auto 16px', color: TEXT_COLOR_MUTED }} />
              <p>Budget not found</p>
              <Button onClick={() => router.push('/budgets')} style={{ marginTop: theme.spacing.md }}>
                Back to Budgets
              </Button>
            </div>
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
              <div style={{ flex: 1 }}>
                <h1>
                  <DollarSign size={36} />
                  {budget.name}
                </h1>
                <div style={{ marginTop: theme.spacing.sm, display: 'flex', gap: theme.spacing.md, alignItems: 'center', flexWrap: 'wrap' }}>
                  <StatusBadge $status={budget.status}>
                    {budget.status.toUpperCase()}
                  </StatusBadge>
                  {budget.description && (
                    <p style={{ margin: 0, opacity: 0.9, fontSize: theme.typography.fontSizes.md }}>
                      {budget.description}
                    </p>
                  )}
                </div>
              </div>
              <ActionButtons>
                <Button
                  variant="outline"
                  onClick={handleValidate}
                  disabled={validating}
                  style={{ background: 'rgba(255, 255, 255, 0.2)', color: 'white', borderColor: 'rgba(255, 255, 255, 0.3)' }}
                >
                  <CheckCircle size={16} />
                  {validating ? 'Validating...' : 'Validate'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/budgets/edit/${budget.id}`)}
                  style={{ background: 'rgba(255, 255, 255, 0.2)', color: 'white', borderColor: 'rgba(255, 255, 255, 0.3)' }}
                >
                  <Edit size={16} />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDeleteClick}
                  style={{ background: 'rgba(239, 68, 68, 0.2)', color: 'white', borderColor: 'rgba(239, 68, 68, 0.5)' }}
                >
                  <Trash2 size={16} />
                  Delete
                </Button>
              </ActionButtons>
            </HeaderContent>
          </HeaderContainer>

          <TotalsGrid>
            <TotalCard $type="revenue">
              <div className="label">Total Revenue</div>
              <div className="value">{formatCurrency(budget.total_revenue)}</div>
            </TotalCard>
            <TotalCard $type="expense">
              <div className="label">Total Expenses</div>
              <div className="value">{formatCurrency(budget.total_expenses)}</div>
            </TotalCard>
            <TotalCard $type="profit">
              <div className="label">Net Profit</div>
              <div className="value" style={{ color: budget.total_profit >= 0 ? '#059669' : '#ef4444' }}>
                {formatCurrency(budget.total_profit)}
              </div>
            </TotalCard>
          </TotalsGrid>

          <InfoCard>
            <h3 style={{ marginTop: 0, marginBottom: theme.spacing.lg }}>Budget Information</h3>
            <InfoRow>
              <strong>Period:</strong>
              <span>{budget.period.charAt(0).toUpperCase() + budget.period.slice(1)}</span>
            </InfoRow>
            <InfoRow>
              <strong>Start Date:</strong>
              <span>{formatDate(budget.start_date)}</span>
            </InfoRow>
            <InfoRow>
              <strong>End Date:</strong>
              <span>{formatDate(budget.end_date)}</span>
            </InfoRow>
            {budget.department && (
              <InfoRow>
                <strong>Department:</strong>
                <span>{budget.department}</span>
              </InfoRow>
            )}
            {budget.project && (
              <InfoRow>
                <strong>Project:</strong>
                <span>{budget.project}</span>
              </InfoRow>
            )}
            <InfoRow>
              <strong>Created:</strong>
              <span>{formatDate(budget.created_at)}</span>
            </InfoRow>
          </InfoCard>

          <ItemsCard>
            <ItemsHeader>
              <h3>Budget Items ({items.length})</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/budgets/edit/${budget.id}`)}
              >
                <Plus size={16} />
                Add Item
              </Button>
            </ItemsHeader>
            
            {items.length === 0 ? (
              <div style={{ textAlign: 'center', padding: theme.spacing.xl, color: TEXT_COLOR_MUTED }}>
                <p>No budget items yet. Add items to get started.</p>
              </div>
            ) : (
              <ItemsTable>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: theme.borderRadius.sm,
                          fontSize: theme.typography.fontSizes.xs,
                          fontWeight: theme.typography.fontWeights.medium,
                          background: item.type === 'revenue' ? '#d1fae5' : '#fee2e2',
                          color: item.type === 'revenue' ? '#065f46' : '#991b1b'
                        }}>
                          {item.type.toUpperCase()}
                        </span>
                      </td>
                      <td>{item.category}</td>
                      <td style={{ fontWeight: theme.typography.fontWeights.bold }}>
                        {formatCurrency(item.amount)}
                      </td>
                      <td>{item.description || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </ItemsTable>
            )}
          </ItemsCard>

          {/* Delete Modal with Password Verification */}
          {showDeleteModal && (
            <ModalOverlay onClick={() => {
              setShowDeleteModal(false);
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
          )}
        </ContentContainer>
      </PageContainer>
    </Layout>
  );
};

export default BudgetDetailPage;

