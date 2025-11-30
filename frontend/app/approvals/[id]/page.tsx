'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import styled from 'styled-components';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  DollarSign,
  CreditCard,
  AlertCircle,
  User,
  Calendar,
  MessageSquare,
  Send,
  Loader2,
} from 'lucide-react';
import Layout from '@/components/layout';
import apiClient from '@/lib/api';
import { useAuth } from '@/lib/rbac/auth-context';
import { useUserStore } from '@/store/userStore';
import { theme } from '@/components/common/theme';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const PRIMARY_COLOR = theme.colors.primary || '#00AA00';
const TEXT_COLOR_DARK = '#111827';
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

const StatusBadge = styled.span<{ $status: string }>`
  display: inline-flex;
  align-items: center;
  padding: ${theme.spacing.xs} ${theme.spacing.md};
  border-radius: 999px;
  font-size: ${theme.typography.fontSizes.xs};
  font-weight: ${theme.typography.fontWeights.bold};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background-color: ${props => {
    switch(props.$status) {
      case 'approved': return 'rgba(16, 185, 129, 0.12)';
      case 'rejected': return 'rgba(239, 68, 68, 0.12)';
      case 'cancelled': return 'rgba(107, 114, 128, 0.12)';
      default: return 'rgba(251, 191, 36, 0.12)';
    }
  }};
  color: ${props => {
    switch(props.$status) {
      case 'approved': return '#065f46';
      case 'rejected': return '#991b1b';
      case 'cancelled': return '#374151';
      default: return '#b45309';
    }
  }};
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
  padding: ${theme.spacing.md};
  background: ${theme.colors.backgroundSecondary};
  border-radius: ${theme.borderRadius.md};
  margin-top: ${theme.spacing.md};
  
  p {
    margin: 0;
    color: ${TEXT_COLOR_DARK};
    line-height: 1.6;
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

const CommentsSection = styled.div`
  margin-top: ${theme.spacing.lg};
  padding-top: ${theme.spacing.lg};
  border-top: 1px solid ${theme.colors.border};
`;

const CommentList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.md};
`;

const CommentItem = styled.div`
  padding: ${theme.spacing.md};
  background: ${theme.colors.backgroundSecondary};
  border-radius: ${theme.borderRadius.md};
`;

const CommentHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${theme.spacing.xs};
`;

const CommentAuthor = styled.span`
  font-weight: ${theme.typography.fontWeights.medium};
  color: ${TEXT_COLOR_DARK};
  font-size: ${theme.typography.fontSizes.sm};
`;

const CommentDate = styled.span`
  color: ${TEXT_COLOR_MUTED};
  font-size: ${theme.typography.fontSizes.xs};
`;

const CommentText = styled.p`
  margin: 0;
  color: ${TEXT_COLOR_DARK};
  line-height: 1.6;
  font-size: ${theme.typography.fontSizes.sm};
`;

const CommentForm = styled.form`
  display: flex;
  gap: ${theme.spacing.sm};
  margin-top: ${theme.spacing.md};
`;

const CommentInput = styled.textarea`
  flex: 1;
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  background: ${theme.colors.background};
  color: ${TEXT_COLOR_DARK};
  font-size: ${theme.typography.fontSizes.sm};
  font-family: inherit;
  resize: vertical;
  min-height: 80px;
  
  &:focus {
    outline: none;
    border-color: ${PRIMARY_COLOR};
    box-shadow: 0 0 0 3px ${PRIMARY_COLOR}15;
  }
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

interface ApprovalDetail {
  id: number;
  title: string;
  description?: string;
  type: string;
  status: string;
  priority: string;
  requester_id: number;
  approver_id?: number;
  revenue_entry_id?: number;
  expense_entry_id?: number;
  created_at: string;
  updated_at?: string;
  approved_at?: string;
  rejection_reason?: string;
}

interface Comment {
  id: number;
  comment: string;
  user_id: number;
  created_at: string;
  user_name?: string;
}

