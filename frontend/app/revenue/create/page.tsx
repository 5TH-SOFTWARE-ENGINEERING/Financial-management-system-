'use client';
import { useState } from 'react';
import styled from 'styled-components';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RevenueSchema, type RevenueInput } from '@/lib/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Navbar from '@/components/common/Navbar';
import Sidebar from '@/components/common/Sidebar';
import apiClient from '@/lib/api';
import { useRouter } from 'next/navigation';
import { ArrowLeft, DollarSign, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

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
  gap: 22px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
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

const ButtonRow = styled.div`
  display: flex;
  gap: 12px;
  padding-top: 12px;
`;

const GridRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
  font-size: 14px;
  color: var(--foreground);
  
  &:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
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

export default function CreateRevenuePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

  const onSubmit = async (data: RevenueInput) => {
    setLoading(true);
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

      await apiClient.createRevenue(revenueData);
      setSuccess('Revenue entry created successfully!');
      toast.success('Revenue entry created successfully!');
      reset();
      
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/revenue/list');
      }, 2000);
    } catch (err: any) {
      let errorMessage = 'Failed to create revenue entry';
      
      // Handle different error formats
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        
        // If it's an array of validation errors (Pydantic format)
        if (Array.isArray(detail)) {
          errorMessage = detail.map((e: any) => {
            if (typeof e === 'string') return e;
            if (e.msg) return `${e.loc?.join('.') || 'Field'}: ${e.msg}`;
            return JSON.stringify(e);
          }).join(', ');
        }
        // If it's a single validation error object
        else if (typeof detail === 'object' && detail.msg) {
          errorMessage = `${detail.loc?.join('.') || 'Field'}: ${detail.msg}`;
        }
        // If it's a string
        else if (typeof detail === 'string') {
          errorMessage = detail;
        }
        // Otherwise stringify it
        else {
          errorMessage = JSON.stringify(detail);
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

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
            Create Revenue Entry
          </Title>
          <Subtitle>Add a new revenue entry</Subtitle>

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
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                {...register('title')}
                placeholder="e.g., Product Sales"
                disabled={loading}
              />
              {errors.title && <FieldError>{errors.title.message}</FieldError>}
            </FormGroup>

            <FormGroup>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Brief description of the revenue"
                disabled={loading}
                rows={3}
              />
              {errors.description && <FieldError>{errors.description.message}</FieldError>}
            </FormGroup>

            <GridRow>
              <FormGroup>
                <Label htmlFor="category">Category *</Label>
                <Select
                  id="category"
                  {...register('category')}
                  disabled={loading}
                >
                  <option value="sales">Sales</option>
                  <option value="services">Services</option>
                  <option value="investment">Investment</option>
                  <option value="rental">Rental</option>
                  <option value="other">Other</option>
                </Select>
                {errors.category && <FieldError>{errors.category.message}</FieldError>}
              </FormGroup>

              <FormGroup>
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  {...register('amount', { valueAsNumber: true })}
                  placeholder="0.00"
                  disabled={loading}
                />
                {errors.amount && <FieldError>{errors.amount.message}</FieldError>}
              </FormGroup>
            </GridRow>

            <FormGroup>
              <Label htmlFor="source">Source (Optional)</Label>
              <Input
                id="source"
                {...register('source')}
                placeholder="e.g., Customer name or company"
                disabled={loading}
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                {...register('date')}
                disabled={loading}
              />
              {errors.date && <FieldError>{errors.date.message as string}</FieldError>}
            </FormGroup>

            <CheckboxWrapper>
              <input
                id="isRecurring"
                type="checkbox"
                {...register('isRecurring')}
                disabled={loading}
              />
              <Label htmlFor="isRecurring" style={{ cursor: 'pointer', margin: 0 }}>
                Recurring revenue
              </Label>
            </CheckboxWrapper>

            {isRecurring && (
              <FormGroup>
                <Label htmlFor="recurringFrequency">Recurring Frequency *</Label>
                <Select
                  id="recurringFrequency"
                  {...register('recurringFrequency')}
                  disabled={loading}
                >
                  <option value="">Select frequency</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </Select>
                {errors.recurringFrequency && <FieldError>{errors.recurringFrequency.message}</FieldError>}
              </FormGroup>
            )}

            <FormGroup>
              <Label htmlFor="attachmentUrl">Attachment URL (Optional)</Label>
              <Input
                id="attachmentUrl"
                type="url"
                {...register('attachmentUrl')}
                placeholder="https://example.com/invoice.pdf"
                disabled={loading}
              />
              {errors.attachmentUrl && <FieldError>{errors.attachmentUrl.message}</FieldError>}
            </FormGroup>

            <ButtonRow>
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push('/revenue/list')}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Revenue Entry'
                )}
              </Button>
            </ButtonRow>
          </FormCard>
        </InnerContent>
      </ContentArea>
    </LayoutWrapper>
  );
}
