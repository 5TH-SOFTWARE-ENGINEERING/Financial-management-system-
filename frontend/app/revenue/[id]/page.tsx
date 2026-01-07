'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import styled from 'styled-components';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  AlertCircle,
  User,
  Calendar,
  Building,
  FileText,
  Edit,
  Trash2,
  Loader2,
  Tag,
  ExternalLink,
} from 'lucide-react';
import Layout from '@/components/layout';
import apiClient from '@/lib/api';
import { useAuth } from '@/lib/rbac/auth-context';
import { useUserStore } from '@/store/userStore';
import { theme } from '@/components/common/theme';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { formatCurrency, formatDateTime } from '@/lib/utils';

// Type definitions for error handling
type ErrorWithDetails = {
  code?: string;
  message?: string;
  response?: {
    status: number;
    data?: {
      detail?: string;
    };
  };
};

const PRIMARY_COLOR = theme.colors.primary || '#00AA00';
const TEXT_COLOR_DARK = (props: any) => props.theme.colors.textDark;
const TEXT_COLOR_MUTED = theme.colors.textSecondary || '#666';

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
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

const HeaderSection = styled.div`
  margin-bottom: ${theme.spacing.lg};
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${theme.spacing.md};
  flex-wrap: wrap;
`;

const HeaderText = styled.div`
  flex: 1;
  
  h1 {
    font-size: clamp(24px, 3vw, 36px);
    font-weight: ${theme.typography.fontWeights.bold};
    margin: 0 0 ${theme.spacing.xs};
    color: ${TEXT_COLOR_DARK};
  }

  p {
    color: ${TEXT_COLOR_MUTED};
    font-size: ${theme.typography.fontSizes.md};
    margin: 0;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  flex-wrap: wrap;
`;

const Card = styled.div`
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  padding: ${theme.spacing.lg};
  box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.06),
    0 1px 2px -1px rgba(0, 0, 0, 0.03),
    inset 0 0 0 1px rgba(0, 0, 0, 0.02);
  margin-bottom: ${theme.spacing.lg};
`;

const CardTitle = styled.h2`
  font-size: ${theme.typography.fontSizes.lg};
  font-weight: ${theme.typography.fontWeights.bold};
  color: ${TEXT_COLOR_DARK};
  margin: 0 0 ${theme.spacing.md};
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
`;

const StatusBadge = styled.span<{ $status: boolean }>`
  display: inline-flex;
  align-items: center;
  padding: ${theme.spacing.xs} ${theme.spacing.md};
  border-radius: 999px;
  font-size: ${theme.typography.fontSizes.xs};
  font-weight: ${theme.typography.fontWeights.bold};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background-color: ${props => props.$status ? 'rgba(16, 185, 129, 0.12)' : 'rgba(251, 191, 36, 0.12)'};
  color: ${props => props.$status ? '#065f46' : '#b45309'};
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${theme.spacing.md};

  @media (min-width: 768px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const InfoItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${theme.spacing.md};
`;

const IconWrapper = styled.div`
  color: ${TEXT_COLOR_MUTED};
  flex-shrink: 0;
  margin-top: 2px;
`;

const InfoContent = styled.div`
  flex: 1;
  
  p:first-child {
    font-size: ${theme.typography.fontSizes.sm};
    color: ${TEXT_COLOR_MUTED};
    margin: 0 0 ${theme.spacing.xs};
  }

  p:last-child {
    font-size: ${theme.typography.fontSizes.sm};
    font-weight: ${theme.typography.fontWeights.medium};
    color: ${TEXT_COLOR_DARK};
    margin: 0;
    word-break: break-word;
  }
`;

const Description = styled.div`
  padding: ${theme.spacing.lg};
  background: ${theme.colors.backgroundSecondary};
  border-radius: ${theme.borderRadius.md};
  margin-top: ${theme.spacing.md};
  border-left: 3px solid ${PRIMARY_COLOR};
  transition: all ${theme.transitions.default};
  
  &:hover {
    background: ${theme.colors.background};
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }
  
  p {
    margin: 0;
    color: ${TEXT_COLOR_DARK};
    line-height: 1.7;
    font-size: ${theme.typography.fontSizes.sm};
    word-wrap: break-word;
    overflow-wrap: break-word;
    white-space: pre-wrap;
    letter-spacing: 0.01em;
    
    /* Better text rendering */
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    
    /* Handle long text gracefully */
    max-width: 100%;
  }
  
  /* Responsive adjustments */
  @media (max-width: 768px) {
    padding: ${theme.spacing.md};
    
    p {
      font-size: ${theme.typography.fontSizes.xs};
      line-height: 1.6;
    }
  }
`;

