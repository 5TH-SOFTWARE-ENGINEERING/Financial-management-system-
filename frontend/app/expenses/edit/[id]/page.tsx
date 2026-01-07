'use client';
import { useState, useEffect, useCallback } from 'react';
import styled, { useTheme } from 'styled-components';
import { useForm, Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ExpenseSchema } from '@/lib/validation';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Navbar from '@/components/common/Navbar';
import Sidebar from '@/components/common/Sidebar';
import apiClient from '@/lib/api';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, DollarSign, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

// ──────────────────────────────────────────
// Theme-aware Constants
// ──────────────────────────────────────────
const PRIMARY_COLOR = (props: any) => props.theme.colors.primary || '#00AA00';
const TEXT_COLOR_DARK = (props: any) => props.theme.colors.textDark;
const TEXT_COLOR_MUTED = (props: any) => props.theme.colors.textSecondary || '#666';
const BORDER_COLOR = (props: any) => props.theme.colors.border;
const BACKGROUND_PAGE = (props: any) => props.theme.colors.backgroundSecondary || '#f5f6fa';
const BACKGROUND_CARD = (props: any) => props.theme.colors.background || '#ffffff';

// ──────────────────────────────────────────
// Styled Components
// ──────────────────────────────────────────
const LayoutWrapper = styled.div`
  display: flex;
  background: ${BACKGROUND_PAGE};
  min-height: 100vh;
`;

const SidebarWrapper = styled.div`
  width: 250px;
  background: ${BACKGROUND_CARD};
  border-right: 1px solid ${BORDER_COLOR};
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  overflow-y: auto;

  @media (max-width: 768px) {
    width: auto;
  }
`;

const ContentArea = styled.div`
  flex: 1;
  padding-left: 250px;
  display: flex;
  flex-direction: column;
  background: ${BACKGROUND_PAGE};
`;

const InnerContent = styled.div`
  padding: ${props => props.theme.spacing.xl};
  width: 100%;
  max-width: 700px;
  margin: 0 auto;
  color: ${TEXT_COLOR_DARK};
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: ${TEXT_COLOR_MUTED};
  font-size: 14px;
  margin-bottom: 16px;
  transition: 0.2s;

  &:hover {
    color: ${TEXT_COLOR_DARK};
  }
`;

const Title = styled.h1`
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: ${TEXT_COLOR_DARK};
`;

const Subtitle = styled.p`
  color: ${TEXT_COLOR_MUTED};
  margin-bottom: 24px;
`;

const FormCard = styled.form`
  background: ${BACKGROUND_CARD};
  padding: 28px;
  border-radius: 12px;
  border: 1px solid ${BORDER_COLOR};
  box-shadow: ${props => props.theme.mode === 'dark' ? '0 4px 20px rgba(0,0,0,0.4)' : '0 1px 4px rgba(0,0,0,0.08)'};
  display: flex;
  flex-direction: column;
  gap: 28px;
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
`;

const FieldError = styled.p`
  color: ${props => props.theme.mode === 'dark' ? '#f87171' : '#dc2626'};
  font-size: 14px;
  margin-top: 4px;
`;

const MessageBox = styled.div<{ type: 'error' | 'success' }>`
  padding: 14px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
  align-items: center;
  background: ${(p) => (p.type === 'error'
    ? (p.theme.mode === 'dark' ? 'rgba(239, 68, 68, 0.15)' : '#fee2e2')
    : (p.theme.mode === 'dark' ? 'rgba(16, 185, 129, 0.15)' : '#d1fae5'))};
  border: 1px solid ${(p) => (p.type === 'error'
    ? (p.theme.mode === 'dark' ? 'rgba(239, 68, 68, 0.3)' : '#fecaca')
    : (p.theme.mode === 'dark' ? 'rgba(16, 185, 129, 0.3)' : '#a7f3d0'))};
  color: ${(p) => (p.type === 'error'
    ? (p.theme.mode === 'dark' ? '#fca5a5' : '#991b1b')
    : (p.theme.mode === 'dark' ? '#6ee7b7' : '#065f46'))};
`;

