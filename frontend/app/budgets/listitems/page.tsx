'use client';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/rbac/auth-context';
import {
  List, ArrowLeft, Plus, Edit, Trash2, DollarSign,
  TrendingUp, TrendingDown, Search, Filter, Loader2, X
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

const ItemsCard = styled.div`
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  box-shadow: ${CardShadow};
  padding: ${theme.spacing.xl};
  margin-bottom: ${theme.spacing.lg};
`;

const ItemsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: ${theme.spacing.md};
  
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

const TypeBadge = styled.span<{ $type: string }>`
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.sm};
  font-size: ${theme.typography.fontSizes.xs};
  font-weight: ${theme.typography.fontWeights.medium};
  background: ${props => props.$type === 'revenue' ? '#d1fae5' : '#fecaca'};
  color: ${props => props.$type === 'revenue' ? '#065f46' : '#991b1b'};
  text-transform: capitalize;
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
  padding: ${theme.spacing.md};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  background: ${theme.colors.background};
  color: ${TEXT_COLOR_DARK};
  font-size: ${theme.typography.fontSizes.sm};
  font-family: inherit;
  transition: all ${theme.transitions.default};

  &:focus {
    outline: none;
    border-color: ${PRIMARY_COLOR};
    box-shadow: 0 0 0 3px ${PRIMARY_COLOR}15;
  }

  &::placeholder {
    color: ${TEXT_COLOR_MUTED};
    opacity: 0.6;
  }
`;

const ErrorText = styled.p`
  color: #dc2626;
  font-size: ${theme.typography.fontSizes.sm};
  margin: ${theme.spacing.xs} 0 0 0;
`;

const FormGroup = styled.div`
  margin-bottom: ${theme.spacing.md};
`;

const ModalActions = styled.div`
  display: flex;
  gap: ${theme.spacing.md};
  justify-content: flex-end;
  margin-top: ${theme.spacing.lg};
`;

interface BudgetItem {
  id: number;
  name: string;
  description?: string;
  type: string;
  category: string;
  amount: number;
  monthly_amounts?: any;
}

interface Budget {
  id: number;
  name: string;
}

const BudgetItemsListPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const budgetIdParam = searchParams?.get('budget_id');
  
  const { user } = useAuth();
  const [budget, setBudget] = useState<Budget | null>(null);
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState<number | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletePasswordError, setDeletePasswordError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (budgetIdParam) {
      loadData();
    } else {
      toast.error('Budget ID is required');
      router.push('/budgets');
    }
  }, [budgetIdParam]);

  const loadData = async () => {
    if (!budgetIdParam) return;
    
    try {
      setLoading(true);
      const [budgetResponse, itemsResponse] = await Promise.all([
        apiClient.getBudget(parseInt(budgetIdParam)),
        apiClient.getBudgetItems(parseInt(budgetIdParam))
      ]);
      
      setBudget(budgetResponse.data as Budget);
      setItems(Array.isArray(itemsResponse.data) ? itemsResponse.data : []);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load budget items');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (itemId: number) => {
    setDeleteItemId(itemId);
    setDeletePassword('');
    setDeletePasswordError(null);
    setShowDeleteModal(true);
  };

  const handleDelete = async (password: string) => {
    if (!budgetIdParam || !deleteItemId) return;

    if (!password.trim()) {
      setDeletePasswordError('Password is required');
      return;
    }

    setDeleting(true);
    setDeletePasswordError(null);

    try {
      await apiClient.deleteBudgetItem(parseInt(budgetIdParam), deleteItemId, password.trim());
      toast.success('Budget item deleted successfully');
      setShowDeleteModal(false);
      setDeleteItemId(null);
      setDeletePassword('');
      loadData();
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to delete budget item';
      setDeletePasswordError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  const filteredItems = items.filter(item => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !item.name.toLowerCase().includes(query) &&
        !item.description?.toLowerCase().includes(query) &&
        !item.category.toLowerCase().includes(query)
      ) {
        return false;
      }
    }
    if (selectedType && item.type !== selectedType) {
      return false;
    }
    return true;
  });

  const formatCurrency = (value: number) => {
    return `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const totalRevenue = filteredItems
    .filter(item => item.type === 'revenue')
    .reduce((sum, item) => sum + item.amount, 0);

  const totalExpenses = filteredItems
    .filter(item => item.type === 'expense')
    .reduce((sum, item) => sum + item.amount, 0);

  if (loading) {
    return (
      <Layout>
        <PageContainer>
          <ContentContainer>
            <LoadingContainer>
              <Spinner />
              <p>Loading budget items...</p>
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
          <BackLink href={`/budgets/${budgetIdParam}`}>
            <ArrowLeft size={16} />
            Back to Budget
          </BackLink>

          <HeaderContainer>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: theme.spacing.md }}>
              <div>
                <h1>
                  <List size={36} />
                  Budget Items: {budget?.name || 'Budget'}
                </h1>
                <p style={{ marginTop: theme.spacing.sm, opacity: 0.9 }}>
                  Manage items for this budget
                </p>
              </div>
              <Button
                onClick={() => router.push(`/budgets/additems?budget_id=${budgetIdParam}`)}
                style={{ background: 'white', color: PRIMARY_COLOR }}
              >
                <Plus size={16} />
                Add Item
              </Button>
            </div>
          </HeaderContainer>

          <FiltersContainer>
            <Search size={20} color={TEXT_COLOR_MUTED} />
            <Input
              type="text"
              placeholder="Search items..."
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
              <option value="revenue">Revenue</option>
              <option value="expense">Expense</option>
            </select>
          </FiltersContainer>

          {filteredItems.length === 0 ? (
            <ItemsCard>
              <div style={{ textAlign: 'center', padding: theme.spacing.xl, color: TEXT_COLOR_MUTED }}>
                <List size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                <p>No budget items found. Add your first item to get started.</p>
              </div>
            </ItemsCard>
          ) : (
            <>
              <ItemsCard>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md }}>
                  <h2 style={{ margin: 0, color: TEXT_COLOR_DARK }}>Items ({filteredItems.length})</h2>
                  <div style={{ display: 'flex', gap: theme.spacing.lg, fontSize: theme.typography.fontSizes.sm }}>
                    <div>
                      <span style={{ color: TEXT_COLOR_MUTED }}>Total Revenue: </span>
                      <span style={{ color: '#10b981', fontWeight: theme.typography.fontWeights.bold }}>
                        {formatCurrency(totalRevenue)}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: TEXT_COLOR_MUTED }}>Total Expenses: </span>
                      <span style={{ color: '#ef4444', fontWeight: theme.typography.fontWeights.bold }}>
                        {formatCurrency(totalExpenses)}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: TEXT_COLOR_MUTED }}>Net: </span>
                      <span style={{ 
                        color: totalRevenue - totalExpenses >= 0 ? '#10b981' : '#ef4444',
                        fontWeight: theme.typography.fontWeights.bold
                      }}>
                        {formatCurrency(totalRevenue - totalExpenses)}
                      </span>
                    </div>
                  </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <ItemsTable>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Category</th>
                        <th>Amount</th>
                        <th>Description</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredItems.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <strong>{item.name}</strong>
                          </td>
                          <td>
                            <TypeBadge $type={item.type}>
                              {item.type === 'revenue' ? <TrendingUp size={12} style={{ display: 'inline', marginRight: '4px' }} /> : <TrendingDown size={12} style={{ display: 'inline', marginRight: '4px' }} />}
                              {item.type}
                            </TypeBadge>
                          </td>
                          <td>{item.category}</td>
                          <td style={{ fontWeight: theme.typography.fontWeights.bold }}>
                            {formatCurrency(item.amount)}
                          </td>
                          <td style={{ color: TEXT_COLOR_MUTED, maxWidth: '300px' }}>
                            {item.description || '-'}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: theme.spacing.sm }}>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/budgets/edititems/${item.id}?budget_id=${budgetIdParam}`)}
                              >
                                <Edit size={14} />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteClick(item.id)}
                                style={{ color: '#ef4444', borderColor: '#ef4444' }}
                              >
                                <Trash2 size={14} />
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </ItemsTable>
                </div>
              </ItemsCard>
            </>
          )}

          {/* Delete Modal with Password Verification */}
          {showDeleteModal && (
            <ModalOverlay onClick={() => {
              setShowDeleteModal(false);
              setDeleteItemId(null);
              setDeletePassword('');
              setDeletePasswordError(null);
            }}>
              <ModalContent onClick={(e) => e.stopPropagation()}>
                <ModalTitle>
                  <Trash2 size={20} style={{ color: '#ef4444' }} />
                  Delete Budget Item
                </ModalTitle>
                
                <WarningBox>
                  <p>
                    <strong>Warning:</strong> You are about to permanently delete this budget item. 
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
                      setDeleteItemId(null);
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

export default BudgetItemsListPage;

