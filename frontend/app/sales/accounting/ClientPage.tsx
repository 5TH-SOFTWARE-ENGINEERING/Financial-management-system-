'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import {
  DollarSign, CheckCircle, Clock,
  Loader2, BookOpen, Receipt
} from 'lucide-react';
import Layout from '@/components/layout';
import apiClient from '@/lib/api';
import { useAuth } from '@/lib/rbac/auth-context';
import { toast } from 'sonner';
import { theme } from '@/components/common/theme';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const PRIMARY_COLOR = theme.colors.primary || '#00AA00';
const TEXT_COLOR_DARK = '#111827';
const TEXT_COLOR_MUTED = theme.colors.textSecondary || '#666';

// Type definitions
interface SalesSummary {
  total_sales?: number;
  total_revenue?: number;
  pending_sales?: number;
  posted_sales?: number;
}

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

const CardShadow = `
  0 2px 4px -1px rgba(0, 0, 0, 0.06),
  0 1px 2px -1px rgba(0, 0, 0, 0.03),
  inset 0 0 0 1px rgba(0, 0, 0, 0.02)
`;

const PageContainer = styled.div`
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
  padding: ${theme.spacing.xl};
  margin-bottom: ${theme.spacing.xl};
  border-radius: ${theme.borderRadius.md};
  box-shadow: ${CardShadow};
`;

const HeaderContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: ${theme.spacing.md};
`;

const HeaderText = styled.div`
  h1 {
    font-size: clamp(24px, 3vw, 32px);
    font-weight: ${theme.typography.fontWeights.bold};
    margin: 0 0 ${theme.spacing.xs};
    color: #ffffff;
  }
  p {
    color: rgba(255, 255, 255, 0.9);
    margin: 0;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.xl};
`;

const StatCard = styled.div`
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  padding: ${theme.spacing.lg};
  box-shadow: ${CardShadow};
`;

const StatContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const StatInfo = styled.div`
  p:first-child {
    font-size: ${theme.typography.fontSizes.sm};
    color: ${TEXT_COLOR_MUTED};
    margin: 0 0 ${theme.spacing.xs};
  }
  p:last-child {
    font-size: clamp(20px, 2.5vw, 28px);
    font-weight: ${theme.typography.fontWeights.bold};
    color: ${TEXT_COLOR_DARK};
    margin: 0;
  }
`;

const TabsContainer = styled.div`
  display: flex;
  gap: ${theme.spacing.sm};
  margin-bottom: ${theme.spacing.lg};
  border-bottom: 2px solid ${theme.colors.border};
`;

const Tab = styled.button<{ $active?: boolean }>`
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  background: none;
  border: none;
  border-bottom: 2px solid ${props => props.$active ? PRIMARY_COLOR : 'transparent'};
  color: ${props => props.$active ? PRIMARY_COLOR : TEXT_COLOR_MUTED};
  font-weight: ${props => props.$active ? theme.typography.fontWeights.bold : 'normal'};
  cursor: pointer;
  transition: all ${theme.transitions.default};
  margin-bottom: -2px;

  &:hover {
    color: ${PRIMARY_COLOR};
  }
`;

const Card = styled.div`
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  padding: ${theme.spacing.xl};
  box-shadow: ${CardShadow};
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHeader = styled.thead`
  background: ${theme.colors.backgroundSecondary};
`;

const TableHeaderCell = styled.th`
  padding: ${theme.spacing.md};
  text-align: left;
  font-weight: ${theme.typography.fontWeights.bold};
  font-size: ${theme.typography.fontSizes.sm};
  color: ${TEXT_COLOR_DARK};
  border-bottom: 1px solid ${theme.colors.border};
`;

const TableRow = styled.tr`
  border-bottom: 1px solid ${theme.colors.border};
  transition: background-color ${theme.transitions.default};

  &:hover {
    background: ${theme.colors.backgroundSecondary};
  }
`;

const TableCell = styled.td`
  padding: ${theme.spacing.md};
  font-size: ${theme.typography.fontSizes.sm};
  color: ${TEXT_COLOR_DARK};
`;

