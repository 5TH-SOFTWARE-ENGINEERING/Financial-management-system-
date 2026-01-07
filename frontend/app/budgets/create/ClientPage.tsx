'use client';
import React, { useState } from 'react';
import styled from 'styled-components';
import { useRouter } from 'next/navigation';
import {
  DollarSign, Save, X, Plus, Trash2, AlertCircle, CheckCircle
} from 'lucide-react';
import Layout from '@/components/layout';
import apiClient from '@/lib/api';
import { theme } from '@/components/common/theme';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ComponentGate } from '@/lib/rbac/component-gate';
import { ComponentId } from '@/lib/rbac/component-access';
import { toast } from 'sonner';


const CardShadow = `
  0 2px 4px -1px rgba(0, 0, 0, 0.06),
  0 1px 2px -1px rgba(0, 0, 0, 0.03),
  inset 0 0 0 1px rgba(0, 0, 0, 0.02)
`;

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: ${props => props.theme.colors.background};
`;

const ContentContainer = styled.div`
  flex: 1;
  width: 100%;
  max-width: 980px;
  margin-left: auto;
  margin-right: 0;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.sm} ${props => props.theme.spacing.sm};
`;

const HeaderContainer = styled.div`
  background: linear-gradient(135deg, ${props => props.theme.colors.primary} 0%, ${props => props.theme.mode === 'dark' ? '#064e3b' : '#008800'} 100%);
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

const FormCard = styled.div`
  background: ${props => props.theme.colors.background};
  border-radius: ${props => props.theme.borderRadius.md};
  border: 1px solid ${props => props.theme.colors.border};
  box-shadow: ${CardShadow};
  padding: ${props => props.theme.spacing.xl};
  margin-bottom: ${props => props.theme.spacing.lg};
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
  margin-bottom: ${props => props.theme.spacing.md};
  
  label {
    display: block;
    font-size: ${props => props.theme.typography.fontSizes.sm};
    font-weight: ${props => props.theme.typography.fontWeights.medium};
    color: ${props => props.theme.colors.textDark};
    margin: 0;
  }
`;

const StyledInput = styled.input`
  width: 100%;
  max-width: 100%;
  padding: 10px 14px;
  border: 1.5px solid ${props => props.theme.colors.border};
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
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 3px ${props => props.theme.mode === 'dark' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)'};
    background: ${props => props.theme.colors.background};
  }

  &:hover:not(:disabled) {
    border-color: ${props => props.theme.colors.textSecondary};
  }

  &::placeholder {
    color: ${props => props.theme.colors.textSecondary};
  }

  &:disabled {
    background-color: ${props => props.theme.colors.backgroundSecondary};
    color: ${props => props.theme.colors.mutedForeground};
    cursor: not-allowed;
    opacity: 0.7;
    border-color: ${props => props.theme.colors.border};
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
  border: 1.5px solid ${props => props.theme.colors.border};
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  background: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.textDark};
  transition: all 0.2s ease-in-out;
  outline: none;
  box-sizing: border-box;
  margin: 0;
  resize: vertical;
  min-height: 100px;

  &:focus {
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 3px ${props => props.theme.mode === 'dark' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)'};
    background: ${props => props.theme.colors.background};
  }

  &:hover:not(:disabled) {
    border-color: ${props => props.theme.colors.textSecondary};
  }

  &::placeholder {
    color: ${props => props.theme.colors.textSecondary};
  }

  &:disabled {
    background-color: ${props => props.theme.colors.backgroundSecondary};
    color: ${props => props.theme.colors.mutedForeground};
    cursor: not-allowed;
    opacity: 0.7;
    border-color: ${props => props.theme.colors.border};
  }
`;

const StyledSelect = styled.select`
  width: 100%;
  max-width: 100%;
  padding: 10px 14px;
  border: 1.5px solid ${props => props.theme.colors.border};
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  background: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.textDark};
  transition: all 0.2s ease-in-out;
  outline: none;
  box-sizing: border-box;
  margin: 0;
  cursor: pointer;

  &:focus {
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 3px ${props => props.theme.mode === 'dark' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)'};
    background: ${props => props.theme.colors.background};
  }

  &:hover:not(:disabled) {
    border-color: ${props => props.theme.colors.textSecondary};
  }

  &:disabled {
    background-color: ${props => props.theme.colors.backgroundSecondary};
    color: ${props => props.theme.colors.mutedForeground};
    cursor: not-allowed;
    opacity: 0.7;
    border-color: ${props => props.theme.colors.border};
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
  margin-top: ${props => props.theme.spacing.xl};
`;

const ItemsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.md};
  
  h3 {
    font-size: ${props => props.theme.typography.fontSizes.lg};
    font-weight: ${props => props.theme.typography.fontWeights.bold};
    color: ${props => props.theme.colors.textDark};
    margin: 0;
  }
`;

const ItemsTable = styled.div`
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.sm};
  overflow: hidden;
`;

const ItemsTableHeader = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr auto;
  gap: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.md};
  background: ${props => props.theme.colors.backgroundSecondary};
  font-weight: ${props => props.theme.typography.fontWeights.medium};
  font-size: ${props => props.theme.typography.fontSizes.sm};
  color: ${props => props.theme.colors.textDark};
  border-bottom: 1px solid ${props => props.theme.colors.border};
`;

const ItemsTableRow = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr auto;
  gap: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.md};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  align-items: center;
  
  &:last-child {
    border-bottom: none;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 16px;
  justify-content: space-between;
  margin-top: ${props => props.theme.spacing.xl};
  padding-top: ${props => props.theme.spacing.lg};
  border-top: 1px solid ${props => props.theme.colors.border};
`;

const SummaryContainer = styled.div`
  margin-top: ${props => props.theme.spacing.md};
  padding: ${props => props.theme.spacing.md};
  background: ${props => props.theme.colors.card};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.sm};
`;

const SummaryText = styled.div`
  color: ${props => props.theme.colors.textDark};
  font-size: 14px;
`;

const EmptyItemsContainer = styled.div`
  text-align: center;
  padding: ${props => props.theme.spacing.xl};
  color: ${props => props.theme.colors.textSecondary};
`;

const SectionTitle = styled.h2`
  margin-bottom: ${props => props.theme.spacing.lg};
  color: ${props => props.theme.colors.textDark};
`;

const ProfitValue = styled.span<{ $isPositive: boolean }>`
  color: ${props => props.$isPositive ? props.theme.colors.primary : props.theme.colors.error};
`;

const ValidationErrors = styled.div`
  background: ${props => props.theme.mode === 'dark' ? 'rgba(239, 68, 68, 0.1)' : '#fef2f2'};
  border: 1px solid ${props => props.theme.mode === 'dark' ? 'rgba(239, 68, 68, 0.3)' : '#fecaca'};
  border-radius: ${theme.borderRadius.sm};
  padding: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.md};
  
  h4 {
    color: ${props => props.theme.mode === 'dark' ? '#fca5a5' : '#dc2626'};
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
    color: ${props => props.theme.mode === 'dark' ? '#fca5a5' : '#991b1b'};
    font-size: ${theme.typography.fontSizes.sm};
  }