const ErrorBanner = styled.div`
  padding: ${theme.spacing.md};
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: ${theme.borderRadius.md};
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  color: #dc2626;
  margin-bottom: ${theme.spacing.md};
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

const AmountDisplay = styled.div`
  font-size: ${theme.typography.fontSizes.xxl};
  font-weight: ${theme.typography.fontWeights.bold};
  color: ${PRIMARY_COLOR};
  margin: ${theme.spacing.md} 0;
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
`;

const ModalContent = styled.div`
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  padding: ${theme.spacing.xl};
  max-width: 500px;
  width: 90%;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
`;

const ModalTitle = styled.h3`
  font-size: ${theme.typography.fontSizes.lg};
  font-weight: ${theme.typography.fontWeights.bold};
  color: ${TEXT_COLOR_DARK};
  margin: 0 0 ${theme.spacing.lg};
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: ${theme.spacing.md};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  background: ${theme.colors.background};
  color: ${TEXT_COLOR_DARK};
  font-size: ${theme.typography.fontSizes.sm};
  font-family: inherit;
  resize: vertical;
  min-height: 120px;
  margin-bottom: ${theme.spacing.md};
  
  &:focus {
    outline: none;
    border-color: ${PRIMARY_COLOR};
    box-shadow: 0 0 0 3px ${PRIMARY_COLOR}15;
  }
`;

const ModalActions = styled.div`
  display: flex;
  gap: ${theme.spacing.md};
  justify-content: flex-end;
`;

const Label = styled.label`
  display: block;
  font-size: ${theme.typography.fontSizes.sm};
  font-weight: ${theme.typography.fontWeights.medium};
  color: ${TEXT_COLOR_DARK};
  margin-bottom: ${theme.spacing.sm};
`;

const PasswordInput = styled.input`
  width: 100%;
  padding: ${theme.spacing.md};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  background: ${theme.colors.background};
  color: ${TEXT_COLOR_DARK};
  font-size: ${theme.typography.fontSizes.sm};
  font-family: inherit;
  transition: all ${theme.transitions.default};

  &:focus {
    outline: none;
    border-color: ${PRIMARY_COLOR};
    box-shadow: 0 0 0 3px ${PRIMARY_COLOR}15;
  }

  &::placeholder {
    color: ${TEXT_COLOR_MUTED};
    opacity: 0.6;
  }
`;

const FormGroup = styled.div`
  margin-bottom: ${theme.spacing.md};
`;

const ErrorText = styled.p`
  color: #dc2626;
  font-size: ${theme.typography.fontSizes.sm};
  margin: ${theme.spacing.xs} 0 0 0;
`;

const WarningBox = styled.div`
  padding: ${theme.spacing.md};
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: ${theme.borderRadius.md};
  margin-bottom: ${theme.spacing.lg};
  
  p {
    margin: 0;
    color: #dc2626;
    font-size: ${theme.typography.fontSizes.sm};
    line-height: 1.5;
  }