const Badge = styled.span<{ $variant: 'success' | 'warning' | 'info' }>`
  display: inline-flex;
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  font-size: ${theme.typography.fontSizes.xs};
  font-weight: ${theme.typography.fontWeights.bold};
  border-radius: 9999px;
  ${(p) => {
    switch (p.$variant) {
      case 'success':
        return 'background-color: #dcfce7; color: #166534;';
      case 'warning':
        return 'background-color: #fef3c7; color: #92400e;';
      default:
        return 'background-color: #dbeafe; color: #1e40af;';
    }
  }}
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

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing.lg};
  
  h2 {
    font-size: ${theme.typography.fontSizes.lg};
    font-weight: ${theme.typography.fontWeights.bold};
    color: ${TEXT_COLOR_DARK};
    margin: 0;
  }

  button {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 24px;
    color: ${TEXT_COLOR_MUTED};
    padding: ${theme.spacing.xs};
    line-height: 1;
    transition: color ${theme.transitions.default};
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: ${theme.borderRadius.sm};

    &:hover {
      color: ${TEXT_COLOR_DARK};
      background: ${theme.colors.backgroundSecondary};
    }
  }
`;

const StyledInput = styled.input`
  width: 100%;
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  background: ${theme.colors.background};
  color: ${TEXT_COLOR_DARK};
  font-size: ${theme.typography.fontSizes.sm};
  font-family: inherit;
  transition: all ${theme.transitions.default};
  box-sizing: border-box;
  margin: 0;

  &:focus {
    outline: none;
    border-color: ${PRIMARY_COLOR};
    box-shadow: 0 0 0 3px ${PRIMARY_COLOR}15;
  }

  &:hover:not(:disabled) {
    border-color: ${PRIMARY_COLOR}80;
  }

  &:disabled {
    background: ${theme.colors.backgroundSecondary};
    cursor: not-allowed;
    opacity: 0.6;
  }

  &::placeholder {
    color: ${TEXT_COLOR_MUTED};
    opacity: 0.6;
  }
`;

const StyledTextarea = styled.textarea`
  width: 100%;
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  background: ${theme.colors.background};
  color: ${TEXT_COLOR_DARK};
  font-size: ${theme.typography.fontSizes.sm};
  font-family: inherit;
  transition: all ${theme.transitions.default};
  box-sizing: border-box;
  margin: 0;
  min-height: 60px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: ${PRIMARY_COLOR};
    box-shadow: 0 0 0 3px ${PRIMARY_COLOR}15;
  }

  &:hover:not(:disabled) {
    border-color: ${PRIMARY_COLOR}80;
  }

  &:disabled {
    background: ${theme.colors.backgroundSecondary};
    cursor: not-allowed;
    opacity: 0.6;
  }

  &::placeholder {
    color: ${TEXT_COLOR_MUTED};
    opacity: 0.6;
  }
`;

const StyledSelect = styled.select`
  width: 100%;
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  background: ${theme.colors.background};
  color: ${TEXT_COLOR_DARK};
  font-size: ${theme.typography.fontSizes.sm};
  font-family: inherit;
  cursor: pointer;
  transition: all ${theme.transitions.default};
  box-sizing: border-box;
  margin: 0;

  &:focus {
    outline: none;
    border-color: ${PRIMARY_COLOR};
    box-shadow: 0 0 0 3px ${PRIMARY_COLOR}15;
  }

  &:hover:not(:disabled) {
    border-color: ${PRIMARY_COLOR}80;
  }

  &:disabled {
    background: ${theme.colors.backgroundSecondary};
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const StyledLabel = styled(Label)`
  display: block;
  margin-bottom: ${theme.spacing.xs};
  font-weight: ${theme.typography.fontWeights.medium};
  color: ${TEXT_COLOR_DARK};
  font-size: ${theme.typography.fontSizes.sm};
`;

const FormGroup = styled.div`
  width: 100%;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.xs};
  margin-bottom: ${theme.spacing.md};

  label {
    margin-bottom: 0;
  }
`;

const ModalActions = styled.div`
  display: flex;
  gap: ${theme.spacing.md};
  justify-content: space-between;
  margin-top: ${theme.spacing.xl};
