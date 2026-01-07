'use client';
import { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RevenueSchema, type RevenueInput } from '@/lib/validation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Navbar from '@/components/common/Navbar';
import Sidebar from '@/components/common/Sidebar';
import apiClient from '@/lib/api';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, DollarSign, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

type RevenueApiResponse = Partial<RevenueInput> & {
  id?: number;
  is_recurring?: boolean;
  recurring_frequency?: RevenueInput['recurringFrequency'] | null;
  attachment_url?: string | null;
  date?: string;
};

// ──────────────────────────────────────────
// Styled Components Layout
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
  background: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.textDark};
  transition: all 0.2s ease-in-out;
  outline: none;
  box-sizing: border-box;
  margin: 0;
  resize: vertical;
  min-height: 100px;

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

const StyledSelect = styled.select`
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
  cursor: pointer;

  &:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    background: ${props => props.theme.colors.background};
  }

  &:hover:not(:disabled) {
    border-color: #d1d5db;
  }

  &:disabled {
    background-color: ${theme.colors.backgroundSecondary};
    color: #6b7280;
    cursor: not-allowed;
    opacity: 0.7;
    border-color: #e5e7eb;
  }
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 16px;
  justify-content: space-between;
  padding-top: 12px;
  margin-top: 8px;
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

const LoadingContainer = styled.div`
  padding: 32px;
  text-align: center;
  
  p {
    color: var(--muted-foreground);
    margin-top: 16px;
  }
`;

export default function EditRevenuePage() {
  const router = useRouter();
  const params = useParams();
  const revenueId = params?.id ? parseInt(params.id as string, 10) : null;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const getErrorMessage = useCallback((err: unknown, fallback: string) => {
    if (typeof err === 'object' && err !== null) {
      const errorObj = err as { response?: { data?: { detail?: string } }; message?: string };
      return errorObj.response?.data?.detail || errorObj.message || fallback;
    }
    if (err instanceof Error) return err.message;
    return fallback;
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<RevenueInput>({
    resolver: zodResolver(RevenueSchema),
    defaultValues: {
      isRecurring: false,
      category: 'other' as const,
    },
  });

  const isRecurring = watch('isRecurring');

  const loadRevenue = useCallback(async () => {
    if (!revenueId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.getRevenue(revenueId);
      const revenue = response.data as RevenueApiResponse;
      
      if (!revenue) {
        setError('Revenue entry not found');
        return;
      }

      const revenueDate = revenue.date ? new Date(revenue.date).toISOString().split('T')[0] : '';
      
      reset({
        title: revenue.title || '',
        description: revenue.description || '',
        category: revenue.category || 'other',
        amount: revenue.amount || 0,
        source: revenue.source || '',
        date: revenueDate,
        isRecurring: revenue.is_recurring || false,
        recurringFrequency: revenue.recurring_frequency || undefined,
        attachmentUrl: revenue.attachment_url || '',
      });
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, 'Failed to load revenue entry');
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [getErrorMessage, reset, revenueId]);

  useEffect(() => {
    if (revenueId) {
      loadRevenue();
    }
  }, [loadRevenue, revenueId]);

  const onSubmit = async (data: RevenueInput) => {
    if (!revenueId) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // Format date for API
      const revenueDate = new Date(data.date).toISOString();
      
      const revenueData = {
        title: data.title,
        description: data.description || null,
        amount: data.amount,
        category: data.category,
        source: data.source || null,
        date: revenueDate,
        is_recurring: data.isRecurring || false,
        recurring_frequency: data.isRecurring ? data.recurringFrequency : null,
        attachment_url: data.attachmentUrl || null,
      };

      await apiClient.updateRevenue(revenueId, revenueData);
      setSuccess('Revenue entry updated successfully!');
      toast.success('Revenue entry updated successfully!');
      
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/revenue/list');
      }, 2000);
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, 'Failed to update revenue entry');
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
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p>Loading revenue entry...</p>
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
          <BackLink href="/revenue/list">
            <ArrowLeft size={16} />
            Back to Revenue
          </BackLink>

          <Title>
            <DollarSign className="h-8 w-8 text-primary" />
            Edit Revenue Entry
          </Title>
          <Subtitle>Update revenue entry information</Subtitle>

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
                placeholder="e.g., Product Sales"
                disabled={submitting}
              />
              {errors.title && <FieldError>{errors.title.message}</FieldError>}
            </FormGroup>

            <FormGroup>
              <Label htmlFor="description">Description (Optional)</Label>
              <StyledTextarea
                id="description"
                {...register('description')}
                placeholder="Brief description of the revenue"
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
                  <option value="sales">Sales</option>
                  <option value="services">Services</option>
                  <option value="investment">Investment</option>
                  <option value="rental">Rental</option>
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
              <Label htmlFor="source">Source (Optional)</Label>
              <StyledInput
                id="source"
                {...register('source')}
                placeholder="e.g., Customer name or company"
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
                Recurring revenue
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
                placeholder="https://example.com/invoice.pdf"
                disabled={submitting}
              />
              {errors.attachmentUrl && <FieldError>{errors.attachmentUrl.message}</FieldError>}
            </FormGroup>

            <ButtonRow>
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push('/revenue/list')}
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
                  'Update Revenue Entry'
                )}
              </Button>
            </ButtonRow>
          </FormCard>
        </InnerContent>
      </ContentArea>
    </LayoutWrapper>
  );
}