const StyledInput = styled.input`
  width: 100%;
  max-width: 100%;
  padding: 10px 14px;
  border: 1.5px solid ${BORDER_COLOR};
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  background: ${BACKGROUND_CARD};
  color: ${TEXT_COLOR_DARK};
  transition: all 0.2s ease-in-out;
  outline: none;
  box-sizing: border-box;
  margin: 0;

  &:focus {
    border-color: ${PRIMARY_COLOR};
    box-shadow: 0 0 0 3px ${props => props.theme.mode === 'dark' ? 'rgba(0, 170, 0, 0.2)' : 'rgba(59, 130, 246, 0.1)'};
    background: ${BACKGROUND_CARD};
  }

  &:hover:not(:disabled) {
    border-color: ${props => props.theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : '#d1d5db'};
  }

  &::placeholder {
    color: ${TEXT_COLOR_MUTED};
    opacity: 0.6;
  }

  &:disabled {
    background-color: ${props => props.theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#f9fafb'};
    color: ${TEXT_COLOR_MUTED};
    cursor: not-allowed;
    opacity: 0.7;
    border-color: ${BORDER_COLOR};
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

  &[type="url"] {
    font-family: inherit;
  }
`;

const StyledTextarea = styled.textarea`
  width: 100%;
  max-width: 100%;
  padding: 10px 14px;
  border: 1.5px solid ${BORDER_COLOR};
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  background: ${BACKGROUND_CARD};
  color: ${TEXT_COLOR_DARK};
  transition: all 0.2s ease-in-out;
  outline: none;
  box-sizing: border-box;
  margin: 0;
  resize: vertical;
  min-height: 100px;

  &:focus {
    border-color: ${PRIMARY_COLOR};
    box-shadow: 0 0 0 3px ${props => props.theme.mode === 'dark' ? 'rgba(0, 170, 0, 0.2)' : 'rgba(59, 130, 246, 0.1)'};
    background: ${BACKGROUND_CARD};
  }

  &:hover:not(:disabled) {
    border-color: ${props => props.theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : '#d1d5db'};
  }

  &::placeholder {
    color: ${TEXT_COLOR_MUTED};
    opacity: 0.6;
  }

  &:disabled {
    background-color: ${props => props.theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#f9fafb'};
    color: ${TEXT_COLOR_MUTED};
    cursor: not-allowed;
    opacity: 0.7;
    border-color: ${BORDER_COLOR};
  }
`;

const StyledSelect = styled.select`
  width: 100%;
  max-width: 100%;
  padding: 10px 14px;
  border: 1.5px solid ${BORDER_COLOR};
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  background: ${BACKGROUND_CARD};
  color: ${TEXT_COLOR_DARK};
  transition: all 0.2s ease-in-out;
  outline: none;
  box-sizing: border-box;
  margin: 0;
  cursor: pointer;

  &:focus {
    border-color: ${PRIMARY_COLOR};
    box-shadow: 0 0 0 3px ${props => props.theme.mode === 'dark' ? 'rgba(0, 170, 0, 0.2)' : 'rgba(59, 130, 246, 0.1)'};
    background: ${BACKGROUND_CARD};
  }

  &:hover:not(:disabled) {
    border-color: ${props => props.theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : '#d1d5db'};
  }

  &:disabled {
    background-color: ${props => props.theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#f9fafb'};
    color: ${TEXT_COLOR_MUTED};
    cursor: not-allowed;
    opacity: 0.7;
    border-color: ${BORDER_COLOR};
  }
`;

const GridRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 28px;
  width: 100%;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 28px;
  }
`;

const CheckboxWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  
  input[type="checkbox"] {
    width: 16px;
    height: 16px;
    cursor: pointer;
  }
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 16px;
  justify-content: space-between;
  padding-top: 12px;
  margin-top: 8px;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 16px;
`;