`;

interface Sale {
  id: number;
  item_id: number;
  item_name: string;
  quantity_sold: number;
  selling_price: number;
  total_sale: number;
  status: 'pending' | 'posted' | 'cancelled';
  receipt_number?: string;
  customer_name?: string;
  sold_by_id?: number;
  sold_by_name?: string;
  posted_by_id?: number;
  posted_by_name?: string;
  posted_at?: string;
  created_at: string;
}

interface JournalEntry {
  id: number;
  sale_id?: number;
  entry_date: string;
  description: string;
  debit_account: string;
  debit_amount: number;
  credit_account: string;
  credit_amount: number;
  reference_number?: string;
  posted_by_id?: number;
  posted_by_name?: string;
  posted_at: string;
}

export default function AccountingDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'sales' | 'journal'>('sales');
  const [sales, setSales] = useState<Sale[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'posted'>('pending');
  const [showPostModal, setShowPostModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [postData, setPostData] = useState({
    debit_account: 'Cash',
    credit_account: 'Sales Revenue',
    reference_number: '',
    notes: '',
  });
  const [accessibleUserIds, setAccessibleUserIds] = useState<number[] | null>(null);

  useEffect(() => {
    if (!user) {
      return; // Wait for user to load
    }
    const userRole = user?.role?.toLowerCase() || '';
    const hasAccess = userRole === 'accountant' || userRole === 'finance_manager' || userRole === 'finance_admin' || userRole === 'manager' || userRole === 'admin' || userRole === 'super_admin' || userRole === 'employee';
    if (!hasAccess) {
      router.push('/dashboard');
      return;
    }
    
    // Initialize accessible user IDs based on role (for journal entries filtering)
    const initializeAccess = async () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Initializing access for role:', userRole, 'user ID:', user?.id);
      }
      if (userRole === 'finance_manager' || userRole === 'finance_admin' || userRole === 'manager') {
        // Finance Manager/Admin: Get subordinates (accountants and employees) for journal entries filtering
        if (user?.id) {
          try {
            const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
            if (process.env.NODE_ENV === 'development') {
              console.log('Fetching subordinates for Finance Manager, user ID:', userId);
            }
            const subordinatesRes = await apiClient.getSubordinates(userId);
            const subordinates = subordinatesRes?.data || [];
            if (process.env.NODE_ENV === 'development') {
              console.log('Subordinates fetched:', subordinates.length, 'subordinates');
              if (subordinates.length > 0) {
                console.log('First subordinate sample:', subordinates[0]);
              }
            }
            const userIds = [
              userId,
              ...subordinates.map((sub: unknown) => {
                const subordinate = sub as { id: number | string };
                const subId = typeof subordinate.id === 'string' ? parseInt(subordinate.id, 10) : subordinate.id;
                return subId;
              })
            ];
            if (process.env.NODE_ENV === 'development') {
              console.log('Setting accessibleUserIds to:', userIds);
            }
            setAccessibleUserIds(userIds);
          } catch (err) {
            console.error('Failed to fetch subordinates:', err);
            const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
            if (process.env.NODE_ENV === 'development') {
              console.log('Using only finance manager ID:', userId);
            }
            setAccessibleUserIds([userId]);
          }
        } else {
          console.warn('Finance Manager has no user ID');
        }
      } else if (userRole === 'accountant' || userRole === 'employee') {
        // Accountant and Employee: Only their own data (for journal entries filtering)
        if (user?.id) {
          const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
          if (process.env.NODE_ENV === 'development') {
            console.log('Setting accessibleUserIds for', userRole, 'to:', [userId]);
          }
          setAccessibleUserIds([userId]);
        }
      } else {
        // Admin: See all (no filtering needed)
        if (process.env.NODE_ENV === 'development') {
          console.log('Admin role - no filtering needed');
        }
        setAccessibleUserIds(null);
      }
    };
    
    initializeAccess();
  }, [user, router]);

  const loadData = useCallback(async () => {
    // Double-check permissions before making API calls
    if (!user) return;
    
    const userRole = user?.role?.toLowerCase() || '';
    const hasAccess = userRole === 'accountant' || userRole === 'finance_manager' || userRole === 'finance_admin' || userRole === 'manager' || userRole === 'admin' || userRole === 'super_admin' || userRole === 'employee';
    if (!hasAccess) return;
    
    setLoading(true);
    try {
      const [salesRes, summaryRes, journalRes] = await Promise.all([
        apiClient.getSales({ status: statusFilter === 'all' ? undefined : statusFilter, limit: 1000 }).catch((err: unknown) => {
          const error = err as ErrorWithDetails;
          if (error?.response?.status === 403) {
            console.warn('Access denied to sales data');
            return { data: [] };
          }
          throw err;
        }),
        apiClient.getSalesSummary().catch((err: unknown) => {
          const error = err as ErrorWithDetails;
          if (error?.response?.status === 403) {
            console.warn('Access denied to sales summary');
            return { data: null };
          }
          throw err;
        }),
        apiClient.getJournalEntries({ limit: 1000 }).catch((err: unknown) => {
          const error = err as ErrorWithDetails;
          if (error?.response?.status === 403) {
            console.warn('Access denied to journal entries');
            return { data: [] };
          }
          throw err;
        }),
      ]);
      
      // Handle API response structure - ApiResponse wraps data in .data property
      // Backend now handles role-based filtering for sales, so we just use the response
      const salesData = Array.isArray(salesRes.data)
        ? salesRes.data
        : (Array.isArray((salesRes.data as { data?: unknown })?.data) ? (salesRes.data as { data: unknown[] }).data : []);

      const summaryData = summaryRes.data || (summaryRes.data as { data?: SalesSummary })?.data || null;
      
      // Handle journal entries - backend returns array directly or wrapped
      let journalData: JournalEntry[] = [];
      if (Array.isArray(journalRes.data)) {
        journalData = journalRes.data;
      } else if (journalRes.data && Array.isArray((journalRes.data as { data?: JournalEntry[] })?.data)) {
        journalData = (journalRes.data as { data: JournalEntry[] }).data;
      } else if (Array.isArray(journalRes)) {
        // In case the response is the array directly
        journalData = journalRes as JournalEntry[];
      } else if (journalRes && typeof journalRes === 'object' && 'data' in journalRes) {
        // Try to extract from nested structure
        const nested = (journalRes as { data?: unknown }).data;
        if (Array.isArray(nested)) {
          journalData = nested;
        }
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Raw journal entries from API:', journalData.length);
        if (journalData.length > 0) {
          console.log('Sample journal entry:', {
            id: journalData[0].id,
            posted_by_id: journalData[0].posted_by_id,
            posted_by_name: journalData[0].posted_by_name
          });
        }
        console.log('Accessible User IDs for filtering:', accessibleUserIds);
      }
      
      // Apply role-based filtering for journal entries (backend doesn't filter journal entries)
      const userRole = user?.role?.toLowerCase() || '';
      const isFinanceManager = userRole === 'finance_manager' || userRole === 'finance_admin' || userRole === 'manager';
      const isAccountant = userRole === 'accountant';
      const isEmployee = userRole === 'employee';
      
      if (isFinanceManager) {
        if (accessibleUserIds && accessibleUserIds.length > 0) {
          // Finance Manager/Admin: Filter to only journal entries posted by themselves and their subordinates
          const beforeCount = journalData.length;
          journalData = journalData.filter((entry: JournalEntry) => {
            const postedById = entry.posted_by_id;
            if (postedById === undefined || postedById === null) {
              console.warn('Journal entry missing posted_by_id:', entry.id, entry);
              return false;
            }
            const postedByIdNum = typeof postedById === 'string' ? parseInt(postedById, 10) : postedById;
            const isIncluded = accessibleUserIds.includes(postedByIdNum);
            if (!isIncluded && process.env.NODE_ENV === 'development') {
              console.log(`Journal entry ${entry.id} filtered out: posted_by_id ${postedByIdNum} not in accessibleUserIds [${accessibleUserIds.join(', ')}]`);
            }
            return isIncluded;
          });
          if (process.env.NODE_ENV === 'development') {
            console.log(`Finance Manager: Filtered ${beforeCount} journal entries to ${journalData.length}`);
          }
        } else {
          console.warn('Finance Manager: accessibleUserIds is not set yet, showing no entries');
          journalData = []; // Don't show entries until accessibleUserIds is set
        }
      } else if ((isAccountant || isEmployee) && accessibleUserIds && accessibleUserIds.length > 0) {
        // Accountant and Employee: Filter to only their own journal entries
        const beforeCount = journalData.length;
        journalData = journalData.filter((entry: JournalEntry) => {
          const postedById = entry.posted_by_id;
          if (postedById === undefined || postedById === null) {
            console.warn('Journal entry missing posted_by_id:', entry.id);
            return false;
          }
          const postedByIdNum = typeof postedById === 'string' ? parseInt(postedById, 10) : postedById;
          return accessibleUserIds.includes(postedByIdNum);
        });
        if (process.env.NODE_ENV === 'development') {
          console.log(`${isAccountant ? 'Accountant' : 'Employee'}: Filtered ${beforeCount} journal entries to ${journalData.length}`);
        }
      }
      // Admin sees all journal entries - no filtering needed
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Final journal entries count:', journalData.length);
      }
      
      // Sort by entry date (newest first) to show most recent entries at the top
      journalData.sort((a, b) => {
        const dateA = new Date(a.entry_date).getTime();
        const dateB = new Date(b.entry_date).getTime();
        return dateB - dateA;
      });
      
      setSales(salesData as Sale[]);
      setSummary(summaryData);
      setJournalEntries(journalData);
    } catch (err: unknown) {
      const error = err as ErrorWithDetails;
      const errorMessage = error?.response?.data?.detail || error?.message || 'Failed to load data';
      toast.error(errorMessage);
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }, [user, statusFilter, accessibleUserIds]);

  // Load data when accessibleUserIds is set or when statusFilter changes
  useEffect(() => {
    if (!user) return;

    const userRole = user?.role?.toLowerCase() || '';
    const hasAccess = userRole === 'accountant' || userRole === 'finance_manager' || userRole === 'finance_admin' || userRole === 'manager' || userRole === 'admin' || userRole === 'super_admin' || userRole === 'employee';
    if (!hasAccess) return;

    // For Admin, load immediately (no need to wait for accessibleUserIds)
    if (userRole === 'admin' || userRole === 'super_admin') {
      loadData();
    } else if (accessibleUserIds !== null) {
      // For other roles, wait for accessibleUserIds to be set
      loadData();
    }
  }, [user, accessibleUserIds, statusFilter, loadData]);

  const handlePostSale = (sale: Sale) => {
    setSelectedSale(sale);
    setPostData({
      debit_account: 'Cash',
      credit_account: 'Sales Revenue',
      reference_number: sale.receipt_number || '',
      notes: '',
    });
    setShowPostModal(true);
  };

  const handleConfirmPost = async () => {
    if (!selectedSale) return;

    try {
      await apiClient.postSale(selectedSale.id, postData);
      toast.success('Sale posted to ledger successfully');
      setShowPostModal(false);
      setSelectedSale(null);
      // Switch to journal tab to show the new entry
      setActiveTab('journal');
      // Small delay to ensure backend transaction is committed
      await new Promise(resolve => setTimeout(resolve, 500));
      // Reload data to get the new journal entry
      await loadData();
    } catch (err: unknown) {
      const error = err as ErrorWithDetails;
      const errorMessage = error.response?.data?.detail || 'Failed to post sale';
      toast.error(errorMessage);
    }
  };

  const userRole = user?.role?.toLowerCase() || '';
  const hasAccess = userRole === 'accountant' || userRole === 'finance_manager' || userRole === 'finance_admin' || userRole === 'manager' || userRole === 'admin' || userRole === 'super_admin' || userRole === 'employee';
  
  if (!user || !hasAccess) {
    return null;
  }

  return (
    <Layout>
      <PageContainer>
        <HeaderContainer>
          <HeaderContent>
            <HeaderText>
              <h1>
                <BookOpen size={32} style={{ marginRight: theme.spacing.md, display: 'inline' }} />
                Accounting Dashboard
              </h1>
              <p>View sales, post journal entries, and manage revenue</p>
            </HeaderText>
          </HeaderContent>
        </HeaderContainer>

        {summary && (
          <StatsGrid>
            <StatCard>
              <StatContent>
                <StatInfo>
                  <p>Total Sales</p>
                  <p>{summary.total_sales || 0}</p>
                </StatInfo>
                <Receipt size={24} color={PRIMARY_COLOR} />
              </StatContent>
            </StatCard>
            <StatCard>
              <StatContent>
                <StatInfo>
                  <p>Total Revenue</p>
                  <p style={{ color: '#16a34a' }}>
                    ${(summary.total_revenue || 0).toLocaleString()}
                  </p>
                </StatInfo>
                <DollarSign size={24} color="#16a34a" />
              </StatContent>
            </StatCard>
            <StatCard>
              <StatContent>
                <StatInfo>
                  <p>Pending Sales</p>
                  <p style={{ color: '#f59e0b' }}>{summary.pending_sales || 0}</p>
                </StatInfo>
                <Clock size={24} color="#f59e0b" />
              </StatContent>
            </StatCard>
            <StatCard>
              <StatContent>
                <StatInfo>
                  <p>Posted Sales</p>
                  <p style={{ color: '#16a34a' }}>{summary.posted_sales || 0}</p>
                </StatInfo>
                <CheckCircle size={24} color="#16a34a" />
              </StatContent>
            </StatCard>
          </StatsGrid>
        )}

        <TabsContainer>
          <Tab $active={activeTab === 'sales'} onClick={() => setActiveTab('sales')}>
            Sales ({sales.length})
          </Tab>
          <Tab $active={activeTab === 'journal'} onClick={() => setActiveTab('journal')}>
            Journal Entries ({journalEntries.length})
          </Tab>
        </TabsContainer>

        {activeTab === 'sales' && (
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.lg }}>
              <h2 style={{ margin: 0 }}>Sales Transactions</h2>
              <StyledSelect
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'pending' | 'posted')}
                style={{ width: 'auto', minWidth: '150px' }}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="posted">Posted</option>
              </StyledSelect>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: theme.spacing.xxl }}>
                <Loader2 size={32} className="animate-spin" style={{ color: PRIMARY_COLOR, margin: '0 auto' }} />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <tr>
                    <TableHeaderCell>Receipt #</TableHeaderCell>
                    <TableHeaderCell>Item Name</TableHeaderCell>
                    <TableHeaderCell>Quantity Sold</TableHeaderCell>
                    <TableHeaderCell>Selling Price</TableHeaderCell>
                    <TableHeaderCell>Revenue</TableHeaderCell>
                    <TableHeaderCell>Customer</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                    <TableHeaderCell>Date</TableHeaderCell>
                    <TableHeaderCell>Actions</TableHeaderCell>
                  </tr>
                </TableHeader>
                <tbody>
                  {sales.length === 0 ? (
                    <tr>
                      <TableCell colSpan={9} style={{ textAlign: 'center', padding: theme.spacing.xxl, color: TEXT_COLOR_MUTED }}>
                        No sales found
                      </TableCell>
                    </tr>
                  ) : (
                    sales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell>{sale.receipt_number || `#${sale.id}`}</TableCell>
                        <TableCell>{sale.item_name}</TableCell>
                        <TableCell>{sale.quantity_sold}</TableCell>
                        <TableCell>${Number(sale.selling_price).toFixed(2)}</TableCell>
                        <TableCell style={{ fontWeight: 'bold' }}>${Number(sale.total_sale).toFixed(2)}</TableCell>
                        <TableCell>{sale.customer_name || '-'}</TableCell>
                        <TableCell>
                          <Badge $variant={sale.status === 'posted' ? 'success' : 'warning'}>
                            {sale.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(sale.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {sale.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => handlePostSale(sale)}
                            >
                              Post
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </tbody>
              </Table>
            )}
          </Card>
        )}

        {activeTab === 'journal' && (
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.lg }}>
              <h2 style={{ margin: 0 }}>Journal Entries</h2>
              {(userRole === 'admin' || userRole === 'super_admin') && (
                <Badge $variant="info" style={{ fontSize: theme.typography.fontSizes.xs }}>
                  Viewing all entries
                </Badge>
              )}
              {(userRole === 'finance_manager' || userRole === 'finance_admin' || userRole === 'manager') && (
                <Badge $variant="info" style={{ fontSize: theme.typography.fontSizes.xs }}>
                  Viewing team entries
                </Badge>
              )}
            </div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: theme.spacing.xxl }}>
                <Loader2 size={32} className="animate-spin" style={{ color: PRIMARY_COLOR, margin: '0 auto' }} />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <tr>
                    <TableHeaderCell>Date</TableHeaderCell>
                    <TableHeaderCell>Description</TableHeaderCell>
                    <TableHeaderCell>Debit Account</TableHeaderCell>
                    <TableHeaderCell>Debit Amount</TableHeaderCell>
                    <TableHeaderCell>Credit Account</TableHeaderCell>
                    <TableHeaderCell>Credit Amount</TableHeaderCell>
                    <TableHeaderCell>Reference</TableHeaderCell>
                    <TableHeaderCell>Posted By</TableHeaderCell>
                  </tr>
                </TableHeader>
                <tbody>
                  {journalEntries.length === 0 ? (
                    <tr>
                      <TableCell colSpan={8} style={{ textAlign: 'center', padding: theme.spacing.xxl, color: TEXT_COLOR_MUTED }}>
                        No journal entries found
                      </TableCell>
                    </tr>
                  ) : (
                    journalEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{new Date(entry.entry_date).toLocaleDateString()}</TableCell>
                        <TableCell>{entry.description}</TableCell>
                        <TableCell>{entry.debit_account}</TableCell>
                        <TableCell>${Number(entry.debit_amount).toFixed(2)}</TableCell>
                        <TableCell>{entry.credit_account}</TableCell>
                        <TableCell>${Number(entry.credit_amount).toFixed(2)}</TableCell>
                        <TableCell>{entry.reference_number || '-'}</TableCell>
                        <TableCell>{entry.posted_by_name || '-'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </tbody>
              </Table>
            )}
          </Card>
        )}

        {/* Post Sale Modal */}
        {showPostModal && selectedSale && (
          <ModalOverlay onClick={() => setShowPostModal(false)}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
              <ModalHeader>
                <h2>Post Sale to Ledger</h2>
                <button onClick={() => setShowPostModal(false)}>
                  ×
                </button>
              </ModalHeader>

              <div style={{ marginBottom: theme.spacing.md }}>
                <p style={{ margin: 0, marginBottom: theme.spacing.xs, fontWeight: 'bold' }}>
                  Sale: {selectedSale.item_name}
                </p>
                <p style={{ margin: 0, fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_MUTED }}>
                  Amount: ${Number(selectedSale.total_sale).toFixed(2)}
                </p>
              </div>

              <FormGroup>
                <StyledLabel htmlFor="debit_account">Debit Account</StyledLabel>
                <StyledInput
                  id="debit_account"
                  type="text"
                  value={postData.debit_account}
                  onChange={(e) => setPostData({ ...postData, debit_account: e.target.value })}
                />
              </FormGroup>

              <FormGroup>
                <StyledLabel htmlFor="credit_account">Credit Account</StyledLabel>
                <StyledInput
                  id="credit_account"
                  type="text"
                  value={postData.credit_account}
                  onChange={(e) => setPostData({ ...postData, credit_account: e.target.value })}
                />
              </FormGroup>

              <FormGroup>
                <StyledLabel htmlFor="reference_number">Reference Number</StyledLabel>
                <StyledInput
                  id="reference_number"
                  type="text"
                  value={postData.reference_number}
                  onChange={(e) => setPostData({ ...postData, reference_number: e.target.value })}
                />
              </FormGroup>

              <FormGroup>
                <StyledLabel htmlFor="notes">Notes</StyledLabel>
                <StyledTextarea
                  id="notes"
                  value={postData.notes}
                  onChange={(e) => setPostData({ ...postData, notes: e.target.value })}
                  placeholder="Optional notes for this journal entry"
                />
              </FormGroup>

              <ModalActions>
                <Button variant="outline" onClick={() => setShowPostModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleConfirmPost}>
                  Post to Ledger
                </Button>
              </ModalActions>
            </ModalContent>
          </ModalOverlay>
        )}
      </PageContainer>
    </Layout>
  );
}

