'use client';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/rbac/auth-context';
import {
  DollarSign, Save, X, Plus, Trash2, AlertCircle, CheckCircle, ArrowLeft, Loader2
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

const CardShadow = `
  0 2px 4px -1px rgba(0, 0, 0, 0.06),
  0 1px 2px -1px rgba(0, 0, 0, 0.03),
  inset 0 0 0 1px rgba(0, 0, 0, 0.02)
`;

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: linear-gradient(180deg, #f9fafb 0%, #f3f4f6 60%, ${theme.colors.background} 100%);
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

const ItemsSection = styled.div`
  margin-top: ${theme.spacing.xl};
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

const ItemsTable = styled.div`
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.sm};
  overflow: hidden;
`;

const ItemsTableHeader = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr auto;
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.md};
  background: ${theme.colors.backgroundSecondary};
  font-weight: ${theme.typography.fontWeights.medium};
  font-size: ${theme.typography.fontSizes.sm};
  color: ${TEXT_COLOR_DARK};
  border-bottom: 1px solid ${theme.colors.border};
`;

const ItemsTableRow = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr auto;
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.md};
  border-bottom: 1px solid ${theme.colors.border};
  align-items: center;
  
  &:last-child {
    border-bottom: none;
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

const ValidationErrors = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: ${theme.borderRadius.sm};
  padding: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.md};
  
  h4 {
    color: #dc2626;
    font-size: ${theme.typography.fontSizes.sm};
    font-weight: ${theme.typography.fontWeights.bold};
    margin: 0 0 ${theme.spacing.xs};
    display: flex;
    align-items: center;
    gap: ${theme.spacing.xs};
  }
  
  ul {
    margin: 0;
    padding-left: ${theme.spacing.lg};
    color: #991b1b;
    font-size: ${theme.typography.fontSizes.sm};
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

interface BudgetItem {
  id?: number;
  name: string;
  description: string;
  type: 'revenue' | 'expense';
  category: string;
  amount: number;
}

const BudgetEditPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [budgetId, setBudgetId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    period: 'monthly',
    start_date: '',
    end_date: '',
    department: '',
    project: '',
    status: 'draft'
  });
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteItemIndex, setDeleteItemIndex] = useState<number | null>(null);
  const [deleteItemId, setDeleteItemId] = useState<number | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletePasswordError, setDeletePasswordError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const id = params?.id ? parseInt(params.id as string) : null;
    if (id) {
      setBudgetId(id);
      loadBudget(id);
      loadItems(id);
    }
  }, [params]);

  const loadBudget = async (id: number) => {
    try {
      setLoading(true);
      const response = await apiClient.getBudget(id);
      const budget = response.data as any;
      
      setFormData({
        name: budget?.name || '',
        description: budget?.description || '',
        period: budget?.period || 'monthly',
        start_date: budget?.start_date ? budget.start_date.split('T')[0] : '',
        end_date: budget?.end_date ? budget.end_date.split('T')[0] : '',
        department: budget?.department || '',
        project: budget?.project || '',
        status: budget?.status || 'draft'
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to load budget');
      router.push('/budgets');
    } finally {
      setLoading(false);
    }
  };

  const loadItems = async (id: number) => {
    try {
      const response = await apiClient.getBudgetItems(id);
      setItems(Array.isArray(response.data) ? response.data : []);
    } catch (error: any) {
      console.error('Failed to load budget items:', error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddItem = () => {
    setItems(prev => [...prev, {
      name: '',
      description: '',
      type: 'revenue',
      category: '',
      amount: 0
    }]);
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    setItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const handleRemoveItemClick = (index: number, itemId?: number) => {
    if (itemId && budgetId) {
      // Existing item - require password verification
      setDeleteItemIndex(index);
      setDeleteItemId(itemId);
      setDeletePassword('');
      setDeletePasswordError(null);
      setShowDeleteModal(true);
    } else {
      // New item not yet saved - can remove directly from local state
      setItems(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleDeleteItem = async (password: string) => {
    if (!budgetId || deleteItemIndex === null || !deleteItemId) return;

    if (!password.trim()) {
      setDeletePasswordError('Password is required');
      return;
    }

    setDeleting(true);
    setDeletePasswordError(null);

    try {
      await apiClient.deleteBudgetItem(budgetId, deleteItemId, password.trim());
      toast.success('Item deleted');
      // Remove from local state
      setItems(prev => prev.filter((_, i) => i !== deleteItemIndex));
      setShowDeleteModal(false);
      setDeleteItemIndex(null);
      setDeleteItemId(null);
      setDeletePassword('');
      // Reload items to sync with server
      loadItems(budgetId);
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to delete item';
      setDeletePasswordError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  const handleSaveItem = async (index: number, item: BudgetItem) => {
    if (!budgetId) return;
    
    try {
      if (item.id) {
        // Update existing item
        await apiClient.updateBudgetItem(budgetId, item.id, {
          name: item.name,
          description: item.description,
          type: item.type,
          category: item.category,
          amount: item.amount
        });
        toast.success('Item updated');
      } else {
        // Create new item
        const response = await apiClient.createBudgetItem(budgetId, {
          name: item.name,
          description: item.description,
          type: item.type,
          category: item.category,
          amount: item.amount
        });
        // Update the item with the new ID
        const newItem = response.data as any;
        setItems(prev => prev.map((it, i) => 
          i === index ? { ...it, id: newItem?.id } : it
        ));
        toast.success('Item added');
      }
      // Reload items to sync with server
      loadItems(budgetId);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save item');
    }
  };

  const handleValidate = async () => {
    const errors: string[] = [];
    
    if (!formData.name.trim()) errors.push('Budget name is required');
    if (!formData.start_date) errors.push('Start date is required');
    if (!formData.end_date) errors.push('End date is required');
    if (new Date(formData.end_date) < new Date(formData.start_date)) {
      errors.push('End date must be after start date');
    }
    
    items.forEach((item, index) => {
      if (!item.name.trim()) errors.push(`Item ${index + 1}: Name is required`);
      if (!item.category.trim()) errors.push(`Item ${index + 1}: Category is required`);
      if (item.amount < 0) errors.push(`Item ${index + 1}: Amount cannot be negative`);
    });
    
    setValidationErrors(errors);
    if (errors.length === 0 && budgetId) {
      // Validate on server
      try {
        const response = await apiClient.validateBudget(budgetId);
        const result = response.data as any;
        if (result?.valid) {
          toast.success('Budget is valid!');
        } else {
          const errors = result?.errors || ['Validation failed'];
          toast.error(`Validation failed: ${errors.join(', ')}`);
        }
      } catch (error: any) {
        toast.error(error.message || 'Failed to validate budget');
      }
    }
    return errors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!budgetId) return;
    if (!(await handleValidate())) {
      toast.error('Please fix validation errors before saving');
      return;
    }

    try {
      setSaving(true);
      await apiClient.updateBudget(budgetId, formData);
      toast.success('Budget updated successfully!');
      router.push(`/budgets/${budgetId}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update budget');
    } finally {
      setSaving(false);
    }
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

  return (
    <Layout>
      <PageContainer>
        <ContentContainer>
          <BackLink href={`/budgets/${budgetId}`}>
            <ArrowLeft size={16} />
            Back to Budget
          </BackLink>

          <HeaderContainer>
            <h1>
              <DollarSign size={36} />
              Edit Budget
            </h1>
          </HeaderContainer>

          <form onSubmit={handleSubmit}>
            <FormCard>
              <h2 style={{ marginBottom: theme.spacing.lg, color: TEXT_COLOR_DARK }}>
                Budget Information
              </h2>

              <FormGroup>
                <label>Budget Name </label>
                <StyledInput
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Q1 2024 Budget"
                  required
                />
              </FormGroup>

              <FormGroup>
                <label>Description</label>
                <StyledTextarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Budget description..."
                  rows={4}
                />
              </FormGroup>

              <TwoColumnGrid>
                <FormGroup>
                  <label>Period </label>
                  <StyledSelect
                    value={formData.period}
                    onChange={(e) => handleInputChange('period', e.target.value)}
                    required
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                    <option value="custom">Custom</option>
                  </StyledSelect>
                </FormGroup>

                <FormGroup>
                  <label>Status</label>
                  <StyledSelect
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                  >
                    <option value="draft">Draft</option>
                    <option value="submitted">Submitted</option>
                    <option value="approved">Approved</option>
                    <option value="active">Active</option>
                  </StyledSelect>
                </FormGroup>
              </TwoColumnGrid>

              <TwoColumnGrid>
                <FormGroup>
                  <label>Start Date </label>
                  <StyledInput
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => handleInputChange('start_date', e.target.value)}
                    required
                  />
                </FormGroup>

                <FormGroup>
                  <label>End Date </label>
                  <StyledInput
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => handleInputChange('end_date', e.target.value)}
                    required
                  />
                </FormGroup>
              </TwoColumnGrid>

              <TwoColumnGrid>
                <FormGroup>
                  <label>Department</label>
                  <StyledInput
                    type="text"
                    value={formData.department}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    placeholder="e.g., Sales, Marketing"
                  />
                </FormGroup>

                <FormGroup>
                  <label>Project</label>
                  <StyledInput
                    type="text"
                    value={formData.project}
                    onChange={(e) => handleInputChange('project', e.target.value)}
                    placeholder="Project name"
                  />
                </FormGroup>
              </TwoColumnGrid>
            </FormCard>

            <FormCard>
              <ItemsSection>
                <ItemsHeader>
                  <h3>Budget Items</h3>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddItem}
                  >
                    <Plus size={16} />
                    Add Item
                  </Button>
                </ItemsHeader>

                {validationErrors.length > 0 && (
                  <ValidationErrors>
                    <h4>
                      <AlertCircle size={16} />
                      Validation Errors
                    </h4>
                    <ul>
                      {validationErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </ValidationErrors>
                )}

                {items.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: theme.spacing.xl, color: TEXT_COLOR_MUTED }}>
                    <p>No items added yet. Click "Add Item" to get started.</p>
                  </div>
                ) : (
                  <ItemsTable>
                    <ItemsTableHeader>
                      <div>Name</div>
                      <div>Type</div>
                      <div>Category</div>
                      <div>Amount</div>
                      <div>Description</div>
                      <div></div>
                    </ItemsTableHeader>
                    {items.map((item, index) => (
                      <ItemsTableRow key={item.id || index}>
                        <StyledInput
                          type="text"
                          value={item.name}
                          onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                          onBlur={() => handleSaveItem(index, item)}
                          placeholder="Item name"
                        />
                        <StyledSelect
                          value={item.type}
                          onChange={(e) => handleItemChange(index, 'type', e.target.value)}
                          onBlur={() => handleSaveItem(index, item)}
                        >
                          <option value="revenue">Revenue</option>
                          <option value="expense">Expense</option>
                        </StyledSelect>
                        <StyledInput
                          type="text"
                          value={item.category}
                          onChange={(e) => handleItemChange(index, 'category', e.target.value)}
                          onBlur={() => handleSaveItem(index, item)}
                          placeholder="Category"
                        />
                        <StyledInput
                          type="number"
                          value={item.amount}
                          onChange={(e) => handleItemChange(index, 'amount', parseFloat(e.target.value) || 0)}
                          onBlur={() => handleSaveItem(index, item)}
                          min="0"
                          step="0.01"
                        />
                        <StyledInput
                          type="text"
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          onBlur={() => handleSaveItem(index, item)}
                          placeholder="Description"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveItemClick(index, item.id)}
                          style={{ color: '#ef4444', borderColor: '#ef4444' }}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </ItemsTableRow>
                    ))}
                  </ItemsTable>
                )}

                <div style={{ marginTop: theme.spacing.md, padding: theme.spacing.md, background: '#f3f4f6', borderRadius: theme.borderRadius.sm }}>
                  <strong>Total Revenue: </strong>
                  ${items.filter(i => i.type === 'revenue').reduce((sum, i) => sum + (i.amount || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  <br />
                  <strong>Total Expenses: </strong>
                  ${items.filter(i => i.type === 'expense').reduce((sum, i) => sum + (i.amount || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  <br />
                  <strong>Total Profit: </strong>
                  <span style={{ color: (items.filter(i => i.type === 'revenue').reduce((sum, i) => sum + (i.amount || 0), 0) - items.filter(i => i.type === 'expense').reduce((sum, i) => sum + (i.amount || 0), 0)) >= 0 ? '#059669' : '#ef4444' }}>
                    ${(items.filter(i => i.type === 'revenue').reduce((sum, i) => sum + (i.amount || 0), 0) - items.filter(i => i.type === 'expense').reduce((sum, i) => sum + (i.amount || 0), 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </ItemsSection>
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
                type="button"
                variant="outline"
                onClick={handleValidate}
              >
                <CheckCircle size={16} />
                Validate
              </Button>
              <Button
                type="submit"
                disabled={saving}
              >
                <Save size={16} />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </ActionButtons>
          </form>

          {/* Delete Modal with Password Verification */}
          {showDeleteModal && (
            <ModalOverlay onClick={() => {
              setShowDeleteModal(false);
              setDeleteItemIndex(null);
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
                        handleDeleteItem(deletePassword);
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
                      setDeleteItemIndex(null);
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
                    onClick={() => handleDeleteItem(deletePassword)}
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

export default BudgetEditPage;

