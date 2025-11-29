'use client';
import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/common/Navbar';
import Sidebar from '@/components/common/Sidebar';
import apiClient from '@/lib/api';
import { toast } from 'sonner';
import { ArrowLeft, DollarSign, Loader2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Expense {
  id: number;
  title: string;
  description?: string | null;
  category: string;
  amount: number;
  vendor?: string | null;
  date: string;
  is_recurring: boolean;
  recurring_frequency?: string | null;
  is_approved: boolean;
}

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

const FormCard = styled.div`
  background: #fff;
  padding: 28px;
  border-radius: 12px;
  border: 2px solid #fecaca;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
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

const WarningBox = styled.div`
  display: flex;
  align-items: start;
  gap: 16px;
  margin-bottom: 24px;
  padding: 16px;
  background: #fef2f2;
  border-radius: 8px;
`;

const WarningIcon = styled.div`
  padding: 12px;
  background: #fee2e2;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const WarningText = styled.div`
  flex: 1;
  
  h2 {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 8px;
    color: var(--foreground);
  }
  
  p {
    color: var(--muted-foreground);
    font-size: 14px;
  }
`;

const ExpenseDetails = styled.div`
  background: #f9fafb;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 24px;
  
  > div {
    margin-bottom: 8px;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
`;

const DetailRow = styled.div`
  display: flex;
  gap: 8px;
  
  .label {
    font-weight: 600;
    color: var(--foreground);
  }
  
  .value {
    color: var(--muted-foreground);
  }
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 12px;
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

const StatusBadge = styled.span<{ $approved: boolean }>`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  background: ${(p) => (p.$approved ? '#d1fae5' : '#fef3c7')};
  color: ${(p) => (p.$approved ? '#065f46' : '#92400e')};
`;

const RecurringBadge = styled.span`
  margin-left: 8px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  background: #dbeafe;
  color: #1e40af;
`;

export default function DeleteExpensePage() {
  const router = useRouter();
  const params = useParams();
  const expenseId = params?.id ? parseInt(params.id as string, 10) : null;
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expense, setExpense] = useState<Expense | null>(null);

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
      const foundExpense = response.data;
      
      if (!foundExpense) {
        setError('Expense not found');
        return;
      }

      setExpense(foundExpense);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to load expense';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!expenseId || !expense) return;

    if (!confirm(`Are you sure you want to delete "${expense.title}"? This action cannot be undone.`)) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      await apiClient.deleteExpense(expenseId);
      toast.success('Expense deleted successfully!');
      
      // Redirect after 1 second
      setTimeout(() => {
        router.push('/expenses/list');
      }, 1000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to delete expense';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setDeleting(false);
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

  if (!expense) {
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
            <MessageBox type="error">
              <AlertTriangle size={18} />
              {error || 'Expense not found'}
            </MessageBox>
          </InnerContent>
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
            <DollarSign className="h-8 w-8" style={{ color: '#dc2626' }} />
            Delete Expense
          </Title>
          <Subtitle>Confirm deletion of expense</Subtitle>

          {error && (
            <MessageBox type="error">
              <AlertTriangle size={18} />
              {error}
            </MessageBox>
          )}

          <FormCard>
            <WarningBox>
              <WarningIcon>
                <AlertTriangle size={24} style={{ color: '#dc2626' }} />
              </WarningIcon>
              <WarningText>
                <h2>Are you sure you want to delete this expense?</h2>
                <p>
                  This action cannot be undone. All data associated with this expense will be permanently deleted.
                </p>
              </WarningText>
            </WarningBox>

            <ExpenseDetails>
              <DetailRow>
                <span className="label">Title:</span>
                <span className="value">{expense.title}</span>
              </DetailRow>
              {expense.description && (
                <DetailRow>
                  <span className="label">Description:</span>
                  <span className="value">{expense.description}</span>
                </DetailRow>
              )}
              <DetailRow>
                <span className="label">Category:</span>
                <span className="value" style={{ textTransform: 'capitalize' }}>{expense.category}</span>
              </DetailRow>
              <DetailRow>
                <span className="label">Amount:</span>
                <span className="value" style={{ fontWeight: 600 }}>{formatCurrency(expense.amount)}</span>
              </DetailRow>
              {expense.vendor && (
                <DetailRow>
                  <span className="label">Vendor:</span>
                  <span className="value">{expense.vendor}</span>
                </DetailRow>
              )}
              <DetailRow>
                <span className="label">Date:</span>
                <span className="value">{formatDate(expense.date)}</span>
              </DetailRow>
              <DetailRow>
                <span className="label">Status:</span>
                <span className="value">
                  <StatusBadge $approved={expense.is_approved}>
                    {expense.is_approved ? 'Approved' : 'Pending'}
                  </StatusBadge>
                  {expense.is_recurring && (
                    <RecurringBadge>
                      Recurring ({expense.recurring_frequency})
                    </RecurringBadge>
                  )}
                </span>
              </DetailRow>
            </ExpenseDetails>

            <ButtonRow>
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push('/expenses/list')}
                disabled={deleting}
                style={{ flex: 1 }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
                style={{ flex: 1 }}
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Delete Expense
                  </>
                )}
              </Button>
            </ButtonRow>
          </FormCard>
        </InnerContent>
      </ContentArea>
    </LayoutWrapper>
  );
}

