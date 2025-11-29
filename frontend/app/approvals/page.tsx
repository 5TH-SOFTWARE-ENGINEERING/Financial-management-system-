'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import {
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Eye,
  FileText,
  DollarSign,
  CreditCard,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import Layout from '@/components/layout';
import apiClient from '@/lib/api';
import { useAuth } from '@/lib/rbac/auth-context';
import { useUserStore } from '@/store/userStore';
import { theme } from '@/components/common/theme';
import { toast } from 'sonner';

const PRIMARY_COLOR = theme.colors.primary || '#00AA00';
const PRIMARY_LIGHT = '#e8f5e9';
const TEXT_COLOR_DARK = '#111827';
const TEXT_COLOR_MUTED = theme.colors.textSecondary || '#666';
const BACKGROUND_GRADIENT = `linear-gradient(180deg, #f9fafb 0%, #f3f4f6 60%, ${theme.colors.background} 100%)`;

const CardShadow = `
  0 2px 4px -1px rgba(0, 0, 0, 0.06),
  0 1px 2px -1px rgba(0, 0, 0, 0.03),
  inset 0 0 0 1px rgba(0, 0, 0, 0.02)
`;
const CardShadowHover = `
  0 8px 12px -2px rgba(0, 0, 0, 0.08),
  0 4px 6px -2px rgba(0, 0, 0, 0.04),
  inset 0 0 0 1px rgba(0, 0, 0, 0.03)
`;

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const ContentContainer = styled.div`
  flex: 1;
  width: 100%;
  max-width: 1000px;
  margin-left: auto;
  margin-right: 0;
  padding: ${theme.spacing.md} ${theme.spacing.md} ${theme.spacing.xl};
`;

const HeaderContainer = styled.div`
  background: linear-gradient(135deg, ${PRIMARY_COLOR} 0%, #008800 100%);
  color: #ffffff;
  padding: ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.lg};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-radius: ${theme.borderRadius.md};
  border-bottom: 3px solid rgba(255, 255, 255, 0.1);
`;

const HeaderContent = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: ${theme.spacing.md};
  
  h1 {
    font-size: clamp(24px, 3vw, 36px);
    font-weight: ${theme.typography.fontWeights.bold};
    margin: 0;
    color: #ffffff;
    display: flex;
    align-items: center;
    gap: ${theme.spacing.md};
  }
  
  p {
    font-size: ${theme.typography.fontSizes.sm};
    font-weight: ${theme.typography.fontWeights.medium};
    opacity: 0.9;
    margin: ${theme.spacing.xs} 0 0;
    color: rgba(255, 255, 255, 0.95);
  }
`;

const RefreshButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.sm} ${theme.spacing.lg};
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: ${theme.borderRadius.md};
  color: #ffffff;
  font-size: ${theme.typography.fontSizes.sm};
  font-weight: ${theme.typography.fontWeights.medium};
  cursor: pointer;
  transition: all ${theme.transitions.default};
  backdrop-filter: blur(8px);

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.25);
    border-color: rgba(255, 255, 255, 0.5);
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    
    svg {
      animation: spin 0.8s linear infinite;
    }
  }

  svg {
    width: 16px;
    height: 16px;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const ErrorBanner = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.lg};
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: ${theme.borderRadius.md};
  color: #dc2626;
  font-size: ${theme.typography.fontSizes.sm};

  svg {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
  }
`;

const FiltersContainer = styled.div`
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.lg};
  box-shadow: ${CardShadow};
  transition: box-shadow ${theme.transitions.default};

  &:hover {
    box-shadow: ${CardShadowHover};
  }
`;

const FiltersGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: ${theme.spacing.sm};
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: ${theme.spacing.sm};
  }
`;

const SearchContainer = styled.div`
  position: relative;
  grid-column: span 1;

  svg {
    position: absolute;
    left: ${theme.spacing.md};
    top: 50%;
    transform: translateY(-50%);
    width: 18px;
    height: 18px;
    color: ${TEXT_COLOR_MUTED};
    pointer-events: none;
  }