`;

interface BudgetItem {
  name: string;
  description: string;
  type: 'revenue' | 'expense';
  category: string;
  amount: number;
}

type BudgetForm = {
  name: string;
  description: string;
  period: 'monthly' | 'quarterly' | 'yearly' | string;
  start_date: string;
  end_date: string;
  department: string;
  project: string;
  status: string;
};

const BudgetCreatePage: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<BudgetForm>({
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

  const handleInputChange = <K extends keyof BudgetForm>(field: K, value: BudgetForm[K]) => {
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

  const handleItemChange = (index: number, field: keyof BudgetItem, value: string | number) => {
    setItems(prev => prev.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
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
    return errors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!(await handleValidate())) {
      toast.error('Please fix validation errors before saving');
      return;
    }

    try {
      setLoading(true);

      // Convert dates to ISO datetime strings (backend expects datetime objects)
      // Pydantic accepts ISO 8601 format datetime strings
      const startDate = formData.start_date
        ? new Date(formData.start_date + 'T00:00:00').toISOString()
        : '';
      const endDate = formData.end_date
        ? new Date(formData.end_date + 'T23:59:59').toISOString()
        : '';

      if (!startDate || !endDate) {
        toast.error('Start date and end date are required');
        return;
      }

      const budgetData = {
        name: formData.name.trim(),
        description: formData.description?.trim() || null,
        period: formData.period,
        start_date: startDate,
        end_date: endDate,
        department: formData.department?.trim() || null,
        project: formData.project?.trim() || null,
        status: formData.status,
        items: items.map(item => ({
          name: item.name.trim(),
          description: item.description?.trim() || null,
          type: item.type,
          category: item.category.trim(),
          amount: parseFloat(item.amount.toString()) || 0
        })).filter(item => item.name && item.category) // Filter out empty items
      };

      await apiClient.createBudget(budgetData);
      toast.success('Budget created successfully!');
      router.push('/budgets');
    } catch (error: unknown) {
      console.error('Budget creation error:', error);
      console.error('Error response:', (error as { response?: unknown })?.response);

      let errorMessage = 'Failed to create budget';

      const errorResponse = (error as { response?: { data?: unknown } }).response?.data;

      if (errorResponse) {
        const errorData = errorResponse as { detail?: unknown; message?: string };

        // Handle Pydantic validation errors
        const detail = errorData.detail;
        if (Array.isArray(detail)) {
          const validationErrors = detail.map((err: { loc?: unknown[]; msg?: string }) => {
            if (Array.isArray(err.loc) && err.msg) {
              return `${err.loc.join('.')}: ${err.msg}`;
            }
            return err.msg || JSON.stringify(err);
          });
          errorMessage = validationErrors.join('\n');
        } else if (typeof detail === 'string') {
          errorMessage = detail;
        } else if (typeof detail === 'object' && detail !== null && 'msg' in detail) {
          const msg = (detail as { msg?: string }).msg;
          if (msg) errorMessage = msg;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } else if (error instanceof Error && error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      toast.error(errorMessage);
      setValidationErrors(errorMessage.split('\n'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <PageContainer>
        <ComponentGate componentId={ComponentId.BUDGET_CREATE}>
          <ContentContainer>
            <HeaderContainer>
              <h1>
                <DollarSign size={36} />
                Create New Budget
              </h1>
            </HeaderContainer>

            <form onSubmit={handleSubmit}>
              <FormCard>
                <SectionTitle>
                  Budget Information
                </SectionTitle>

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
                    <EmptyItemsContainer>
                      <p>No items added yet. Click &quot;Add Item&quot; to get started.</p>
                    </EmptyItemsContainer>
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
                        <ItemsTableRow key={index}>
                          <StyledInput
                            type="text"
                            value={item.name}
                            onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                            placeholder="Item name"
                          />
                          <StyledSelect
                            value={item.type}
                            onChange={(e) => handleItemChange(index, 'type', e.target.value)}
                          >
                            <option value="revenue">Revenue</option>
                            <option value="expense">Expense</option>
                          </StyledSelect>
                          <StyledInput
                            type="text"
                            value={item.category}
                            onChange={(e) => handleItemChange(index, 'category', e.target.value)}
                            placeholder="Category"
                          />
                          <StyledInput
                            type="number"
                            value={item.amount}
                            onChange={(e) => handleItemChange(index, 'amount', parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.01"
                          />
                          <StyledInput
                            type="text"
                            value={item.description}
                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                            placeholder="Description"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveItem(index)}
                            style={{ color: '#ef4444', borderColor: '#ef4444' }}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </ItemsTableRow>
                      ))}
                    </ItemsTable>
                  )}

                  <SummaryContainer>
                    <SummaryText>
                      <strong>Total Revenue: </strong>
                      ${items.filter(i => i.type === 'revenue').reduce((sum, i) => sum + (i.amount || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </SummaryText>
                    <SummaryText>
                      <strong>Total Expenses: </strong>
                      ${items.filter(i => i.type === 'expense').reduce((sum, i) => sum + (i.amount || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </SummaryText>
                    <SummaryText>
                      <strong>Total Profit: </strong>
                      <ProfitValue $isPositive={(items.filter(i => i.type === 'revenue').reduce((sum, i) => sum + (i.amount || 0), 0) - items.filter(i => i.type === 'expense').reduce((sum, i) => sum + (i.amount || 0), 0)) >= 0}>
                        ${(items.filter(i => i.type === 'revenue').reduce((sum, i) => sum + (i.amount || 0), 0) - items.filter(i => i.type === 'expense').reduce((sum, i) => sum + (i.amount || 0), 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </ProfitValue>
                    </SummaryText>
                  </SummaryContainer>
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
                  disabled={loading}
                >
                  <Save size={16} />
                  {loading ? 'Creating...' : 'Create Budget'}
                </Button>
              </ActionButtons>
            </form>
          </ContentContainer>
        </ComponentGate>
      </PageContainer>
    </Layout>
  );
};

export default BudgetCreatePage;

