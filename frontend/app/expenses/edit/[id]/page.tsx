'use client';
import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ExpenseSchema, type ExpenseInput } from '@/lib/validation';
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
// Styled Components
// ──────────────────────────────────────────
const LayoutWrapper = styled.div`
  display: flex;
  background: #f5f6fa;
  min-height: 100vh;
`;

const SidebarWrapper = styled.div`
  width: 250px;
  background: var(--card);
  border-right: 1px solid var(--border);
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
`;

const InnerContent = styled.div`
  padding: 32px;
  width: 100%;
  max-width: 700px;
  margin: 0 auto;
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--muted-foreground);
  font-size: 14px;
  margin-bottom: 16px;
  transition: 0.2s;

  &:hover {
    color: var(--foreground);
  }
`;

const Title = styled.h1`
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Subtitle = styled.p`
  color: var(--muted-foreground);
  margin-bottom: 24px;
`;

const FormCard = styled.form`
  background: #fff;
  padding: 28px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
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
  color: #dc2626;
  font-size: 14px;
  margin-top: 4px;
`;

const HelpText = styled.p`
  margin-top: 4px;
  font-size: 13px;
  color: var(--muted-foreground);
`;

const MessageBox = styled.div<{ type: 'error' | 'success' }>`
  padding: 14px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
  align-items: center;
  background: ${(p) => (p.type === 'error' ? '#fee2e2' : '#d1fae5')};
  border: 1px solid ${(p) => (p.type === 'error' ? '#fecaca' : '#a7f3d0')};
  color: ${(p) => (p.type === 'error' ? '#991b1b' : '#065f46')};
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

  &[type="url"] {
    font-family: inherit;
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
  const router = useRouter();
  const params = useParams();
  const expenseId = params?.id ? parseInt(params.id as string, 10) : null;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    resolver: zodResolver(ExpenseSchema),
    defaultValues: {
      isRecurring: false,
    },
  });

  const isRecurring = watch('isRecurring');

  useEffect(() => {
    if (expenseId) {
      loadExpense();
    }
  }, [expenseId]);

  const loadExpense = async () => {
    if (!expenseId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.getExpense(expenseId);
      const expense = response.data;
      
      if (!expense) {
        setError('Expense not found');
        return;
      }

      // Format date for input field (YYYY-MM-DD)
      const expenseDate = expense.date ? new Date(expense.date).toISOString().split('T')[0] : '';
      
      reset({
        title: expense.title || '',
        description: expense.description || '',
        category: expense.category || '',
        amount: expense.amount || 0,
        vendor: expense.vendor || '',
        date: expenseDate,
        isRecurring: expense.is_recurring || false,
        recurringFrequency: expense.recurring_frequency || undefined,
        attachmentUrl: expense.attachment_url || '',
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to load expense';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: any) => {
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
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to update expense';
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
            <Spinner size={32} />
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
            <DollarSign className="h-8 w-8 text-primary" />
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

