'use client';
import React, { useState } from 'react';
import styled from 'styled-components';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/rbac/auth-context';
import {
  DollarSign, FileText, Save, X, Plus, Trash2, AlertCircle, CheckCircle
} from 'lucide-react';
import Layout from '@/components/layout';
import apiClient from '@/lib/api';
import { theme } from '@/components/common/theme';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

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
  margin-bottom: ${theme.spacing.md};
  
  label {
    display: block;
    font-size: ${theme.typography.fontSizes.sm};
    font-weight: ${theme.typography.fontWeights.medium};
    color: ${TEXT_COLOR_DARK};
    margin-bottom: ${theme.spacing.xs};
  }
  
  input, select, textarea {
    width: 100%;
    padding: ${theme.spacing.sm};
    border: 1px solid ${theme.colors.border};
    border-radius: ${theme.borderRadius.sm};
    font-size: ${theme.typography.fontSizes.sm};
    
    &:focus {
      outline: none;
      border-color: ${PRIMARY_COLOR};
      box-shadow: 0 0 0 3px rgba(0, 170, 0, 0.1);
    }
  }
  
  textarea {
    min-height: 100px;
    resize: vertical;
  }
`;

const TwoColumnGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${theme.spacing.md};
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
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
  
  &:last-child {
    border-bottom: none;
  }
  
  input, select {
    padding: ${theme.spacing.xs} ${theme.spacing.sm};
    border: 1px solid ${theme.colors.border};
    border-radius: ${theme.borderRadius.sm};
    font-size: ${theme.typography.fontSizes.sm};
    
    &:focus {
      outline: none;
      border-color: ${PRIMARY_COLOR};
    }
  }
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${theme.spacing.md};
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

interface BudgetItem {
  name: string;
  description: string;
  type: 'revenue' | 'expense';
  category: string;
  amount: number;
}

const BudgetCreatePage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
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
      const startDate = formData.start_date ? new Date(formData.start_date + 'T00:00:00Z').toISOString() : '';
      const endDate = formData.end_date ? new Date(formData.end_date + 'T23:59:59Z').toISOString() : '';
      
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
    } catch (error: any) {
      console.error('Budget creation error:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to create budget';
      if (Array.isArray(errorMessage)) {
        // Handle validation errors array
        toast.error(errorMessage.join(', '));
      } else if (typeof errorMessage === 'object' && errorMessage.msg) {
        toast.error(errorMessage.msg);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <PageContainer>
        <ContentContainer>
          <HeaderContainer>
            <h1>
              <DollarSign size={36} />
              Create New Budget
            </h1>
          </HeaderContainer>

          <form onSubmit={handleSubmit}>
            <FormCard>
              <h2 style={{ marginBottom: theme.spacing.lg, color: TEXT_COLOR_DARK }}>
                Budget Information
              </h2>

              <FormGroup>
                <label>Budget Name </label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Q1 2024 Budget"
                  required
                />
              </FormGroup>

              <FormGroup>
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Budget description..."
                />
              </FormGroup>

              <TwoColumnGrid>
                <FormGroup>
                  <label>Period </label>
                  <select
                    value={formData.period}
                    onChange={(e) => handleInputChange('period', e.target.value)}
                    required
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                    <option value="custom">Custom</option>
                  </select>
                </FormGroup>

                <FormGroup>
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                  >
                    <option value="draft">Draft</option>
                    <option value="submitted">Submitted</option>
                    <option value="approved">Approved</option>
                    <option value="active">Active</option>
                  </select>
                </FormGroup>
              </TwoColumnGrid>

              <TwoColumnGrid>
                <FormGroup>
                  <label>Start Date </label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => handleInputChange('start_date', e.target.value)}
                    required
                  />
                </FormGroup>

                <FormGroup>
                  <label>End Date </label>
                  <Input
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
                  <Input
                    type="text"
                    value={formData.department}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    placeholder="e.g., Sales, Marketing"
                  />
                </FormGroup>

                <FormGroup>
                  <label>Project</label>
                  <Input
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
                      <ItemsTableRow key={index}>
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                          placeholder="Item name"
                        />
                        <select
                          value={item.type}
                          onChange={(e) => handleItemChange(index, 'type', e.target.value)}
                        >
                          <option value="revenue">Revenue</option>
                          <option value="expense">Expense</option>
                        </select>
                        <input
                          type="text"
                          value={item.category}
                          onChange={(e) => handleItemChange(index, 'category', e.target.value)}
                          placeholder="Category"
                        />
                        <input
                          type="number"
                          value={item.amount}
                          onChange={(e) => handleItemChange(index, 'amount', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                        />
                        <input
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
                disabled={loading}
              >
                <Save size={16} />
                {loading ? 'Creating...' : 'Create Budget'}
              </Button>
            </ActionButtons>
          </form>
        </ContentContainer>
      </PageContainer>
    </Layout>
  );
};

export default BudgetCreatePage;

