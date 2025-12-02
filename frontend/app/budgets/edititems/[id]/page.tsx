'use client';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/rbac/auth-context';
import {
  Edit, ArrowLeft, Save, X, AlertCircle
} from 'lucide-react';
import Layout from '@/components/layout';
import apiClient from '@/lib/api';
import { theme } from '@/components/common/theme';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

const ActionButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${theme.spacing.md};
  margin-top: ${theme.spacing.xl};
  padding-top: ${theme.spacing.lg};
  border-top: 1px solid ${theme.colors.border};
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
}

const EditBudgetItemPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const itemIdParam = params?.id ? parseInt(params.id as string) : null;
  const budgetIdParam = searchParams?.get('budget_id');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [item, setItem] = useState<BudgetItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'revenue',
    category: '',
    amount: ''
  });

  useEffect(() => {
    if (itemIdParam && budgetIdParam) {
      loadData();
    } else {
      toast.error('Item ID and Budget ID are required');
      router.push('/budgets');
    }
  }, [itemIdParam, budgetIdParam]);

  const loadData = async () => {
    if (!itemIdParam || !budgetIdParam) return;
    
    try {
      setLoading(true);
      const [budgetResponse, itemsResponse] = await Promise.all([
        apiClient.getBudget(parseInt(budgetIdParam)),
        apiClient.getBudgetItems(parseInt(budgetIdParam))
      ]);
      
      setBudget(budgetResponse.data as Budget);
      const items = Array.isArray(itemsResponse.data) ? itemsResponse.data : [];
      const foundItem = items.find((i: BudgetItem) => i.id === itemIdParam);
      
      if (foundItem) {
        setItem(foundItem as BudgetItem);
        setFormData({
          name: foundItem.name,
          description: foundItem.description || '',
          type: foundItem.type,
          category: foundItem.category,
          amount: foundItem.amount.toString()
        });
      } else {
        toast.error('Budget item not found');
        router.push(`/budgets/listitems?budget_id=${budgetIdParam}`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to load budget item');
      router.push('/budgets');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Item name is required');
      return;
    }
    if (!formData.category.trim()) {
      toast.error('Category is required');
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) < 0) {
      toast.error('Valid amount is required');
      return;
    }

    if (!itemIdParam || !budgetIdParam) return;

    try {
      setSaving(true);
      await apiClient.updateBudgetItem(parseInt(budgetIdParam), itemIdParam, {
        name: formData.name,
        description: formData.description || undefined,
        type: formData.type,
        category: formData.category,
        amount: parseFloat(formData.amount)
      });
      toast.success('Budget item updated successfully!');
      router.push(`/budgets/listitems?budget_id=${budgetIdParam}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update budget item');
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
              <p>Loading budget item...</p>
            </LoadingContainer>
          </ContentContainer>
        </PageContainer>
      </Layout>
    );
  }

  if (!item) {
    return (
      <Layout>
        <PageContainer>
          <ContentContainer>
            <div style={{ textAlign: 'center', padding: theme.spacing.xl }}>
              <AlertCircle size={48} style={{ margin: '0 auto 16px', color: TEXT_COLOR_MUTED }} />
              <p>Budget item not found</p>
              <Button onClick={() => router.push(`/budgets/listitems?budget_id=${budgetIdParam}`)} style={{ marginTop: theme.spacing.md }}>
                Back to Budget Items
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
          <BackLink href={`/budgets/listitems?budget_id=${budgetIdParam}`}>
            <ArrowLeft size={16} />
            Back to Budget Items
          </BackLink>

          <HeaderContainer>
            <h1>
              <Edit size={36} />
              Edit Budget Item: {budget?.name || 'Budget'}
            </h1>
          </HeaderContainer>

          <form onSubmit={handleSubmit}>
            <FormCard>
              <h2 style={{ marginBottom: theme.spacing.lg, color: TEXT_COLOR_DARK }}>
                Item Information
              </h2>

              <FormGroup>
                <label>Item Name *</label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Sales Revenue, Office Supplies"
                  required
                />
              </FormGroup>

              <FormGroup>
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Item description..."
                />
              </FormGroup>

              <FormGroup>
                <label>Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  required
                >
                  <option value="revenue">Revenue</option>
                  <option value="expense">Expense</option>
                </select>
              </FormGroup>

              <FormGroup>
                <label>Category *</label>
                <Input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., sales, salary, marketing, supplies"
                  required
                />
              </FormGroup>

              <FormGroup>
                <label>Amount *</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </FormGroup>
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
                type="submit"
                disabled={saving}
              >
                <Save size={16} />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </ActionButtons>
          </form>
        </ContentContainer>
      </PageContainer>
    </Layout>
  );
};

export default EditBudgetItemPage;

