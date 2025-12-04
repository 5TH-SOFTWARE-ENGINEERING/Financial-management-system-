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
  RefreshCw,
  Loader2,
  ShoppingCart
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
      case 'sale': return 'rgba(245, 158, 11, 0.12)'; // Amber for sales
      default: return 'rgba(59, 130, 246, 0.12)';
    }
  }};
  color: ${props => {
    switch(props.$type) {
      case 'revenue': return '#15803d';
      case 'expense': return '#dc2626';
      case 'sale': return '#b45309'; // Amber for sales
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
  margin: ${theme.spacing.xs} 0 0 0;
  line-height: 1.6;
  max-width: 100%;
  word-wrap: break-word;
  overflow-wrap: break-word;
  white-space: pre-wrap;
  letter-spacing: 0.01em;
  
  /* Limit height and add ellipsis for very long descriptions */
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  max-height: calc(1.6em * 3); /* 3 lines with line-height */
  
  /* Smooth transition on hover to show full text */
  transition: all ${theme.transitions.default};
  
  /* Better text rendering */
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  
  ${ApprovalItemContainer}:hover & {
    display: block;
    -webkit-line-clamp: unset;
    max-height: none;
    overflow: visible;
    color: ${TEXT_COLOR_DARK};
  }
  
  /* Responsive adjustments */
  @media (max-width: 768px) {
    font-size: ${theme.typography.fontSizes.xs};
    -webkit-line-clamp: 2;
    max-height: calc(1.6em * 2);
  }
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
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
`;

const ModalAlertIcon = styled(XCircle)`
  color: #ef4444;
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

const SpinningIcon = styled(Loader2)`
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

interface ApprovalItem {
  id: number;
  type: 'revenue' | 'expense' | 'workflow' | 'sale';
  title: string;
  description?: string;
  amount?: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'posted';
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
  sale_id?: number;
  item_name?: string;
  quantity_sold?: number;
  receipt_number?: string;
  sold_by_id?: number; // Track who sold the item (for sales)
}

export default function ApprovalsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { canApproveTransactions } = useUserStore();
  
  const canApprove = () => {
    if (canApproveTransactions()) return true;
    if (!user) return false;
    const role = user.role?.toLowerCase();
    // Include accountants and finance admins for sales approval
    return role === 'admin' || role === 'super_admin' || role === 'manager' || 
           role === 'finance_manager' || role === 'accountant';
  };

  // Check if user can approve/post sales (accountant, finance_manager, admin, super_admin)
  const canApproveSales = () => {
    if (!user) return false;
    const role = user.role?.toLowerCase();
    return role === 'accountant' || 
           role === 'finance_manager' || 
           role === 'admin' || 
           role === 'super_admin';
  };

  // Check if user can cancel sales (finance_manager, admin, super_admin only)
  const canCancelSales = () => {
    if (!user) return false;
    const role = user.role?.toLowerCase();
    return role === 'finance_manager' || 
           role === 'admin' || 
           role === 'super_admin';
  };

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [rejectPassword, setRejectPassword] = useState<string>('');
  const [rejectPasswordError, setRejectPasswordError] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadApprovals();
      
      // Auto-refresh every 30 seconds to catch new approvals
      const intervalId = setInterval(() => {
        loadApprovals();
      }, 30000);
      
      return () => clearInterval(intervalId);
    }
  }, [user]);

  const loadApprovals = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Check if user has permission to view approvals
      if (!canApprove() && user.role !== 'accountant' && user.role !== 'finance_manager') {
        // Regular users can still see their own pending items
        // But we'll still load data for them
      }
      // Fetch approval workflows - get all workflows regardless of status
      const workflowsResponse = await apiClient.getApprovals();
      const workflows = (workflowsResponse.data || []).map((w: any) => ({
        id: w.id,
        type: 'workflow' as const,
        title: w.title || `${w.type} Approval`,
        description: w.description,
        status: (w.status?.value || w.status || 'pending')?.toLowerCase(),
        requester_id: w.requester_id,
        created_at: w.created_at,
        updated_at: w.updated_at,
        approved_at: w.approved_at,
        rejection_reason: w.rejection_reason,
        revenue_entry_id: w.revenue_entry_id,
        expense_entry_id: w.expense_entry_id,
        workflow_id: w.id,
      }));

      // Collect all revenue/expense entry IDs that already have workflows
      // This prevents duplication - if an entry has a workflow, we only show the workflow
      const revenueIdsWithWorkflow = new Set(
        workflows
          .filter((w: any) => w.revenue_entry_id)
          .map((w: any) => w.revenue_entry_id)
      );
      const expenseIdsWithWorkflow = new Set(
        workflows
          .filter((w: any) => w.expense_entry_id)
          .map((w: any) => w.expense_entry_id)
      );

      // Fetch revenue entries - filter for pending ones WITHOUT workflows
      const revenuesResponse = await apiClient.getRevenues();
      const pendingRevenues = (revenuesResponse.data || [])
        .filter((r: any) => {
          // Only include if:
          // 1. Not approved yet (is_approved is false or undefined)
          // 2. Doesn't have an existing workflow (to avoid duplication)
          const isNotApproved = r.is_approved === false || r.is_approved === undefined || !r.is_approved;
          return isNotApproved && !revenueIdsWithWorkflow.has(r.id);
        })
        .map((r: any) => ({
          id: r.id,
          type: 'revenue' as const,
          title: r.title || r.description || `Revenue Entry #${r.id}`,
          description: r.description,
          amount: r.amount,
          status: 'pending' as const,
          requester_id: r.created_by_id,
          created_at: r.created_at || r.date,
          revenue_entry_id: r.id,
        }));

      // Fetch expense entries - filter for pending ones WITHOUT workflows
      const expensesResponse = await apiClient.getExpenses();
      const pendingExpenses = (expensesResponse.data || [])
        .filter((e: any) => {
          // Only include if:
          // 1. Not approved yet (is_approved is false or undefined)
          // 2. Doesn't have an existing workflow (to avoid duplication)
          const isNotApproved = e.is_approved === false || e.is_approved === undefined || !e.is_approved;
          return isNotApproved && !expenseIdsWithWorkflow.has(e.id);
        })
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

      // Fetch pending sales - for accountants, finance managers, managers, and admins
      // IMPORTANT: Fetch ALL pending sales including those sold by employees
      let pendingSales: any[] = [];
      const userRole = user?.role?.toLowerCase();
      const canViewSales = userRole === 'accountant' || 
                          userRole === 'finance_manager' || 
                          userRole === 'admin' || 
                          userRole === 'super_admin' ||
                          userRole === 'manager' ||
                          userRole === 'finance_admin';
      
      if (canViewSales) {
        try {
          // Fetch all pending sales - don't filter by sold_by_id, get ALL pending sales
          // This ensures employee sales are visible for approval
          // IMPORTANT: Backend limit is 1000, so we must use that maximum
          // Enforce limit to prevent 422 errors
          const maxLimit = 1000; // Backend maximum
          const salesResponse: any = await apiClient.getSales({ 
            status: 'pending', 
            limit: maxLimit
          });
          const salesData = Array.isArray(salesResponse?.data) 
            ? salesResponse.data 
            : (salesResponse?.data && typeof salesResponse.data === 'object' && 'data' in salesResponse.data 
              ? (salesResponse.data as any).data || [] 
              : []);
          
          // Filter and map pending sales - include ALL pending sales regardless of who sold them
          pendingSales = (salesData || [])
            .filter((s: any) => {
              // Check status - accept 'pending' in various formats
              const saleStatus = (s.status?.value || s.status || 'pending')?.toLowerCase();
              const isPending = saleStatus === 'pending' || saleStatus === 'PENDING';
              
              // Include all pending sales, regardless of sold_by_id (employee or otherwise)
              return isPending;
            })
            .map((s: any) => {
              const saleStatus = (s.status?.value || s.status || 'pending')?.toLowerCase();
              return {
                id: s.id,
                type: 'sale' as const,
                title: s.item_name || `Sale #${s.id}`,
                description: s.customer_name ? `Customer: ${s.customer_name}` : `Receipt: ${s.receipt_number || `#${s.id}`}`,
                amount: s.total_sale,
                status: 'pending' as const, // Force to 'pending' to ensure buttons show
                requester_id: s.sold_by_id,
                created_at: s.created_at,
                sale_id: s.id,
                item_name: s.item_name,
                quantity_sold: s.quantity_sold,
                receipt_number: s.receipt_number,
                sold_by_id: s.sold_by_id, // Keep track of who sold it
              };
            });
          
          // Log for debugging - show all pending sales including employee sales
          if (process.env.NODE_ENV === 'development') {
            console.log('Pending sales fetched (including employee sales):', {
              totalCount: pendingSales.length,
              sales: pendingSales.map(s => ({ 
                id: s.id, 
                title: s.title, 
                status: s.status,
                sold_by_id: s.sold_by_id,
                amount: s.amount
              }))
            });
          }
        } catch (err: any) {
          console.error('Error fetching sales for approvals:', err);
          // Handle 422 (validation error) - likely due to limit being too high
          if (err.response?.status === 422) {
            console.warn('Sales API validation error (likely limit too high). Retrying with lower limit...');
            try {
              // Retry with a lower limit
              const retryResponse: any = await apiClient.getSales({ 
                status: 'pending', 
                limit: 1000  // Use backend maximum
              });
              const retryData = Array.isArray(retryResponse?.data) 
                ? retryResponse.data 
                : (retryResponse?.data && typeof retryResponse.data === 'object' && 'data' in retryResponse.data 
                  ? (retryResponse.data as any).data || [] 
                  : []);
              
              pendingSales = (retryData || [])
                .filter((s: any) => {
                  const saleStatus = (s.status?.value || s.status || 'pending')?.toLowerCase();
                  return saleStatus === 'pending' || saleStatus === 'PENDING';
                })
                .map((s: any) => ({
                  id: s.id,
                  type: 'sale' as const,
                  title: s.item_name || `Sale #${s.id}`,
                  description: s.customer_name ? `Customer: ${s.customer_name}` : `Receipt: ${s.receipt_number || `#${s.id}`}`,
                  amount: s.total_sale,
                  status: 'pending' as const,
                  requester_id: s.sold_by_id,
                  created_at: s.created_at,
                  sale_id: s.id,
                  item_name: s.item_name,
                  quantity_sold: s.quantity_sold,
                  receipt_number: s.receipt_number,
                  sold_by_id: s.sold_by_id,
                }));
            } catch (retryErr: any) {
              console.error('Retry also failed:', retryErr);
              // Still allow the page to load with other approvals
            }
          } else if (err.response?.status !== 403) {
            console.warn('Failed to fetch sales for approvals:', err.message);
            // Still allow the page to load with other approvals
          }
        }
      }

      // Combine all approvals (workflows + standalone entries without workflows + sales)
      const allApprovals = [...workflows, ...pendingRevenues, ...pendingExpenses, ...pendingSales];
      
      // Normalize status values to lowercase for consistency
      // For sales, ensure status is 'pending' if it was pending
      const normalizedApprovals = allApprovals.map(item => {
        let normalizedStatus = (item.status?.value || item.status || 'pending')?.toLowerCase();
        
        // For sales, if status is 'pending', keep it as 'pending' (don't let it become something else)
        if (item.type === 'sale' && (item.status === 'pending' || item.status?.toLowerCase() === 'pending')) {
          normalizedStatus = 'pending';
        }
        
        return {
          ...item,
          status: normalizedStatus,
        };
      });
      
      // Sort by created date (newest first)
      normalizedApprovals.sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      });

      setApprovals(normalizedApprovals);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to load approvals';
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

    // For sales, check if user can approve sales
    if (item.type === 'sale') {
      if (!canApproveSales()) {
        toast.error('Only accountants and finance managers can post sales to ledger');
        return;
      }
    }

    const itemKey = `${item.type}-${item.id}`;
    setProcessingId(itemKey);
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
      } else if (item.type === 'sale' && item.sale_id) {
        // Post sale to ledger (default accounts)
        await apiClient.postSale(item.sale_id, {
          debit_account: 'Cash',
          credit_account: 'Sales Revenue',
          reference_number: item.receipt_number || undefined,
        });
        toast.success('Sale posted to ledger successfully');
      }
      
      // Reload approvals after successful approval
      await loadApprovals();
      
      // Clear any previous errors
      setError(null);
    } catch (err: any) {
      // Handle different error types
      let errorMessage = 'Failed to approve item';
      
      if (err.response) {
        const status = err.response.status;
        const detail = err.response.data?.detail || err.response.data?.message;
        
        if (status === 403) {
          errorMessage = detail || 'You do not have permission to approve this item';
        } else if (status === 400) {
          errorMessage = detail || 'Invalid request. The item may already be processed.';
        } else if (status === 404) {
          errorMessage = detail || 'Item not found. It may have been deleted.';
        } else if (status === 500) {
          errorMessage = detail || 'Server error. Please try again later.';
        } else {
          errorMessage = detail || `Error: ${status}`;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (item: ApprovalItem, reason: string, password: string) => {
    if (!canApprove()) {
      toast.error('You do not have permission to reject items');
      return;
    }

    // For sales, only finance managers, admins, and super admins can cancel
    if (item.type === 'sale') {
      if (!canCancelSales()) {
        toast.error('Only finance managers, admins, and super admins can cancel sales');
        return;
      }
      // For sales, only require reason (no password needed)
      if (!reason.trim()) {
        setRejectPasswordError('Please provide a cancellation reason');
        return;
      }
      if (reason.trim().length < 10) {
        setRejectPasswordError('Cancellation reason must be at least 10 characters long');
        return;
      }
    } else {
      // For other items, require both reason and password
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
    }

    const itemKey = `${item.type}-${item.id}`;
    setProcessingId(itemKey);
    setError(null);
    setRejectPasswordError(null);

    try {
      if (item.type === 'workflow' && item.workflow_id) {
        await apiClient.rejectWorkflow(item.workflow_id, reason, password.trim());
        toast.success('Approval workflow rejected');
      } else if (item.type === 'revenue' && item.revenue_entry_id) {
        await apiClient.rejectItem(item.revenue_entry_id, 'revenue', reason, password.trim());
        toast.success('Revenue entry rejected');
      } else if (item.type === 'expense' && item.expense_entry_id) {
        await apiClient.rejectItem(item.expense_entry_id, 'expense', reason, password.trim());
        toast.success('Expense entry rejected');
      } else if (item.type === 'sale' && item.sale_id) {
        // Cancel sale (only finance admins)
        await apiClient.cancelSale(item.sale_id);
        toast.success('Sale cancelled successfully');
      }
      
      setShowRejectModal(null);
      setRejectionReason('');
      setRejectPassword('');
      setRejectPasswordError(null);
      
      // Reload approvals after successful rejection
      await loadApprovals();
      
      // Clear any previous errors
      setError(null);
    } catch (err: any) {
      // Handle different error types
      let errorMessage = 'Failed to reject item';
      
      if (err.response) {
        const status = err.response.status;
        const detail = err.response.data?.detail || err.response.data?.message;
        
        if (status === 403) {
          errorMessage = detail || 'You do not have permission to reject this item or the password is incorrect';
        } else if (status === 400) {
          errorMessage = detail || 'Invalid request. Please check your input.';
        } else if (status === 404) {
          errorMessage = detail || 'Item not found. It may have been deleted.';
        } else if (status === 500) {
          errorMessage = detail || 'Server error. Please try again later.';
        } else {
          errorMessage = detail || `Error: ${status}`;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setRejectPasswordError(errorMessage);
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
      case 'sale':
        return <ShoppingCart />;
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
      item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.receipt_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.item_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Handle status filter - "posted" should match "approved" for sales, and "approved" should match "posted" for sales
    let matchesStatus = false;
    if (statusFilter === 'all') {
      matchesStatus = true;
    } else if (statusFilter === 'approved' && item.status === 'posted') {
      matchesStatus = true; // Show posted sales when filtering for approved
    } else if (statusFilter === 'posted' && item.status === 'approved') {
      matchesStatus = true; // Show approved items when filtering for posted
    } else {
      matchesStatus = item.status === statusFilter;
    }
    
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
                {loading ? <SpinningIcon size={16} /> : <RefreshCw />}
                {loading ? 'Loading...' : 'Refresh'}
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
              <option value="posted">Posted</option>
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
              <option value="sale">Sales</option>
              </Select>
            </FiltersGrid>
          </FiltersContainer>

          <ApprovalsList>
          {filteredApprovals.length === 0 ? (
              <EmptyState>
                <Clock />
                <p>
                  {approvals.length === 0 
                    ? 'No pending approvals at this time' 
                    : searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                    ? 'No approvals match your filters'
                    : 'No approvals found'}
                </p>
                {(searchTerm || statusFilter !== 'all' || typeFilter !== 'all') && approvals.length > 0 && (
                  <p style={{ marginTop: theme.spacing.sm, fontSize: theme.typography.fontSizes.sm, opacity: 0.7 }}>
                    Try adjusting your search or filters
                  </p>
                )}
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
                          {item.description && (
                            <ApprovalDescription>
                              {item.description}
                            </ApprovalDescription>
                          )}
                        </div>
                        <StatusBadge $status={item.status === 'posted' ? 'approved' : item.status}>
                          {item.status === 'posted' ? 'POSTED' : item.status.toUpperCase()}
                        </StatusBadge>
                      </ApprovalHeader>
                      
                      <ApprovalMeta>
                        <span style={{ textTransform: 'capitalize' }}>{item.type}</span>
                        {item.type === 'sale' && item.item_name && (
                          <span style={{ fontWeight: theme.typography.fontWeights.medium, color: TEXT_COLOR_DARK }}>
                            Item: {item.item_name}
                            {item.quantity_sold && ` (Qty: ${item.quantity_sold})`}
                          </span>
                        )}
                        {item.type === 'sale' && item.sold_by_id && (
                          <span style={{ fontSize: theme.typography.fontSizes.xs, color: TEXT_COLOR_MUTED }}>
                            Sold by: User #{item.sold_by_id}
                          </span>
                        )}
                        {item.amount !== undefined && (
                          <span style={{ fontWeight: theme.typography.fontWeights.medium, color: TEXT_COLOR_DARK }}>
                            ${Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        )}
                        {item.type === 'sale' && item.receipt_number && (
                          <span style={{ fontSize: theme.typography.fontSizes.xs, color: TEXT_COLOR_MUTED }}>
                            Receipt: {item.receipt_number}
                          </span>
                        )}
                        <span>
                          {item.created_at ? (
                            <>
                              {new Date(item.created_at).toLocaleDateString()} at{' '}
                              {new Date(item.created_at).toLocaleTimeString()}
                            </>
                          ) : (
                            'Date not available'
                          )}
                        </span>
                        {item.approved_at && (
                          <span style={{ color: '#059669' }}>
                            Approved: {new Date(item.approved_at).toLocaleDateString()} at{' '}
                            {new Date(item.approved_at).toLocaleTimeString()}
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
                      {/* Show approve/reject buttons for pending items if user can approve */}
                      {item.status === 'pending' && (() => {
                        // For sales, check if user can approve sales
                        if (item.type === 'sale') {
                          return canApproveSales();
                        }
                        // For other types, use canApprove()
                        return canApprove();
                      })() && (
                        <>
                      <ActionButton
                        $variant="primary"
                        onClick={() => handleApprove(item)}
                        disabled={processingId === `${item.type}-${item.id}`}
                      >
                        {processingId === `${item.type}-${item.id}` ? (
                              <>
                                <SpinningIcon size={16} />
                                {item.type === 'sale' ? 'Posting...' : 'Approving...'}
                              </>
                            ) : (
                              <>
                                <CheckCircle />
                                {item.type === 'sale' ? 'Post to Ledger' : 'Approve'}
                              </>
                            )}
                          </ActionButton>
                          {/* Show reject/cancel button - for sales, only finance managers/admins can cancel */}
                          {(item.type !== 'sale' || canCancelSales()) && (
                          <ActionButton
                            $variant="danger"
                            onClick={() => {
                              setShowRejectModal(`${item.type}-${item.id}`);
                              setRejectionReason('');
                              setRejectPassword('');
                              setRejectPasswordError(null);
                            }}
                            disabled={processingId === `${item.type}-${item.id}`}
                          >
                            <XCircle />
                              {item.type === 'sale' ? 'Cancel' : 'Reject'}
                          </ActionButton>
                          )}
                        </>
                      )}
                      {/* View button - always show for all items */}
                      <ActionButton
                        $variant="secondary"
                        onClick={() => {
                          if (item.type === 'revenue') {
                            router.push(`/revenue/${item.revenue_entry_id}`);
                          } else if (item.type === 'expense') {
                            router.push(`/expenses/${item.expense_entry_id}`);
                          } else if (item.type === 'sale' && item.sale_id) {
                            router.push(`/sales/accounting?sale_id=${item.sale_id}`);
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
        {showRejectModal && (() => {
          const itemToReject = approvals.find(a => `${a.type}-${a.id}` === showRejectModal);
          if (!itemToReject) return null;
          
          return (
            <ModalOverlay onClick={() => {
              setShowRejectModal(null);
              setRejectionReason('');
              setRejectPassword('');
              setRejectPasswordError(null);
            }}>
              <ModalContent onClick={(e) => e.stopPropagation()}>
                <ModalTitle>
                  <ModalAlertIcon size={20} />
                  {itemToReject.type === 'sale' ? 'Cancel Sale' : 'Reject Approval'}
                </ModalTitle>
                
                <WarningBox>
                  <p>
                    {itemToReject.type === 'sale' 
                      ? 'You are about to cancel this sale. This action cannot be undone. Please provide a reason for cancellation.'
                      : 'You are about to reject this approval request. This action cannot be undone. Please enter your own password to verify this action.'}
                  </p>
                </WarningBox>

                <FormGroup>
                  <Label htmlFor="rejection-reason">
                    {itemToReject.type === 'sale' ? 'Cancellation Reason' : 'Rejection Reason'}
                  </Label>
                  <TextArea
                    id="rejection-reason"
                    value={rejectionReason}
                    onChange={(e) => {
                      setRejectionReason(e.target.value);
                      setRejectPasswordError(null);
                    }}
                    placeholder={itemToReject.type === 'sale' 
                      ? 'Please provide a reason for cancellation (minimum 10 characters)...'
                      : 'Please provide a reason for rejection (minimum 10 characters)...'}
                    rows={4}
                  />
                  {rejectionReason.trim().length > 0 && rejectionReason.trim().length < 10 && (
                    <ErrorText>
                      {itemToReject.type === 'sale' 
                        ? 'Cancellation reason must be at least 10 characters long'
                        : 'Rejection reason must be at least 10 characters long'}
                    </ErrorText>
                  )}
                </FormGroup>

                {itemToReject.type !== 'sale' && (
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
                        handleReject(itemToReject, rejectionReason, rejectPassword);
                      }
                    }}
                  />
                  {rejectPasswordError && (
                    <ErrorText>{rejectPasswordError}</ErrorText>
                  )}
                </FormGroup>
                )}

                {itemToReject.type === 'sale' && rejectPasswordError && (
                  <ErrorText>{rejectPasswordError}</ErrorText>
                )}

                <ModalActions>
                  <ActionButton
                    $variant="secondary"
                    onClick={() => {
                      setShowRejectModal(null);
                      setRejectionReason('');
                      setRejectPassword('');
                      setRejectPasswordError(null);
                    }}
                    disabled={processingId === showRejectModal}
                  >
                    Cancel
                  </ActionButton>
                  <ActionButton
                    $variant="danger"
                    onClick={() => {
                      handleReject(itemToReject, rejectionReason, rejectPassword);
                    }}
                    disabled={
                      !rejectionReason.trim() || 
                      rejectionReason.trim().length < 10 || 
                      (itemToReject.type !== 'sale' && !rejectPassword.trim()) || 
                      processingId === showRejectModal
                    }
                  >
                    {processingId === showRejectModal ? (
                      <>
                        <SpinningIcon size={16} />
                        {itemToReject.type === 'sale' ? 'Cancelling...' : 'Rejecting...'}
                      </>
                    ) : (
                      <>
                        <XCircle />
                        {itemToReject.type === 'sale' ? 'Cancel Sale' : 'Reject'}
                      </>
                    )}
                  </ActionButton>
                </ModalActions>
              </ModalContent>
            </ModalOverlay>
          );
        })()}
        </ContentContainer>
      </PageContainer>
    </Layout>
  );
}