`;

interface RevenueDetail {
  id: number;
  title: string;
  description?: string;
  amount: number;
  category: string;
  source?: string;
  date: string;
  is_recurring: boolean;
  recurring_frequency?: string;
  attachment_url?: string;
  created_by_id: number;
  created_at: string;
  updated_at?: string;
  is_approved: boolean;
  approved_by_id?: number;
  approved_at?: string;
}

export default function RevenueDetailPage() {
  const router = useRouter();
  const params = useParams();
  const revenueId = params?.id ? parseInt(params.id as string, 10) : null;
  const { user } = useAuth();
  const { canApproveTransactions, allUsers, fetchAllUsers } = useUserStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revenue, setRevenue] = useState<RevenueDetail | null>(null);
  const [processing, setProcessing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectPassword, setRejectPassword] = useState('');
  const [rejectPasswordError, setRejectPasswordError] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletePasswordError, setDeletePasswordError] = useState<string | null>(null);
  const [relatedApprovalId, setRelatedApprovalId] = useState<number | null>(null);

  const canApprove = () => {
    if (canApproveTransactions()) return true;
    if (!user) return false;
    const role = user.role?.toLowerCase();
    return role === 'admin' || role === 'super_admin' || role === 'manager' || role === 'finance_manager';
  };

  const canEdit = () => {
    if (!revenue || !user) return false;
    const role = user.role?.toLowerCase();
    const isOwner = revenue.created_by_id === parseInt(user.id);
    const isAdmin = role === 'admin' || role === 'super_admin';
    return isOwner || isAdmin;
  };

  const loadRevenue = useCallback(async () => {
    if (!revenueId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.getRevenue(revenueId);
      setRevenue(response.data as unknown as RevenueDetail);
    } catch (err: unknown) {
      const error = err as ErrorWithDetails;
      const errorMessage = error.response?.data?.detail || 'Failed to load revenue details';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [revenueId]);

  const loadRelatedApproval = useCallback(async () => {
    if (!revenueId) return;

    try {
      // Fetch all approvals and find one linked to this revenue
      const response = await apiClient.getApprovals();
      const approvals = response.data || [];
      const relatedApproval = approvals.find((a: unknown) => {
        const approval = a as { revenue_entry_id: number; id: number };
        return approval.revenue_entry_id === revenueId;
      }) as { id: number } | undefined;
      if (relatedApproval) {
        setRelatedApprovalId(relatedApproval.id);
      }
    } catch {
      // Silently fail - approval lookup is optional
      setRelatedApprovalId(null);
    }
  }, [revenueId]);

  useEffect(() => {
    if (revenueId) {
      loadRevenue();
      loadRelatedApproval();
    }
    // Load all users for name resolution
    if (allUsers.length === 0) {
      fetchAllUsers();
    }
  }, [revenueId, allUsers.length, fetchAllUsers, loadRelatedApproval, loadRevenue]);

  const handleApprove = async () => {
    if (!revenueId || !canApprove()) {
      toast.error('You do not have permission to approve revenue');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      await apiClient.approveItem(revenueId, 'revenue');
      toast.success('Revenue entry approved successfully');
      await loadRevenue();
    } catch (err: unknown) {
      const error = err as ErrorWithDetails;
      const errorMessage = error.response?.data?.detail || 'Failed to approve revenue';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (reason: string, password: string) => {
    if (!revenueId || !canApprove()) {
      toast.error('You do not have permission to reject revenue');
      return;
    }

    if (!reason.trim()) {
      setRejectPasswordError('Please provide a rejection reason');
      return;
    }

    if (reason.trim().length < 10) {
      setRejectPasswordError('Rejection reason must be at least 10 characters long');
      return;
    }

    if (!password.trim()) {
      setRejectPasswordError('Password is required');
      return;
    }

    setProcessing(true);
    setError(null);
    setRejectPasswordError(null);

    try {
      await apiClient.rejectItem(revenueId, 'revenue', reason, password.trim());
      toast.success('Revenue entry rejected');
      setShowRejectModal(false);
      setRejectionReason('');
      setRejectPassword('');
      await loadRevenue();
    } catch (err: unknown) {
      const error = err as ErrorWithDetails;
      const errorMessage = error.response?.data?.detail || 'Failed to reject revenue';
      setRejectPasswordError(errorMessage);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (password: string) => {
    if (!revenueId || !revenue) return;

    if (!password.trim()) {
      setDeletePasswordError('Password is required');
      return;
    }

    setDeleting(true);
    setError(null);
    setDeletePasswordError(null);

    try {
      await apiClient.deleteRevenue(revenueId, password.trim());
      toast.success('Revenue entry deleted successfully');
      setShowDeleteModal(false);
      setDeletePassword('');
      router.push('/revenue/list');
    } catch (err: unknown) {
      const error = err as ErrorWithDetails;
      const errorMessage = error.response?.data?.detail || 'Failed to delete revenue';
      setDeletePasswordError(errorMessage);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  const getUserName = (userId: number) => {
    if (!allUsers || allUsers.length === 0) {
      return `User #${userId}`;
    }
    const userIdStr = userId.toString();
    const foundUser = allUsers.find((u: unknown) => {
      const user = u as { id: number | string };
      return user.id === userId ||
        user.id?.toString() === userIdStr ||
        parseInt(user.id as string) === userId;
    });
    if (!foundUser) {
      return `User #${userId}`;
    }
    const user = foundUser as { name?: string; full_name?: string; email?: string };
    return user.name ||
           user.full_name ||
           user.email ||
           `User #${userId}`;
  };

  const getCategoryDisplayName = (category: string) => {
    return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <Layout>
        <PageContainer>
          <LoadingContainer>
            <Spinner />
            <p>Loading revenue details...</p>
          </LoadingContainer>
        </PageContainer>
      </Layout>
    );
  }

  if (error && !revenue) {
    return (
      <Layout>
        <PageContainer>
          <BackLink href="/revenue/list">
            <ArrowLeft size={16} />
            Back to Revenue
          </BackLink>
          <ErrorBanner>
            <AlertCircle size={16} />
            <span>{error}</span>
          </ErrorBanner>
        </PageContainer>
      </Layout>
    );
  }

  if (!revenue) {
    return null;
  }

  return (
    <Layout>
      <PageContainer>
        <HeaderSection>
          <BackLink href="/revenue/list">
            <ArrowLeft size={16} />
            Back to Revenue
          </BackLink>
          
          <HeaderContent>
            <HeaderText>
              <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md, flexWrap: 'wrap' }}>
                <h1>{revenue.title}</h1>
                <StatusBadge $status={revenue.is_approved}>
                  {revenue.is_approved ? 'APPROVED' : 'PENDING'}
                </StatusBadge>
              </div>
              <p>Revenue Entry #{revenue.id}</p>
            </HeaderText>

            <ActionButtons>
              {!revenue.is_approved && canApprove() && (
                <>
                  <Button
                    onClick={handleApprove}
                    disabled={processing}
                    style={{ backgroundColor: PRIMARY_COLOR, color: '#fff' }}
                  >
                    {processing ? (
                      <>
                        <Loader2 size={16} style={{ marginRight: theme.spacing.sm }} className="animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={16} style={{ marginRight: theme.spacing.sm }} />
                        Approve
                      </>
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setShowRejectModal(true);
                      setRejectionReason('');
                      setRejectPassword('');
                      setRejectPasswordError(null);
                    }}
                    disabled={processing}
                  >
                    <XCircle size={16} style={{ marginRight: theme.spacing.sm }} />
                    Reject
                  </Button>
                </>
              )}
              
              {canEdit() && (
                <Button
                  variant="outline"
                  onClick={() => router.push(`/revenue/edit/${revenueId}`)}
                  disabled={processing || deleting}
                >
                  <Edit size={16} style={{ marginRight: theme.spacing.sm }} />
                  Edit
                </Button>
              )}

              {canEdit() && (
                <Button
                  variant="destructive"
                  onClick={() => {
                    setShowDeleteModal(true);
                    setDeletePassword('');
                    setDeletePasswordError(null);
                  }}
                  disabled={processing || deleting}
                >
                  <Trash2 size={16} style={{ marginRight: theme.spacing.sm }} />
                  Delete
                </Button>
              )}
            </ActionButtons>
          </HeaderContent>
        </HeaderSection>

        {error && (
          <ErrorBanner>
            <AlertCircle size={16} />
            <span>{error}</span>
          </ErrorBanner>
        )}

        <Card>
          <CardTitle>
            <DollarSign size={20} />
            Revenue Information
          </CardTitle>

          <AmountDisplay>
            {formatCurrency(revenue.amount)}
          </AmountDisplay>

          <InfoGrid>
            <InfoItem>
              <IconWrapper>
                <Tag size={20} />
              </IconWrapper>
              <InfoContent>
                <p>Category</p>
                <p>{getCategoryDisplayName(revenue.category)}</p>
              </InfoContent>
            </InfoItem>

            {revenue.source && (
              <InfoItem>
                <IconWrapper>
                  <Building size={20} />
                </IconWrapper>
                <InfoContent>
                  <p>Source</p>
                  <p>{revenue.source}</p>
                </InfoContent>
              </InfoItem>
            )}

            <InfoItem>
              <IconWrapper>
                <Calendar size={20} />
              </IconWrapper>
              <InfoContent>
                <p>Date</p>
                <p>{formatDateTime(revenue.date)}</p>
              </InfoContent>
            </InfoItem>

            <InfoItem>
              <IconWrapper>
                <User size={20} />
              </IconWrapper>
              <InfoContent>
                <p>Created By</p>
                <p>{getUserName(revenue.created_by_id)}</p>
              </InfoContent>
            </InfoItem>

            {revenue.is_recurring && (
              <InfoItem>
                <IconWrapper>
                  <Clock size={20} />
                </IconWrapper>
                <InfoContent>
                  <p>Recurring</p>
                  <p>{revenue.recurring_frequency ? getCategoryDisplayName(revenue.recurring_frequency) : 'Yes'}</p>
                </InfoContent>
              </InfoItem>
            )}

            {revenue.approved_by_id && (
              <InfoItem>
                <IconWrapper>
                  <CheckCircle size={20} />
                </IconWrapper>
                <InfoContent>
                  <p>Approved By</p>
                  <p>{getUserName(revenue.approved_by_id)}</p>
                </InfoContent>
              </InfoItem>
            )}

            {revenue.approved_at && (
              <InfoItem>
                <IconWrapper>
                  <Calendar size={20} />
                </IconWrapper>
                <InfoContent>
                  <p>Approved At</p>
                  <p>{formatDateTime(revenue.approved_at)}</p>
                </InfoContent>
              </InfoItem>
            )}

            <InfoItem>
              <IconWrapper>
                <Calendar size={20} />
              </IconWrapper>
              <InfoContent>
                <p>Created</p>
                <p>{formatDateTime(revenue.created_at)}</p>
              </InfoContent>
            </InfoItem>

            {revenue.updated_at && revenue.updated_at !== revenue.created_at && (
              <InfoItem>
                <IconWrapper>
                  <Calendar size={20} />
                </IconWrapper>
                <InfoContent>
                  <p>Last Updated</p>
                  <p>{formatDateTime(revenue.updated_at)}</p>
                </InfoContent>
              </InfoItem>
            )}
          </InfoGrid>

          {revenue.description && (
            <Description>
              <p>{revenue.description}</p>
            </Description>
          )}

          {revenue.attachment_url && (
            <div style={{ marginTop: theme.spacing.md }}>
              <a
                href={revenue.attachment_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: theme.spacing.sm,
                  color: PRIMARY_COLOR,
                  textDecoration: 'none',
                  fontSize: theme.typography.fontSizes.sm,
                }}
              >
                <FileText size={16} />
                View Attachment
                <ExternalLink size={14} />
              </a>
            </div>
          )}

          {relatedApprovalId && (
            <div style={{ marginTop: theme.spacing.md }}>
              <Button
                variant="outline"
                onClick={() => router.push(`/approvals/${relatedApprovalId}`)}
              >
                <FileText size={16} style={{ marginRight: theme.spacing.sm }} />
                View Approval Workflow
              </Button>
            </div>
          )}
        </Card>

        {/* Rejection Modal */}
        {showRejectModal && (
          <ModalOverlay onClick={() => {
            setShowRejectModal(false);
            setRejectionReason('');
            setRejectPassword('');
            setRejectPasswordError(null);
          }}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
              <ModalTitle>
                <XCircle size={20} style={{ color: '#ef4444', marginRight: theme.spacing.sm }} />
                Reject Revenue Entry
              </ModalTitle>
              
              <WarningBox>
                <p>
                  You are about to reject this revenue entry. This action cannot be undone.
                  Please enter your own password to verify this action.
                </p>
              </WarningBox>

              <FormGroup>
                <Label htmlFor="rejection-reason">Rejection Reason</Label>
                <TextArea
                  id="rejection-reason"
                  value={rejectionReason}
                  onChange={(e) => {
                    setRejectionReason(e.target.value);
                    setRejectPasswordError(null);
                  }}
                  placeholder="Please provide a reason for rejection (minimum 10 characters)..."
                  rows={4}
                />
                {rejectionReason.trim().length > 0 && rejectionReason.trim().length < 10 && (
                  <ErrorText>Rejection reason must be at least 10 characters long</ErrorText>
                )}
              </FormGroup>

              <FormGroup>
                <Label htmlFor="reject-password">
                  Enter your own password to confirm rejection:
                </Label>
                <PasswordInput
                  id="reject-password"
                  type="password"
                  value={rejectPassword}
                  onChange={(e) => {
                    setRejectPassword(e.target.value);
                    setRejectPasswordError(null);
                  }}
                  placeholder="Enter your password"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && rejectionReason.trim().length >= 10 && rejectPassword.trim()) {
                      handleReject(rejectionReason, rejectPassword);
                    }
                  }}
                />
                {rejectPasswordError && (
                  <ErrorText>{rejectPasswordError}</ErrorText>
                )}
              </FormGroup>

              <ModalActions>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason('');
                    setRejectPassword('');
                    setRejectPasswordError(null);
                  }}
                  disabled={processing}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleReject(rejectionReason, rejectPassword)}
                  disabled={!rejectionReason.trim() || rejectionReason.trim().length < 10 || !rejectPassword.trim() || processing}
                >
                  {processing ? (
                    <>
                      <Loader2 size={16} style={{ marginRight: theme.spacing.sm }} className="animate-spin" />
                      Rejecting...
                    </>
                  ) : (
                    <>
                      <XCircle size={16} style={{ marginRight: theme.spacing.sm }} />
                      Reject
                    </>
                  )}
                </Button>
              </ModalActions>
            </ModalContent>
          </ModalOverlay>
        )}

        {/* Delete Modal with Password Verification and Details */}
        {showDeleteModal && revenue && (
          <ModalOverlay onClick={() => {
            setShowDeleteModal(false);
            setDeletePassword('');
            setDeletePasswordError(null);
          }}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
              <ModalTitle>
                <Trash2 size={20} style={{ color: '#ef4444', marginRight: theme.spacing.sm }} />
                Delete Revenue Entry
              </ModalTitle>
              
              <WarningBox>
                <p>
                  <strong>Warning:</strong> You are about to permanently delete this revenue entry. 
                  This action cannot be undone. Please enter your password to confirm this deletion.
                </p>
              </WarningBox>

              {/* Revenue Entry Details to be Deleted */}
              <div style={{
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: theme.borderRadius.md,
                padding: theme.spacing.md,
                marginBottom: theme.spacing.lg
              }}>
                <h4 style={{
                  fontSize: theme.typography.fontSizes.sm,
                  fontWeight: theme.typography.fontWeights.bold,
                  color: TEXT_COLOR_DARK,
                  margin: `0 0 ${theme.spacing.md} 0`
                }}>
                  Revenue Entry Details to be Deleted:
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                    <strong style={{ minWidth: '120px', fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_DARK }}>Title:</strong>
                    <span style={{ fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_MUTED }}>
                      {revenue.title || 'N/A'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                    <strong style={{ minWidth: '120px', fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_DARK }}>Amount:</strong>
                    <span style={{ 
                      fontSize: theme.typography.fontSizes.sm, 
                      fontWeight: theme.typography.fontWeights.bold, 
                      color: PRIMARY_COLOR
                    }}>
                      {formatCurrency(revenue.amount)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                    <strong style={{ minWidth: '120px', fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_DARK }}>Category:</strong>
                    <span style={{ fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_MUTED }}>
                      {getCategoryDisplayName(revenue.category)}
                    </span>
                  </div>
                  {revenue.source && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                      <strong style={{ minWidth: '120px', fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_DARK }}>Source:</strong>
                      <span style={{ fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_MUTED }}>
                        {revenue.source}
                      </span>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                    <strong style={{ minWidth: '120px', fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_DARK }}>Date:</strong>
                    <span style={{ fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_MUTED }}>
                      {formatDateTime(revenue.date)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                    <strong style={{ minWidth: '120px', fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_DARK }}>Status:</strong>
                    <StatusBadge $status={revenue.is_approved}>
                      {revenue.is_approved ? 'APPROVED' : 'PENDING'}
                    </StatusBadge>
                  </div>
                  {revenue.description && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: theme.spacing.sm }}>
                      <strong style={{ minWidth: '120px', fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_DARK }}>Description:</strong>
                      <span style={{ fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_MUTED, flex: 1 }}>
                        {revenue.description}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <FormGroup>
                <Label htmlFor="delete-password">
                  Enter your password to confirm deletion:
                </Label>
                <PasswordInput
                  id="delete-password"
                  type="password"
                  value={deletePassword}
                  onChange={(e) => {
                    setDeletePassword(e.target.value);
                    setDeletePasswordError(null);
                  }}
                  placeholder="Enter your password"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && deletePassword.trim()) {
                      handleDelete(deletePassword);
                    }
                  }}
                  autoFocus
                />
                {deletePasswordError && (
                  <ErrorText>{deletePasswordError}</ErrorText>
                )}
              </FormGroup>

              <ModalActions>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletePassword('');
                    setDeletePasswordError(null);
                  }}
                  disabled={deleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDelete(deletePassword)}
                  disabled={!deletePassword.trim() || deleting}
                >
                  {deleting ? (
                    <>
                      <Loader2 size={16} style={{ marginRight: theme.spacing.sm }} className="animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} style={{ marginRight: theme.spacing.sm }} />
                      Delete
                    </>
                  )}
                </Button>
              </ModalActions>
            </ModalContent>
          </ModalOverlay>
        )}
      </PageContainer>
    </Layout>
  );
}

