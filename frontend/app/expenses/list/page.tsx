'use client';
import { useState, useEffect } from 'react';
import styled from 'styled-components';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  DollarSign,
  Search,
  Loader2,
  CheckCircle,
  XCircle
} from 'lucide-react';
import Layout from '@/components/layout';
import apiClient from '@/lib/api';
import { toast } from 'sonner';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useAuth } from '@/lib/rbac/auth-context';
import { useUserStore } from '@/store/userStore';
import { theme } from '@/components/common/theme';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

const PRIMARY_COLOR = theme.colors.primary || '#00AA00';
const TEXT_COLOR_DARK = '#111827';
const TEXT_COLOR_MUTED = theme.colors.textSecondary || '#666';

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
  max-width: 980px;
  margin-left: auto;
  margin-right: 0;
  padding: ${theme.spacing.sm} ${theme.spacing.sm} ${theme.spacing.sm};
`;

const HeaderContainer = styled.div`
  background: linear-gradient(135deg, ${PRIMARY_COLOR} 0%, #008800 100%);
  color: #ffffff;
  padding: ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.lg};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-radius: ${theme.borderRadius.md};
  border-bottom: 3px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: ${theme.spacing.md};
`;

const HeaderContent = styled.div`
  flex: 1;
  
  h1 {
    font-size: clamp(24px, 3vw, 36px);
    font-weight: ${theme.typography.fontWeights.bold};
    margin: 0 0 ${theme.spacing.xs};
    color: #ffffff;
  }
  
  p {
    font-size: ${theme.typography.fontSizes.md};
    font-weight: ${theme.typography.fontWeights.medium};
    opacity: 0.9;
    margin: 0;
    color: rgba(255, 255, 255, 0.95);
  }