export default function ApprovalDetailPage() {
  const router = useRouter();
  const params = useParams();
  const approvalId = params?.id ? parseInt(params.id as string, 10) : null;
  const { user } = useAuth();
  const { canApproveTransactions, allUsers, fetchAllUsers } = useUserStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approval, setApproval] = useState<ApprovalDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  const canApprove = () => {
    if (canApproveTransactions()) return true;
    if (!user) return false;
    const role = user.role?.toLowerCase();
    return role === 'admin' || role === 'super_admin' || role === 'manager' || role === 'finance_manager';
  };

  useEffect(() => {
    if (approvalId) {
      loadApproval();
      loadComments();
    }
    // Load all users for name resolution
    if (allUsers.length === 0) {
      fetchAllUsers();
    }
  }, [approvalId]);

  const loadApproval = async () => {
    if (!approvalId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.getApproval(approvalId);
      setApproval(response.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to load approval details';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    if (!approvalId) return;

    try {
      const response = await apiClient.getApprovalComments(approvalId);
      setComments(response.data || []);
    } catch (err: any) {
      // Silently fail - comments are optional
      setComments([]);
    }
  };

  const handleApprove = async () => {
    if (!approvalId || !canApprove()) {
      toast.error('You do not have permission to approve items');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      await apiClient.approveWorkflow(approvalId);
      toast.success('Approval workflow approved successfully');
      await loadApproval();
      await loadComments();
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to approve workflow';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (reason: string) => {
    if (!approvalId || !canApprove()) {
      toast.error('You do not have permission to reject items');
      return;
    }

    if (!reason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      await apiClient.rejectWorkflow(approvalId, reason);
      toast.success('Approval workflow rejected');
      setShowRejectModal(false);
      setRejectionReason('');
      await loadApproval();
      await loadComments();
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to reject workflow';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvalId || !commentText.trim()) return;

    setSubmittingComment(true);

    try {
      await apiClient.createApprovalComment(approvalId, commentText.trim());
      toast.success('Comment added successfully');
      setCommentText('');
      await loadComments();
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to add comment';
      toast.error(errorMessage);
    } finally {
      setSubmittingComment(false);
    }
  };

  const getUserName = (userId: number) => {
    if (!allUsers || allUsers.length === 0) {
      return `User #${userId}`;
    }
    const userIdStr = userId.toString();
    const foundUser = allUsers.find((u: any) => 
      u.id === userId || 
      u.id?.toString() === userIdStr ||
      parseInt(u.id) === userId
    );
    if (!foundUser) {
      return `User #${userId}`;
    }
    // StoreUser uses 'name' field, but API might return 'full_name'
    return (foundUser as any).name || 
           (foundUser as any).full_name || 
           (foundUser as any).email || 
           `User #${userId}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getTypeIcon = () => {
    if (!approval) return <FileText />;
    if (approval.revenue_entry_id) return <DollarSign />;
    if (approval.expense_entry_id) return <CreditCard />;
    return <FileText />;
  };

  if (loading) {
    return (
      <Layout>
        <PageContainer>
          <LoadingContainer>
            <Spinner />
            <p>Loading approval details...</p>
          </LoadingContainer>
        </PageContainer>
      </Layout>
    );
  }

  if (error && !approval) {
    return (
      <Layout>
        <PageContainer>
          <BackLink href="/approvals">
            <ArrowLeft size={16} />
            Back to Approvals
          </BackLink>
          <ErrorBanner>
            <AlertCircle size={16} />
            <span>{error}</span>
          </ErrorBanner>
        </PageContainer>
      </Layout>
    );
  }

  if (!approval) {
    return null;
  }

  return (
    <Layout>
      <PageContainer>
        <HeaderSection>
          <BackLink href="/approvals">
            <ArrowLeft size={16} />
            Back to Approvals
          </BackLink>
          
          <HeaderContent>
            <HeaderText>
              <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md, flexWrap: 'wrap' }}>
                <h1>{approval.title}</h1>
                <StatusBadge $status={approval.status}>
                  {approval.status.toUpperCase()}
                </StatusBadge>
              </div>
              <p>Approval Workflow #{approval.id}</p>
            </HeaderText>

            {approval.status === 'pending' && canApprove() && (
              <ActionButtons>
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
                  onClick={() => setShowRejectModal(true)}
                  disabled={processing}
                >
                  <XCircle size={16} style={{ marginRight: theme.spacing.sm }} />
                  Reject
                </Button>
              </ActionButtons>
            )}
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
            {getTypeIcon()}
            Approval Information
          </CardTitle>

          <InfoGrid>
            <InfoItem>
              <IconWrapper>
                <FileText size={20} />
              </IconWrapper>
              <InfoContent>
                <p>Type</p>
                <p style={{ textTransform: 'capitalize' }}>
                  {approval.revenue_entry_id ? 'Revenue' : approval.expense_entry_id ? 'Expense' : approval.type}
                </p>
              </InfoContent>
            </InfoItem>

            <InfoItem>
              <IconWrapper>
                <Clock size={20} />
              </IconWrapper>
              <InfoContent>
                <p>Priority</p>
                <p style={{ textTransform: 'capitalize' }}>{approval.priority}</p>
              </InfoContent>
            </InfoItem>

            <InfoItem>
              <IconWrapper>
                <User size={20} />
              </IconWrapper>
              <InfoContent>
                <p>Requester</p>
                <p>{getUserName(approval.requester_id)}</p>
              </InfoContent>
            </InfoItem>

            {approval.approver_id && (
              <InfoItem>
                <IconWrapper>
                  <CheckCircle size={20} />
                </IconWrapper>
                <InfoContent>
                  <p>Approver</p>
                  <p>{getUserName(approval.approver_id)}</p>
                </InfoContent>
              </InfoItem>
            )}

            <InfoItem>
              <IconWrapper>
                <Calendar size={20} />
              </IconWrapper>
              <InfoContent>
                <p>Created</p>
                <p>{formatDate(approval.created_at)}</p>
              </InfoContent>
            </InfoItem>

            {approval.approved_at && (
              <InfoItem>
                <IconWrapper>
                  <CheckCircle size={20} />
                </IconWrapper>
                <InfoContent>
                  <p>Approved At</p>
                  <p>{formatDate(approval.approved_at)}</p>
                </InfoContent>
              </InfoItem>
            )}

            {approval.status === 'rejected' && approval.updated_at && (
              <InfoItem>
                <IconWrapper>
                  <XCircle size={20} />
                </IconWrapper>
                <InfoContent>
                  <p>Rejected At</p>
                  <p>{formatDate(approval.updated_at)}</p>
                </InfoContent>
              </InfoItem>
            )}
          </InfoGrid>

          {approval.description && (
            <Description>
              <p>{approval.description}</p>
            </Description>
          )}

          {approval.rejection_reason && (
            <div style={{ marginTop: theme.spacing.md, padding: theme.spacing.md, background: 'rgba(239, 68, 68, 0.1)', borderRadius: theme.borderRadius.md }}>
              <p style={{ margin: 0, fontWeight: theme.typography.fontWeights.medium, color: '#991b1b', marginBottom: theme.spacing.xs }}>
                Rejection Reason:
              </p>
              <p style={{ margin: 0, color: TEXT_COLOR_DARK }}>{approval.rejection_reason}</p>
            </div>
          )}

          {(approval.revenue_entry_id || approval.expense_entry_id) && (
            <div style={{ marginTop: theme.spacing.md }}>
              <Button
                variant="outline"
                onClick={() => {
                  if (approval.revenue_entry_id) {
                    router.push(`/revenue/${approval.revenue_entry_id}`);
                  } else if (approval.expense_entry_id) {
                    router.push(`/expenses/${approval.expense_entry_id}`);
                  }
                }}
              >
                View Related Entry
              </Button>
            </div>
          )}
        </Card>

        <Card>
          <CardTitle>
            <MessageSquare size={20} />
            Comments ({comments.length})
          </CardTitle>

          {comments.length > 0 && (
            <CommentList>
              {comments.map((comment) => (
                <CommentItem key={comment.id}>
                  <CommentHeader>
                    <CommentAuthor>{getUserName(comment.user_id)}</CommentAuthor>
                    <CommentDate>{formatDate(comment.created_at)}</CommentDate>
                  </CommentHeader>
                  <CommentText>{comment.comment}</CommentText>
                </CommentItem>
              ))}
            </CommentList>
          )}

          <CommentForm onSubmit={handleSubmitComment}>
            <CommentInput
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              rows={3}
            />
            <Button
              type="submit"
              disabled={!commentText.trim() || submittingComment}
              style={{ backgroundColor: PRIMARY_COLOR, color: '#fff' }}
            >
              {submittingComment ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
            </Button>
          </CommentForm>
        </Card>

        {/* Rejection Modal */}
        {showRejectModal && (
          <ModalOverlay onClick={() => {
            setShowRejectModal(false);
            setRejectionReason('');
          }}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
              <ModalTitle>Reject Approval</ModalTitle>
              <TextArea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a reason for rejection..."
                rows={4}
              />
              <ModalActions>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleReject(rejectionReason)}
                  disabled={!rejectionReason.trim() || processing}
                >
                  Reject
                </Button>
              </ModalActions>
            </ModalContent>
          </ModalOverlay>
        )}
      </PageContainer>
    </Layout>
  );
}