const Spinner = styled(Loader2)`
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

export default function EditExpensePage() {
  const theme = useTheme();
  const router = useRouter();
  const params = useParams();
  const expenseId = params?.id ? parseInt(params.id as string, 10) : null;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  type ExpenseFormValues = z.infer<typeof ExpenseSchema>;

  interface ApiExpense {
    id: number;
    title: string;
    description?: string | null;
    category: string;
    amount: number;
    vendor?: string | null;
    date?: string;
    is_recurring?: boolean;
    recurring_frequency?: string | null;
    attachment_url?: string | null;
  }

  const formResolver = zodResolver(ExpenseSchema) as unknown as Resolver<
    ExpenseFormValues,
    unknown,
    ExpenseFormValues
  >;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<ExpenseFormValues>({
    resolver: formResolver,
    defaultValues: {
      isRecurring: false,
    },
  });

  const isRecurring = watch('isRecurring');

  const loadExpense = useCallback(async () => {
    if (!expenseId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.getExpense(expenseId);
      const expense = response.data as unknown as ApiExpense;

      if (!expense) {
        setError('Expense not found');
        return;
      }

      // Format date for input field (YYYY-MM-DD)
      const expenseDate = expense.date ? new Date(expense.date).toISOString().split('T')[0] : '';

      const recurringFrequency = (['monthly', 'quarterly', 'yearly'].includes(expense.recurring_frequency || '')
        ? expense.recurring_frequency
        : undefined) as ExpenseFormValues['recurringFrequency'];

      reset({
        title: expense.title ?? '',
        description: expense.description ?? '',
        category: (expense.category as ExpenseFormValues['category']) ?? 'other',
        amount: expense.amount ?? 0,
        vendor: expense.vendor ?? '',
        date: expenseDate,
        isRecurring: expense.is_recurring ?? false,
        recurringFrequency,
        attachmentUrl: expense.attachment_url ?? '',
      });
    } catch (err: unknown) {
      const errorMessage =
        (err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined) || 'Failed to load expense';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [expenseId, reset]);

  useEffect(() => {
    if (expenseId) {
      loadExpense();
    }
  }, [expenseId, loadExpense]);

  const onSubmit = async (data: ExpenseFormValues) => {
    if (!expenseId) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // Format date for API
      const expenseDate = new Date(data.date).toISOString();

      const expenseData = {
        title: data.title,
        description: data.description,
        amount: data.amount,
        category: data.category,
        vendor: data.vendor || null,
        date: expenseDate,
        is_recurring: data.isRecurring || false,
        recurring_frequency: data.isRecurring ? data.recurringFrequency : null,
        attachment_url: data.attachmentUrl || null,
      };

      await apiClient.updateExpense(expenseId, expenseData);
      setSuccess('Expense updated successfully!');
      toast.success('Expense updated successfully!');

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/expenses/list');
      }, 2000);
    } catch (err: unknown) {
      const errorMessage =
        (err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined) ||
        (err instanceof Error ? err.message : 'Failed to update expense');
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <LayoutWrapper>
        <SidebarWrapper>
          <Sidebar />
        </SidebarWrapper>
        <ContentArea>
          <Navbar />
          <LoadingContainer>
            <Spinner size={32} style={{ color: PRIMARY_COLOR({ theme }) }} />
            <p>Loading expense...</p>
          </LoadingContainer>
        </ContentArea>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper>
      <SidebarWrapper>
        <Sidebar />
      </SidebarWrapper>
      <ContentArea>
        <Navbar />
        <InnerContent>
          <BackLink href="/expenses/list">
            <ArrowLeft size={16} />
            Back to Expenses
          </BackLink>

          <Title>
            <DollarSign className="h-8 w-8" style={{ color: PRIMARY_COLOR({ theme }) }} />
            Edit Expense
          </Title>
          <Subtitle>Update expense information</Subtitle>

          {error && (
            <MessageBox type="error">
              <AlertCircle size={18} />
              {error}
            </MessageBox>
          )}

          {success && (
            <MessageBox type="success">
              <CheckCircle size={18} />
              {success}
            </MessageBox>
          )}

          <FormCard onSubmit={handleSubmit(onSubmit)}>
            <FormGroup>
              <Label htmlFor="title">Title </Label>
              <StyledInput
                id="title"
                {...register('title')}
                placeholder="e.g., Office Supplies"
                disabled={submitting}
              />
              {errors.title && <FieldError>{errors.title.message}</FieldError>}
            </FormGroup>

            <FormGroup>
              <Label htmlFor="description">Description </Label>
              <StyledTextarea
                id="description"
                {...register('description')}
                placeholder="Brief description of the expense"
                disabled={submitting}
                rows={3}
              />
              {errors.description && <FieldError>{errors.description.message}</FieldError>}
            </FormGroup>

            <GridRow>
              <FormGroup>
                <Label htmlFor="category">Category </Label>
                <StyledSelect
                  id="category"
                  {...register('category')}
                  disabled={submitting}
                >
                  <option value="">Select a category</option>
                  <option value="salary">Salary</option>
                  <option value="rent">Rent</option>
                  <option value="utilities">Utilities</option>
                  <option value="marketing">Marketing</option>
                  <option value="equipment">Equipment</option>
                  <option value="travel">Travel</option>
                  <option value="supplies">Supplies</option>
                  <option value="insurance">Insurance</option>
                  <option value="taxes">Taxes</option>
                  <option value="other">Other</option>
                </StyledSelect>
                {errors.category && <FieldError>{errors.category.message}</FieldError>}
              </FormGroup>

              <FormGroup>
                <Label htmlFor="amount">Amount </Label>
                <StyledInput
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  {...register('amount', { valueAsNumber: true })}
                  placeholder="0.00"
                  disabled={submitting}
                />
                {errors.amount && <FieldError>{errors.amount.message}</FieldError>}
              </FormGroup>
            </GridRow>

            <FormGroup>
              <Label htmlFor="vendor">Vendor (Optional)</Label>
              <StyledInput
                id="vendor"
                {...register('vendor')}
                placeholder="Vendor name"
                disabled={submitting}
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="date">Date </Label>
              <StyledInput
                id="date"
                type="date"
                {...register('date')}
                disabled={submitting}
              />
              {errors.date && <FieldError>{errors.date.message as string}</FieldError>}
            </FormGroup>

            <CheckboxWrapper>
              <input
                id="isRecurring"
                type="checkbox"
                {...register('isRecurring')}
                disabled={submitting}
              />
              <Label htmlFor="isRecurring" style={{ cursor: 'pointer', margin: 0 }}>
                Recurring expense
              </Label>
            </CheckboxWrapper>

            {isRecurring && (
              <FormGroup>
                <Label htmlFor="recurringFrequency">Recurring Frequency </Label>
                <StyledSelect
                  id="recurringFrequency"
                  {...register('recurringFrequency')}
                  disabled={submitting}
                >
                  <option value="">Select frequency</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </StyledSelect>
                {errors.recurringFrequency && <FieldError>{errors.recurringFrequency.message}</FieldError>}
              </FormGroup>
            )}

            <FormGroup>
              <Label htmlFor="attachmentUrl">Attachment URL (Optional)</Label>
              <StyledInput
                id="attachmentUrl"
                type="url"
                {...register('attachmentUrl')}
                placeholder="https://example.com/receipt.pdf"
                disabled={submitting}
              />
              {errors.attachmentUrl && <FieldError>{errors.attachmentUrl.message}</FieldError>}
            </FormGroup>

            <ButtonRow>
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push('/expenses/list')}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Expense'
                )}
              </Button>
            </ButtonRow>
          </FormCard>
        </InnerContent>
      </ContentArea>
    </LayoutWrapper>
  );
}