`;

const AddButton = styled(Button)`
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #ffffff;
  backdrop-filter: blur(8px);
  transition: all ${theme.transitions.default};

  &:hover {
    background: rgba(255, 255, 255, 0.25);
    border-color: rgba(255, 255, 255, 0.5);
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
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

const TableContainer = styled.div`
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

  h3 {
    font-size: ${theme.typography.fontSizes.lg};
    font-weight: ${theme.typography.fontWeights.bold};
    margin: 0 0 ${theme.spacing.sm};
    color: ${TEXT_COLOR_DARK};
  }

  p {
    font-size: ${theme.typography.fontSizes.md};
    margin: 0 0 ${theme.spacing.md};
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
`;

const TableHeader = styled.thead`
  background: ${theme.colors.backgroundSecondary};
  border-bottom: 2px solid ${theme.colors.border};
  
  th {
    text-align: left;
    padding: ${theme.spacing.md} ${theme.spacing.lg};
    font-weight: ${theme.typography.fontWeights.medium};
    color: ${TEXT_COLOR_MUTED};
    font-size: ${theme.typography.fontSizes.xs};
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
`;

const TableBody = styled.tbody`
  tr {
    border-bottom: 1px solid ${theme.colors.border};
    transition: background-color ${theme.transitions.default};
    
    &:hover {
      background-color: ${theme.colors.backgroundSecondary};
    }
    
    &:last-child {
      border-bottom: none;
    }
    
    td {
      padding: ${theme.spacing.md} ${theme.spacing.lg};
      color: ${TEXT_COLOR_DARK};
      font-size: ${theme.typography.fontSizes.sm};
    }
  }
`;

const StatusBadge = styled.span<{ $status: 'approved' | 'pending' | 'rejected' }>`
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.sm};
  font-size: ${theme.typography.fontSizes.xs};
  font-weight: ${theme.typography.fontWeights.medium};
  margin-right: ${theme.spacing.sm};
  background: ${props => {
    if (props.$status === 'approved') return 'rgba(16, 185, 129, 0.12)';
    if (props.$status === 'rejected') return 'rgba(239, 68, 68, 0.12)';
    return 'rgba(251, 191, 36, 0.12)';
  }};
  color: ${props => {
    if (props.$status === 'approved') return '#065f46';
    if (props.$status === 'rejected') return '#991b1b';
    return '#92400e';
  }};
`;

const RecurringBadge = styled.span`
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.sm};
  font-size: ${theme.typography.fontSizes.xs};
  font-weight: ${theme.typography.fontWeights.medium};
  background: rgba(59, 130, 246, 0.12);
  color: #1e40af;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: ${theme.spacing.sm};
  align-items: center;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'danger' | 'secondary' }>`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.xs};
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.typography.fontSizes.xs};
  font-weight: ${theme.typography.fontWeights.medium};
  cursor: pointer;
  transition: all ${theme.transitions.default};
  background: ${theme.colors.background};
  color: ${TEXT_COLOR_DARK};

  ${props => {
    if (props.$variant === 'danger') {
      return `
        background: #ef4444;
        color: white;
        border-color: #ef4444;
        
        &:hover:not(:disabled) {
          background: #dc2626;
          transform: translateY(-1px);
        }
      `;
    }
    return `
      &:hover:not(:disabled) {
        background: ${theme.colors.backgroundSecondary};
        border-color: ${PRIMARY_COLOR};
        color: ${PRIMARY_COLOR};
      }
    `;
  }}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  svg {
    width: 14px;
    height: 14px;
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
    margin: 0;
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

const ExpenseTitle = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  
  svg {
    width: 16px;
    height: 16px;
    color: ${TEXT_COLOR_MUTED};
    flex-shrink: 0;
  }
  
  span {
    font-weight: ${theme.typography.fontWeights.medium};
    color: ${TEXT_COLOR_DARK};
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

const StyledLabel = styled.label`
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
  created_by_id: number;
  created_at: string;
  updated_at?: string | null;
  approval_status?: 'pending' | 'approved' | 'rejected';
}

export default function ExpenseListPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { canApproveTransactions } = useUserStore();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [showRejectModal, setShowRejectModal] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [rejectPassword, setRejectPassword] = useState<string>('');
  const [rejectPasswordError, setRejectPasswordError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<number | null>(null);
  const [deletePassword, setDeletePassword] = useState<string>('');
  const [deletePasswordError, setDeletePasswordError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const getStatus = (expense: Expense) =>
    expense.approval_status || (expense.is_approved ? 'approved' : 'pending');
  const normalizeExpenses = (items: any[]): Expense[] =>
    (items || []).map((exp: any) => ({
      ...exp,
      approval_status: exp?.approval_status || (exp?.is_approved ? 'approved' : 'pending')
    }));
  
  const canApprove = () => {
    if (canApproveTransactions()) return true;
    if (!user) return false;
    const role = user.role?.toLowerCase();
    return role === 'admin' || role === 'super_admin' || role === 'manager' || role === 'finance_manager';
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.getExpenses();
      setExpenses(normalizeExpenses(response.data));
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to load expenses';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id: number) => {
    setShowDeleteModal(id);
    setDeletePassword('');
    setDeletePasswordError(null);
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(null);
    setDeletePassword('');
    setDeletePasswordError(null);
  };

  const handleDelete = async (id: number, password: string) => {
    if (!password.trim()) {
      setDeletePasswordError('Password is required');
      return;
    }

    setDeletingId(id);
    setDeletePasswordError(null);

    try {
      await apiClient.deleteExpense(id, password.trim());
      toast.success('Expense deleted successfully');
      setShowDeleteModal(null);
      setDeletePassword('');
      loadExpenses();
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to delete expense';
      setDeletePasswordError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setDeletingId(null);
    }
  };

  const handleApprove = async (id: number) => {
    if (!canApprove()) {
      toast.error('You do not have permission to approve expenses');
      return;
    }

    setApprovingId(id);
    try {
      await apiClient.approveItem(id, 'expense');
      toast.success('Expense approved successfully');
      setExpenses(prev =>
        prev.map(exp =>
          exp.id === id
            ? { ...exp, is_approved: true, approval_status: 'approved' }
            : exp
        )
      );
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to approve expense';
      toast.error(errorMessage);
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (id: number, reason: string, password: string) => {
    if (!canApprove()) {
      toast.error('You do not have permission to reject expenses');
      return;
    }

    if (!reason.trim()) {
      setRejectPasswordError('Please provide a rejection reason');
      return;
    }

    if (!password.trim()) {
      setRejectPasswordError('Password is required');
      return;
    }

    setRejectingId(id);
    setRejectPasswordError(null);
    try {
      await apiClient.rejectItem(id, 'expense', reason, password.trim());
      toast.success('Expense rejected successfully');
      setShowRejectModal(null);
      setRejectionReason('');
      setRejectPassword('');
      setExpenses(prev =>
        prev.map(exp =>
          exp.id === id ? { ...exp, approval_status: 'rejected', is_approved: false } : exp
        )
      );
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to reject expense';
      setRejectPasswordError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setRejectingId(null);
    }
  };

  const getItemType = (title: string): string => {
    if (!title) return '';
    
    if (title.toLowerCase().startsWith('item:')) {
      const match = title.match(/item:\s*([^,]+)/i);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    const buyAtIndex = title.toLowerCase().indexOf('buy-at');
    if (buyAtIndex > 0) {
      return title.substring(0, buyAtIndex).trim().replace(/^item:\s*/i, '').trim();
    }
    
    return title.trim();
  };

  const categories = Array.from(new Set(expenses.map(e => e.category).filter(Boolean)));

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = 
      expense.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.vendor?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter;
    const status = getStatus(expense);
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'approved' && status === 'approved') ||
      (statusFilter === 'pending' && status === 'pending') ||
      (statusFilter === 'rejected' && status === 'rejected');
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (loading) {
    return (
      <Layout>
        <PageContainer>
          <ContentContainer>
            <LoadingContainer>
              <Spinner />
              <p>Loading expenses...</p>
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
              <h1>Expenses</h1>
              <p>Manage expense entries</p>
            </HeaderContent>
            <Link href="/expenses/items">
              <AddButton>
                <Plus size={16} style={{ marginRight: theme.spacing.xs }} />
                Add Expenses
              </AddButton>
            </Link>
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
                  placeholder="Search expenses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </SearchContainer>
              
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                ))}
              </Select>
              
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </Select>
            </FiltersGrid>
          </FiltersContainer>

          <TableContainer>
            {filteredExpenses.length === 0 ? (
              <EmptyState>
                <DollarSign />
                <h3>
                  {expenses.length === 0 ? 'No expenses found' : 'No expenses match your filters'}
                </h3>
                <p>
                  {expenses.length === 0 
                    ? 'Get started by adding your first expense entry.' 
                    : 'Try adjusting your search or filter criteria.'}
                </p>
                {expenses.length === 0 && (
                  <Link href="/expenses/items" style={{ marginTop: theme.spacing.md, display: 'inline-block' }}>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Expenses
                    </Button>
                  </Link>
                )}
              </EmptyState>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <Table>
                  <TableHeader>
                    <tr>
                      <th>Type</th>
                      <th>Category</th>
                      <th>Amount</th>
                      <th>Vendor</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </TableHeader>
                  <TableBody>
                    {filteredExpenses.map((expense) => {
                      const status = getStatus(expense);
                      const isPending = status === 'pending';
                      return (
                      <tr key={expense.id}>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <ExpenseTitle>
                            <DollarSign />
                            <span>{getItemType(expense.title)}</span>
                          </ExpenseTitle>
                        </td>
                        <td style={{ whiteSpace: 'nowrap', textTransform: 'capitalize' }}>
                          {expense.category || 'N/A'}
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <span style={{ fontWeight: theme.typography.fontWeights.bold, color: TEXT_COLOR_DARK }}>
                            {formatCurrency(expense.amount)}
                          </span>
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>{expense.vendor || 'N/A'}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>{formatDate(expense.date)}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <StatusBadge $status={status}>
                            {status === 'approved'
                              ? 'Approved'
                              : status === 'rejected'
                              ? 'Rejected'
                              : 'Pending'}
                          </StatusBadge>
                          {expense.is_recurring && (
                            <RecurringBadge>Recurring</RecurringBadge>
                          )}
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <ActionButtons>
                            <Link href={`/expenses/edit/${expense.id}`}>
                              <ActionButton $variant="secondary" title="Edit">
                                <Edit />
                              </ActionButton>
                            </Link>
                            {isPending && !expense.is_approved && canApprove() && (
                              <>
                                <ActionButton
                                  $variant="primary"
                                  onClick={() => handleApprove(expense.id)}
                                  disabled={approvingId === expense.id || rejectingId === expense.id}
                                  style={{ background: PRIMARY_COLOR, color: 'white', borderColor: PRIMARY_COLOR }}
                                >
                                  {approvingId === expense.id ? (
                                    <Loader2 style={{ animation: 'spin 1s linear infinite' }} />
                                  ) : (
                                    <CheckCircle />
                                  )}
                                  Approve
                                </ActionButton>
                                <ActionButton
                                  $variant="danger"
                                  onClick={() => {
                                    setShowRejectModal(expense.id);
                                    setRejectionReason('');
                                    setRejectPassword('');
                                    setRejectPasswordError(null);
                                  }}
                                  disabled={approvingId === expense.id || rejectingId === expense.id}
                                >
                                  <XCircle />
                                  Reject
                                </ActionButton>
                              </>
                            )}
                            <ActionButton
                              $variant="danger"
                              onClick={() => handleDeleteClick(expense.id)}
                              disabled={deletingId === expense.id || approvingId === expense.id || rejectingId === expense.id}
                              style={{ color: '#dc2626' }}
                              title="Delete"
                            >
                              {deletingId === expense.id ? (
                                <Loader2 style={{ animation: 'spin 1s linear infinite' }} />
                              ) : (
                                <Trash2 />
                              )}
                            </ActionButton>
                          </ActionButtons>
                        </td>
                      </tr>
                    );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </TableContainer>

          {/* Rejection Modal */}
          {showRejectModal && (
            <ModalOverlay onClick={() => {
              setShowRejectModal(null);
              setRejectionReason('');
              setRejectPassword('');
              setRejectPasswordError(null);
            }}>
              <ModalContent onClick={(e) => e.stopPropagation()}>
                <ModalTitle>
                  <ModalAlertIcon size={20} />
                  Reject Expense Entry
                </ModalTitle>
                
                <WarningBox>
                  <p>
                    You are about to reject this expense entry. This action cannot be undone.
                    Please enter your own password to verify this action.
                  </p>
                </WarningBox>

                <FormGroup>
                  <StyledLabel htmlFor="rejection-reason">Rejection Reason *</StyledLabel>
                  <TextArea
                    id="rejection-reason"
                    value={rejectionReason}
                    onChange={(e) => {
                      setRejectionReason(e.target.value);
                      setRejectPasswordError(null);
                    }}
                    placeholder="Please provide a reason for rejection..."
                    rows={4}
                  />
                </FormGroup>

                <FormGroup>
                  <StyledLabel htmlFor="reject-password">
                    Enter your own password to confirm rejection:
                  </StyledLabel>
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
                      if (e.key === 'Enter' && rejectionReason.trim() && rejectPassword.trim() && showRejectModal !== null) {
                        handleReject(showRejectModal, rejectionReason, rejectPassword);
                      }
                    }}
                  />
                  {rejectPasswordError && (
                    <ErrorText>{rejectPasswordError}</ErrorText>
                  )}
                </FormGroup>

                <ModalActions>
                  <ActionButton
                    $variant="secondary"
                    onClick={() => {
                      setShowRejectModal(null);
                      setRejectionReason('');
                      setRejectPassword('');
                      setRejectPasswordError(null);
                    }}
                    disabled={rejectingId === showRejectModal}
                  >
                    Cancel
                  </ActionButton>
                  <ActionButton
                    $variant="danger"
                    onClick={() => {
                      if (showRejectModal !== null) {
                        handleReject(showRejectModal, rejectionReason, rejectPassword);
                      }
                    }}
                    disabled={!rejectionReason.trim() || !rejectPassword.trim() || rejectingId === showRejectModal || showRejectModal === null}
                  >
                    {rejectingId === showRejectModal ? (
                      <>
                        <Loader2 style={{ animation: 'spin 1s linear infinite' }} />
                        Rejecting...
                      </>
                    ) : (
                      <>
                        <XCircle />
                        Reject
                      </>
                    )}
                  </ActionButton>
                </ModalActions>
              </ModalContent>
            </ModalOverlay>
          )}

          {/* Delete Modal */}
          {showDeleteModal && (() => {
            const expenseToDelete = expenses.find((e: Expense) => e.id === showDeleteModal);
            
            return (
              <ModalOverlay onClick={handleDeleteCancel}>
                <ModalContent onClick={(e) => e.stopPropagation()}>
                  <ModalTitle>
                    <ModalAlertIcon size={20} />
                    Delete Expense Entry
                  </ModalTitle>
                  
                  <WarningBox>
                    <p>
                      You are about to permanently delete this expense entry. This action cannot be undone.
                      Please enter your own password to verify this action.
                    </p>
                  </WarningBox>

                  {expenseToDelete && (
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
                        Expense Entry Details to be Deleted:
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                          <strong style={{ minWidth: '120px', fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_DARK }}>Title:</strong>
                          <span style={{ fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_MUTED }}>
                            {getItemType(expenseToDelete.title) || expenseToDelete.title || 'N/A'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                          <strong style={{ minWidth: '120px', fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_DARK }}>Category:</strong>
                          <span style={{ fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_MUTED, textTransform: 'capitalize' }}>
                            {expenseToDelete.category || 'N/A'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                          <strong style={{ minWidth: '120px', fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_DARK }}>Amount:</strong>
                          <span style={{ fontSize: theme.typography.fontSizes.sm, fontWeight: theme.typography.fontWeights.bold, color: TEXT_COLOR_DARK }}>
                            {formatCurrency(expenseToDelete.amount)}
                          </span>
                        </div>
                        {expenseToDelete.vendor && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                            <strong style={{ minWidth: '120px', fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_DARK }}>Vendor:</strong>
                            <span style={{ fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_MUTED }}>
                              {expenseToDelete.vendor}
                            </span>
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                          <strong style={{ minWidth: '120px', fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_DARK }}>Date:</strong>
                          <span style={{ fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_MUTED }}>
                            {formatDate(expenseToDelete.date)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                          <strong style={{ minWidth: '120px', fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_DARK }}>Status:</strong>
                          {(() => {
                            const status = getStatus(expenseToDelete as Expense);
                            return (
                              <StatusBadge $status={status}>
                                {status === 'approved'
                                  ? 'Approved'
                                  : status === 'rejected'
                                  ? 'Rejected'
                                  : 'Pending'}
                              </StatusBadge>
                            );
                          })()}
                          {expenseToDelete.is_recurring && (
                            <RecurringBadge>Recurring</RecurringBadge>
                          )}
                        </div>
                        {expenseToDelete.description && (
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: theme.spacing.sm }}>
                            <strong style={{ minWidth: '120px', fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_DARK }}>Description:</strong>
                            <span style={{ fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_MUTED, flex: 1 }}>
                              {expenseToDelete.description}
                            </span>
                          </div>
                        )}
                        {expenseToDelete.recurring_frequency && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                            <strong style={{ minWidth: '120px', fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_DARK }}>Frequency:</strong>
                            <span style={{ fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_MUTED }}>
                              {expenseToDelete.recurring_frequency}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <FormGroup>
                    <StyledLabel htmlFor="delete-password">
                      Enter your own password to confirm deletion:
                    </StyledLabel>
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
                      if (e.key === 'Enter' && deletePassword.trim() && showDeleteModal !== null) {
                        handleDelete(showDeleteModal, deletePassword);
                      }
                    }}
                  />
                  {deletePasswordError && (
                    <ErrorText>{deletePasswordError}</ErrorText>
                  )}
                </FormGroup>

                <ModalActions>
                  <ActionButton
                    $variant="secondary"
                    onClick={handleDeleteCancel}
                    disabled={deletingId === showDeleteModal}
                  >
                    Cancel
                  </ActionButton>
                  <ActionButton
                    $variant="danger"
                    onClick={() => {
                      if (showDeleteModal !== null) {
                        handleDelete(showDeleteModal, deletePassword);
                      }
                    }}
                    disabled={!deletePassword.trim() || deletingId === showDeleteModal || showDeleteModal === null}
                  >
                    {deletingId === showDeleteModal ? (
                      <>
                        <Loader2 style={{ animation: 'spin 1s linear infinite' }} />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 />
                        Delete
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