`;

const SearchInput = styled.input`
  width: 70%;
  padding: ${theme.spacing.sm} ${theme.spacing.md} ${theme.spacing.sm} 40px;
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  background: ${theme.colors.background};
  font-size: ${theme.typography.fontSizes.sm};
  color: ${TEXT_COLOR_DARK};
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

const Select = styled.select`
  width: 100%;
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  background: ${theme.colors.background};
  color: ${TEXT_COLOR_DARK};
  font-size: ${theme.typography.fontSizes.sm};
  cursor: pointer;
  transition: all ${theme.transitions.default};

  &:focus {
    outline: none;
    border-color: ${PRIMARY_COLOR};
    box-shadow: 0 0 0 3px ${PRIMARY_COLOR}15;
  }
`;

const ApprovalsList = styled.div`
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  box-shadow: ${CardShadow};
  overflow: hidden;
`;

const EmptyState = styled.div`
  padding: ${theme.spacing.xxl};
  text-align: center;
  color: ${TEXT_COLOR_MUTED};

  svg {
    width: 48px;
    height: 48px;
    margin: 0 auto ${theme.spacing.md};
    opacity: 0.5;
  }

  p {
    font-size: ${theme.typography.fontSizes.md};
    margin: 0;
  }
`;

const ApprovalItemContainer = styled.div`
  padding: ${theme.spacing.lg};
  border-bottom: 1px solid ${theme.colors.border};
  transition: all ${theme.transitions.default};
  position: relative;

  &:hover {
    background-color: ${theme.colors.backgroundSecondary};
    transform: translateX(4px);
  }

  &:last-child {
    border-bottom: none;
  }

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 0;
    background: ${PRIMARY_COLOR};
    transition: width ${theme.transitions.default};
  }

  &:hover::before {
    width: 4px;
  }
`;

const ApprovalItemContent = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${theme.spacing.lg};
  flex-wrap: wrap;
`;

const ApprovalItemLeft = styled.div`
  flex: 1;
  min-width: 300px;
`;

const ApprovalHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.md};
  flex-wrap: wrap;
`;

const TypeIcon = styled.div<{ $type: string }>`
  width: 48px;
  height: 48px;
  border-radius: ${theme.borderRadius.md};
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => {
    switch(props.$type) {
      case 'revenue': return 'rgba(34, 197, 94, 0.12)';
      case 'expense': return 'rgba(239, 68, 68, 0.12)';
      default: return 'rgba(59, 130, 246, 0.12)';
    }
  }};
  color: ${props => {
    switch(props.$type) {
      case 'revenue': return '#15803d';
      case 'expense': return '#dc2626';
      default: return '#1d4ed8';
    }
  }};
  transition: transform ${theme.transitions.default};
  flex-shrink: 0;

  ${ApprovalItemContainer}:hover & {
    transform: scale(1.1);
  }

  svg {
    width: 24px;
    height: 24px;
    stroke-width: 2;
  }
`;

const ApprovalTitle = styled.h3`
  font-size: ${theme.typography.fontSizes.lg};
  font-weight: ${theme.typography.fontWeights.bold};
  color: ${TEXT_COLOR_DARK};
  margin: 0 0 ${theme.spacing.xs};
`;

const ApprovalDescription = styled.p`
  font-size: ${theme.typography.fontSizes.sm};
  color: ${TEXT_COLOR_MUTED};
  margin: 0;
`;

const ApprovalMeta = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  margin-top: ${theme.spacing.md};
  flex-wrap: wrap;
  font-size: ${theme.typography.fontSizes.sm};
  color: ${TEXT_COLOR_MUTED};
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
  border: 1px solid transparent;
  transition: all ${theme.transitions.default};
  
  ${ApprovalItemContainer}:hover & {
    transform: scale(1.05);
  }
