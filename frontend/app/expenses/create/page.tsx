'use client';
import { useState } from 'react';
import styled from 'styled-components';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ExpenseSchema, type ExpenseInput } from '@/lib/validation';
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
import { useAuth } from '@/lib/rbac/auth-context';

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

export default function CreateExpensePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
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

  const onSubmit = async (data: any) => {
    setLoading(true);
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

      await apiClient.createExpense(expenseData);
      setSuccess('Expense created successfully!');
      toast.success('Expense created successfully!');
      reset();
      
      // Redirect after 2 seconds
      // Employees go to dashboard, others go to expenses list
      setTimeout(() => {
        const userRole = user?.role?.toLowerCase();
        if (userRole === 'employee') {
          router.push('/dashboard');
        } else {
          router.push('/expenses/list');
        }
      }, 2000);
    } catch (err: any) {
      let errorMessage = 'Failed to create expense';
      
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
          <BackLink href="/expenses/list">
            <ArrowLeft size={16} />
            Back to Expenses
          </BackLink>

          <Title>
            <DollarSign className="h-8 w-8 text-primary" />
            Create Expense
          </Title>
          <Subtitle>Add a new expense entry</Subtitle>

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
                placeholder="e.g., Office Supplies"
                disabled={loading}
              />
              {errors.title && <FieldError>{errors.title.message}</FieldError>}
            </FormGroup>

            <FormGroup>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Brief description of the expense"
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
              <Label htmlFor="vendor">Vendor (Optional)</Label>
              <Input
                id="vendor"
                {...register('vendor')}
                placeholder="Vendor name"
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
                Recurring expense
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
                placeholder="https://example.com/receipt.pdf"
                disabled={loading}
              />
              {errors.attachmentUrl && <FieldError>{errors.attachmentUrl.message}</FieldError>}
            </FormGroup>

            <ButtonRow>
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push('/expenses/list')}
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
                  'Create Expense'
                )}
              </Button>
            </ButtonRow>
          </FormCard>
        </InnerContent>
      </ContentArea>
    </LayoutWrapper>
  );
}
