'use client';
import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/common/Navbar';
import Sidebar from '@/components/common/Sidebar';
import apiClient from '@/lib/api';
import { toast } from 'sonner';
import { ArrowLeft, DollarSign, Loader2, AlertTriangle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/utils';

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

const Card = styled.div`
  background: #fff;
  padding: 28px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
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

const WarningSection = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 24px;
  
  .icon-wrapper {
    padding: 12px;
    background: #fee2e2;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  h2 {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 8px;
    color: var(--foreground);
  }
  
  p {
    color: var(--muted-foreground);
    margin-bottom: 16px;
  }
`;

const InfoBox = styled.div`
  background: var(--muted);
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 24px;
  
  div {
    margin-bottom: 8px;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    span:first-child {
      font-weight: 500;
      color: var(--foreground);
      margin-right: 8px;
    }
    
    span:last-child {
      color: var(--muted-foreground);
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
  margin-right: 8px;
`;

const RecurringBadge = styled.span`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  background: #dbeafe;
  color: #1e40af;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 12px;
`;

const LoadingContainer = styled.div`
  padding: 32px;
  text-align: center;
  
  p {
    color: var(--muted-foreground);
    margin-top: 16px;
  }
`;

interface Revenue {
  id: number;
  title: string;
  description?: string | null;
  category: string;
  amount: number;
  source?: string | null;
  date: string;
  is_recurring: boolean;
  recurring_frequency?: string | null;
  is_approved: boolean;
}

export default function DeleteRevenuePage() {
  const router = useRouter();
  const params = useParams();
  const revenueId = params?.id ? parseInt(params.id as string, 10) : null;
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revenue, setRevenue] = useState<Revenue | null>(null);

  useEffect(() => {
    if (revenueId) {
      loadRevenue();
    }
  }, [revenueId]);

  const loadRevenue = async () => {
    if (!revenueId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.getRevenue(revenueId);
      const foundRevenue = response.data;
      
      if (!foundRevenue) {
        setError('Revenue entry not found');
        return;
      }

      setRevenue(foundRevenue);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to load revenue entry';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!revenueId || !revenue) return;

    if (!confirm(`Are you sure you want to delete "${revenue.title}"? This action cannot be undone.`)) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      await apiClient.deleteRevenue(revenueId);
      toast.success('Revenue entry deleted successfully!');
      
      // Redirect after 1 second
      setTimeout(() => {
        router.push('/revenue/list');
      }, 1000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to delete revenue entry';
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
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p>Loading revenue entry...</p>
          </LoadingContainer>
        </ContentArea>
      </LayoutWrapper>
    );
  }

  if (!revenue) {
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
            <Card>
              <MessageBox type="error">
                <AlertTriangle size={18} />
                {error || 'Revenue entry not found'}
              </MessageBox>
            </Card>
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
          <BackLink href="/revenue/list">
            <ArrowLeft size={16} />
            Back to Revenue
          </BackLink>

          <Title>
            <DollarSign className="h-8 w-8 text-red-600" />
            Delete Revenue Entry
          </Title>
          <Subtitle>Confirm deletion of revenue entry</Subtitle>

          {error && (
            <MessageBox type="error">
              <AlertCircle size={18} />
              {error}
            </MessageBox>
          )}

          <Card>
            <WarningSection>
              <div className="icon-wrapper">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div style={{ flex: 1 }}>
                <h2>Are you sure you want to delete this revenue entry?</h2>
                <p>This action cannot be undone. All data associated with this revenue entry will be permanently deleted.</p>
              </div>
            </WarningSection>

            <InfoBox>
              <div>
                <span>Title:</span>
                <span>{revenue.title}</span>
              </div>
              {revenue.description && (
                <div>
                  <span>Description:</span>
                  <span>{revenue.description}</span>
                </div>
              )}
              <div>
                <span>Category:</span>
                <span style={{ textTransform: 'capitalize' }}>{revenue.category}</span>
              </div>
              <div>
                <span>Amount:</span>
                <span style={{ fontWeight: 600, color: '#16a34a' }}>{formatCurrency(revenue.amount)}</span>
              </div>
              {revenue.source && (
                <div>
                  <span>Source:</span>
                  <span>{revenue.source}</span>
                </div>
              )}
              <div>
                <span>Date:</span>
                <span>{formatDate(revenue.date)}</span>
              </div>
              <div>
                <span>Status:</span>
                <StatusBadge $approved={revenue.is_approved}>
                  {revenue.is_approved ? 'Approved' : 'Pending'}
                </StatusBadge>
                {revenue.is_recurring && (
                  <RecurringBadge>
                    Recurring ({revenue.recurring_frequency})
                  </RecurringBadge>
                )}
              </div>
            </InfoBox>

            <ButtonRow>
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push('/revenue/list')}
                disabled={deleting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1"
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Delete Revenue Entry
                  </>
                )}
              </Button>
            </ButtonRow>
          </Card>
        </InnerContent>
      </ContentArea>
    </LayoutWrapper>
  );
}