`;

const ApprovalActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  flex-shrink: 0;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'danger' | 'secondary' }>`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.xs};
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.typography.fontSizes.sm};
  font-weight: ${theme.typography.fontWeights.medium};
  cursor: pointer;
  transition: all ${theme.transitions.default};

  ${props => {
    switch(props.$variant) {
      case 'primary':
        return `
          background: ${PRIMARY_COLOR};
          color: white;
          border-color: ${PRIMARY_COLOR};
          
          &:hover:not(:disabled) {
            background: #008800;
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0, 170, 0, 0.2);
          }
        `;
      case 'danger':
        return `
          background: #ef4444;
          color: white;
          border-color: #ef4444;
          
          &:hover:not(:disabled) {
            background: #dc2626;
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(239, 68, 68, 0.2);
          }
        `;
      default:
        return `
          background: ${theme.colors.background};
          color: ${TEXT_COLOR_DARK};
          
          &:hover:not(:disabled) {
            background: ${theme.colors.backgroundSecondary};
            border-color: ${PRIMARY_COLOR};
            color: ${PRIMARY_COLOR};
          }
        `;
    }
  }}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  svg {
    width: 16px;
    height: 16px;
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
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease-out;

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
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

const ModalActions = styled.div`
  display: flex;
  gap: ${theme.spacing.md};
  justify-content: flex-end;
  margin-top: ${theme.spacing.lg};
`;

const Label = styled.label`
  display: block;
  font-size: ${theme.typography.fontSizes.sm};
  font-weight: ${theme.typography.fontWeights.medium};
  color: ${TEXT_COLOR_DARK};
  margin-bottom: ${theme.spacing.sm};
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

interface ApprovalItem {
  id: number;
  type: 'revenue' | 'expense' | 'workflow';
  title: string;
  description?: string;
  amount?: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  requester?: string;
  requester_id?: number;
  approver?: string;
  created_at: string;
  updated_at?: string;
  approved_at?: string;
  rejection_reason?: string;
  revenue_entry_id?: number;
  expense_entry_id?: number;
  workflow_id?: number;
}

export default function ApprovalsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { canApproveTransactions } = useUserStore();
  
  const canApprove = () => {
    if (canApproveTransactions()) return true;
    if (!user) return false;
    const role = user.role?.toLowerCase();
    return role === 'admin' || role === 'super_admin' || role === 'manager' || role === 'finance_manager';
  };

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [showRejectModal, setShowRejectModal] = useState<number | null>(null);

  useEffect(() => {
    loadApprovals();
  }, []);

  const loadApprovals = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch approval workflows
      const workflowsResponse = await apiClient.getApprovals();
      const workflows = (workflowsResponse.data || []).map((w: any) => ({
        id: w.id,
        type: 'workflow' as const,
        title: w.title || `${w.type} Approval`,
        description: w.description,
        status: w.status?.toLowerCase() || 'pending',
        requester_id: w.requester_id,
        created_at: w.created_at,
        updated_at: w.updated_at,
        approved_at: w.approved_at,
        rejection_reason: w.rejection_reason,
        revenue_entry_id: w.revenue_entry_id,
        expense_entry_id: w.expense_entry_id,
        workflow_id: w.id,
      }));

      // Fetch pending revenue entries
      const revenuesResponse = await apiClient.getRevenues({ is_approved: false });
      const pendingRevenues = (revenuesResponse.data || [])
        .filter((r: any) => !r.is_approved)
        .map((r: any) => ({
          id: r.id,
          type: 'revenue' as const,
          title: r.description || `Revenue Entry #${r.id}`,
          description: r.description,
          amount: r.amount,
          status: 'pending' as const,
          requester_id: r.created_by_id,
          created_at: r.created_at || r.date,
          revenue_entry_id: r.id,
        }));

      // Fetch pending expense entries
      const expensesResponse = await apiClient.getExpenses({ is_approved: false });
      const pendingExpenses = (expensesResponse.data || [])
        .filter((e: any) => !e.is_approved)
        .map((e: any) => ({
          id: e.id,
          type: 'expense' as const,
          title: e.title || e.description || `Expense Entry #${e.id}`,
          description: e.description,
          amount: e.amount,
          status: 'pending' as const,
          requester_id: e.created_by_id,
          created_at: e.created_at || e.date,
          expense_entry_id: e.id,
        }));

      // Combine all approvals
      const allApprovals = [...workflows, ...pendingRevenues, ...pendingExpenses];
      
      // Sort by created date (newest first)
      allApprovals.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setApprovals(allApprovals);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to load approvals';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (item: ApprovalItem) => {
    if (!canApprove()) {
      toast.error('You do not have permission to approve items');
      return;
    }

    setProcessingId(item.id);
    setError(null);

    try {
      if (item.type === 'workflow' && item.workflow_id) {
        await apiClient.approveWorkflow(item.workflow_id);
        toast.success('Approval workflow approved successfully');
      } else if (item.type === 'revenue' && item.revenue_entry_id) {
        await apiClient.approveItem(item.revenue_entry_id, 'revenue');
        toast.success('Revenue entry approved successfully');
      } else if (item.type === 'expense' && item.expense_entry_id) {
        await apiClient.approveItem(item.expense_entry_id, 'expense');
        toast.success('Expense entry approved successfully');
      }
      
      await loadApprovals();
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to approve item';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (item: ApprovalItem, reason: string) => {
    if (!canApprove()) {
      toast.error('You do not have permission to reject items');
      return;
    }

    if (!reason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setProcessingId(item.id);
    setError(null);

    try {
      if (item.type === 'workflow' && item.workflow_id) {
        await apiClient.rejectWorkflow(item.workflow_id, reason);
        toast.success('Approval workflow rejected');
      } else if (item.type === 'revenue' && item.revenue_entry_id) {
        await apiClient.rejectItem(item.revenue_entry_id, 'revenue', reason);
        toast.success('Revenue entry rejected');
      } else if (item.type === 'expense' && item.expense_entry_id) {
        await apiClient.rejectItem(item.expense_entry_id, 'expense', reason);
        toast.success('Expense entry rejected');
      }
      
      setShowRejectModal(null);
      setRejectionReason('');
      await loadApprovals();
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to reject item';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setProcessingId(null);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'revenue':
        return <DollarSign />;
      case 'expense':
        return <CreditCard />;
      default:
        return <FileText />;
    }
  };

  const getItemType = (title: string): string => {
    // Extract only the item type value from the title string
    // Match "Item Type:" followed by value until next label pattern (e.g., "Buy-at Price:", "Sold-at Price:")
    // This pattern captures everything after "Item Type:" until the next label (which starts with uppercase + colon)
    const itemTypeMatch = title.match(/Item Type:\s*(.+?)(?=\s+[A-Z][a-z-]+\s+[A-Z][^:]*:|$)/i);
    if (itemTypeMatch && itemTypeMatch[1]) {
      return itemTypeMatch[1].trim();
    }
    // Fallback: try simpler pattern if the above doesn't match
    const simpleMatch = title.match(/Item Type:\s*(\S+)/i);
    if (simpleMatch && simpleMatch[1]) {
      return simpleMatch[1].trim();
    }
    return title;
  };

  const filteredApprovals = approvals.filter(item => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  if (loading) {
    return (
      <Layout>
        <PageContainer>
          <ContentContainer>
            <LoadingContainer>
              <Spinner />
              <p>Loading approvals...</p>
            </LoadingContainer>
          </ContentContainer>
        </PageContainer>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageContainer>
        <ContentContainer>
          <HeaderContainer>
            <HeaderContent>
            <div>
                <h1>Approvals</h1>
                <p>Manage pending approvals and review history</p>
            </div>
              <RefreshButton onClick={loadApprovals} disabled={loading}>
                <RefreshCw />
              Refresh
              </RefreshButton>
            </HeaderContent>
          </HeaderContainer>

        {error && (
            <ErrorBanner>
              <AlertCircle />
            <span>{error}</span>
            </ErrorBanner>
          )}

          <FiltersContainer>
            <FiltersGrid>
              <SearchContainer>
                <Search />
                <SearchInput
                type="text"
                placeholder="Search approvals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              </SearchContainer>
            
              <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
              </Select>
            
              <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="revenue">Revenue</option>
              <option value="expense">Expense</option>
              <option value="workflow">Workflow</option>
              </Select>
            </FiltersGrid>
          </FiltersContainer>

          <ApprovalsList>
          {filteredApprovals.length === 0 ? (
              <EmptyState>
                <Clock />
                <p>No approvals found</p>
              </EmptyState>
            ) : (
              filteredApprovals.map((item) => (
                <ApprovalItemContainer key={`${item.type}-${item.id}`}>
                  <ApprovalItemContent>
                    <ApprovalItemLeft>
                      <ApprovalHeader>
                        <TypeIcon $type={item.type}>
                          {getTypeIcon(item.type)}
                        </TypeIcon>
                        <div style={{ flex: 1 }}>
                          <ApprovalTitle>
                            {item.title.includes('Item Type:') ? getItemType(item.title) : item.title}
                          </ApprovalTitle>
                        </div>
                        <StatusBadge $status={item.status}>
                          {item.status.toUpperCase()}
                        </StatusBadge>
                      </ApprovalHeader>
                      
                      <ApprovalMeta>
                        <span style={{ textTransform: 'capitalize' }}>{item.type}</span>
                        {item.amount !== undefined && (
                          <span style={{ fontWeight: theme.typography.fontWeights.medium, color: TEXT_COLOR_DARK }}>
                            ${Number(item.amount).toLocaleString()}
                          </span>
                        )}
                        <span>
                          {new Date(item.created_at).toLocaleDateString()} at{' '}
                          {new Date(item.created_at).toLocaleTimeString()}
                        </span>
                        {item.approved_at && (
                          <span style={{ color: '#059669' }}>
                            Approved: {new Date(item.approved_at).toLocaleDateString()}
                          </span>
                        )}
                        {item.rejection_reason && (
                          <span style={{ color: '#dc2626' }}>
                            Reason: {item.rejection_reason}
                          </span>
                        )}
                      </ApprovalMeta>
                    </ApprovalItemLeft>
                    
                    <ApprovalActions>
                      {item.status === 'pending' && canApprove() && (
                        <>
                          <ActionButton
                            $variant="primary"
                            onClick={() => handleApprove(item)}
                            disabled={processingId === item.id}
                          >
                            <CheckCircle />
                            Approve
                          </ActionButton>
                          <ActionButton
                            $variant="danger"
                            onClick={() => setShowRejectModal(item.id)}
                            disabled={processingId === item.id}
                          >
                            <XCircle />
                            Reject
                          </ActionButton>
                        </>
                      )}
                      <ActionButton
                        $variant="secondary"
                        onClick={() => {
                          if (item.type === 'revenue') {
                            router.push(`/revenue/${item.revenue_entry_id}`);
                          } else if (item.type === 'expense') {
                            router.push(`/expenses/${item.expense_entry_id}`);
                          } else if (item.workflow_id) {
                            router.push(`/approvals/${item.workflow_id}`);
                          }
                        }}
                      >
                        <Eye />
                        View
                      </ActionButton>
                    </ApprovalActions>
                  </ApprovalItemContent>
                </ApprovalItemContainer>
              ))
            )}
          </ApprovalsList>

        {/* Rejection Modal */}
        {showRejectModal && (
            <ModalOverlay onClick={() => {
              setShowRejectModal(null);
              setRejectionReason('');
            }}>
              <ModalContent onClick={(e) => e.stopPropagation()}>
                <ModalTitle>Reject Approval</ModalTitle>
                <div>
                <Label htmlFor="rejection-reason">Rejection Reason</Label>
                  <TextArea
                  id="rejection-reason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please provide a reason for rejection..."
                  rows={4}
                />
              </div>
                <ModalActions>
                  <ActionButton
                    $variant="secondary"
                  onClick={() => {
                    setShowRejectModal(null);
                    setRejectionReason('');
                  }}
                >
                  Cancel
                  </ActionButton>
                  <ActionButton
                    $variant="danger"
                  onClick={() => {
                    const item = approvals.find(a => a.id === showRejectModal);
                    if (item) {
                      handleReject(item, rejectionReason);
                    }
                  }}
                  disabled={!rejectionReason.trim() || processingId !== null}
                >
                  Reject
                  </ActionButton>
                </ModalActions>
              </ModalContent>
            </ModalOverlay>
          )}
        </ContentContainer>
      </PageContainer>
    </Layout>
  );
}
