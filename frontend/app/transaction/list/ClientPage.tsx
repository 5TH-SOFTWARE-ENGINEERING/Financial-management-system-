'use client';
import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  TrendingUp,
  ShoppingCart,
  Package
} from 'lucide-react';
import Layout from '@/components/layout';
import apiClient from '@/lib/api';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { formatCurrency, formatDate } from '@/lib/utils';
import { theme } from '@/components/common/theme';
import { useAuth } from '@/lib/rbac/auth-context';

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

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.lg};
`;

const BottomSummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.lg};

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const SummaryCard = styled.div<{ $type?: 'revenue' | 'expense' | 'net' | 'total' | 'inventory' }>`
  background: ${theme.colors.background};
  border: 1px solid ${theme.colors.border};
  padding: ${theme.spacing.lg};
  border-radius: ${theme.borderRadius.md};
  box-shadow: ${CardShadow};
  transition: transform ${theme.transitions.default}, box-shadow ${theme.transitions.default};

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${CardShadowHover};
  }

  .label {
    font-size: ${theme.typography.fontSizes.sm};
    color: ${TEXT_COLOR_MUTED};
    margin-bottom: ${theme.spacing.sm};
    font-weight: ${theme.typography.fontWeights.medium};
  }

  .value {
    font-size: clamp(20px, 3vw, 24px);
    font-weight: ${theme.typography.fontWeights.bold};
    color: ${props => {
      if (props.$type === 'revenue') return '#16a34a';
      if (props.$type === 'expense') return '#dc2626';
      if (props.$type === 'net') return TEXT_COLOR_DARK;
      return TEXT_COLOR_DARK;
    }};
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
    margin: 0;
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

const TypeBadge = styled.span<{ $type: 'revenue' | 'expense' | 'sale' | 'inventory' }>`
  display: inline-flex;
  align-items: center;
  gap: ${theme.spacing.xs};
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.sm};
  font-size: ${theme.typography.fontSizes.xs};
  font-weight: ${theme.typography.fontWeights.medium};
  background: ${props => {
    if (props.$type === 'revenue') return 'rgba(16, 185, 129, 0.12)';
    if (props.$type === 'expense') return 'rgba(239, 68, 68, 0.12)';
    if (props.$type === 'sale') return 'rgba(59, 130, 246, 0.12)';
    if (props.$type === 'inventory') return 'rgba(168, 85, 247, 0.12)';
    return 'rgba(107, 114, 128, 0.12)';
  }};
  color: ${props => {
    if (props.$type === 'revenue') return '#065f46';
    if (props.$type === 'expense') return '#991b1b';
    if (props.$type === 'sale') return '#1e40af';
    if (props.$type === 'inventory') return '#6b21a8';
    return '#374151';
  }};
`;

const AmountCell = styled.td<{ $isExpense: boolean }>`
  font-weight: ${theme.typography.fontWeights.bold};
  color: ${props => props.$isExpense ? '#dc2626' : '#16a34a'} !important;
`;

const CategoryBadge = styled.span`
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.sm};
  font-size: ${theme.typography.fontSizes.xs};
  font-weight: ${theme.typography.fontWeights.medium};
  background: rgba(59, 130, 246, 0.12);
  color: #1e40af;
`;

const StatusBadge = styled.span<{ $approved: boolean; $status?: string }>`
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.sm};
  font-size: ${theme.typography.fontSizes.xs};
  font-weight: ${theme.typography.fontWeights.medium};
  background: ${props => {
    if (props.$status === 'posted') return 'rgba(16, 185, 129, 0.12)';
    if (props.$status === 'cancelled') return 'rgba(239, 68, 68, 0.12)';
    if (props.$approved) return 'rgba(16, 185, 129, 0.12)';
    return 'rgba(251, 191, 36, 0.12)';
  }};
  color: ${props => {
    if (props.$status === 'posted') return '#065f46';
    if (props.$status === 'cancelled') return '#991b1b';
    if (props.$approved) return '#065f46';
    return '#92400e';
  }};
  margin-right: ${theme.spacing.sm};
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

const TransactionTitle = styled.div`
  font-weight: ${theme.typography.fontWeights.medium};
  color: ${TEXT_COLOR_DARK};
`;

const TransactionDescription = styled.div`
  font-size: ${theme.typography.fontSizes.xs};
  color: ${TEXT_COLOR_MUTED};
  margin-top: ${theme.spacing.xs};
`;

interface Transaction {
  id: string;
  transaction_type: 'revenue' | 'expense' | 'sale' | 'inventory';
  title: string;
  description?: string | null;
  category: string;
  amount: number;
  date: string;
  is_approved: boolean;
  is_recurring?: boolean;
  recurring_frequency?: string | null;
  source?: string | null;
  vendor?: string | null;
  created_at: string;
  status?: 'pending' | 'posted' | 'cancelled' | 'active' | 'inactive';
  item_name?: string;
  quantity_sold?: number;
  quantity?: number;
  receipt_number?: string;
  customer_name?: string;
  sku?: string;
  buying_price?: number;
  total_cost?: number;
  created_by_id?: number;
  sold_by_id?: number;
}

export default function TransactionListPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [accessibleUserIds, setAccessibleUserIds] = useState<number[] | null>(null);

  useEffect(() => {
    if (user) {
      loadTransactions();
    }
  }, [user]);

  const loadTransactions = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const userRole = user?.role?.toLowerCase();
      const isAdmin = userRole === 'admin' || userRole === 'super_admin';
      const isFinanceAdmin = userRole === 'finance_manager' || userRole === 'finance_admin';
      const isAccountant = userRole === 'accountant';
      const isEmployee = userRole === 'employee';

      // Get accessible user IDs for Finance Admin (themselves + subordinates)
      let userIds: number[] | null = null;
      if (isFinanceAdmin && user?.id) {
        try {
          const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
          const subordinatesRes = await apiClient.getSubordinates(userId);
          const subordinates = subordinatesRes?.data || [];
          userIds = [userId, ...subordinates.map((sub: any) => {
            const subId = typeof sub.id === 'string' ? parseInt(sub.id, 10) : sub.id;
            return subId;
          })];
          setAccessibleUserIds(userIds);
        } catch (err) {
          console.warn('Failed to fetch subordinates, using only finance admin ID:', err);
          const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
          userIds = [userId];
          setAccessibleUserIds(userIds);
        }
      } else if ((isAccountant || isEmployee) && user?.id) {
        // Accountant and Employee can only see their own
        const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
        userIds = [userId];
        setAccessibleUserIds(userIds);
      } else {
        // Admin can see all - no filtering needed
        setAccessibleUserIds(null);
      }

      // Fetch revenues, expenses, sales, and inventory items
      // Backend should already filter for most roles, but we'll apply additional filtering for Finance Admin
      const [transactionsResponse, salesResponse, inventoryResponse] = await Promise.all([
        apiClient.getTransactions().catch(() => ({ data: [] })),
        apiClient.getSales({ limit: 1000 }).catch(() => ({ data: [] })),
        apiClient.getInventoryItems({ limit: 1000 }).catch(() => ({ data: [] })),
      ]);

      let transactions = transactionsResponse.data || [];
      
      // Transform sales to transaction format
      const salesData: any = salesResponse?.data || [];
      let salesTransactions = (Array.isArray(salesData) ? salesData : (salesData?.data || [])).map((sale: any) => ({
        id: `sale-${sale.id}`,
        transaction_type: 'sale' as const,
        title: sale.item_name || `Sale #${sale.id}`,
        description: sale.customer_name ? `Customer: ${sale.customer_name}` : sale.notes || `Receipt: ${sale.receipt_number || `#${sale.id}`}`,
        category: sale.item?.category || 'Sales',
        amount: sale.total_sale || 0,
        date: sale.created_at || sale.date,
        is_approved: sale.status === 'posted',
        created_at: sale.created_at,
        status: sale.status || 'pending',
        item_name: sale.item_name,
        quantity_sold: sale.quantity_sold,
        receipt_number: sale.receipt_number,
        customer_name: sale.customer_name,
        sold_by_id: sale.sold_by_id || sale.soldBy || sale.sold_by,
        created_by_id: sale.created_by_id || sale.createdBy || sale.created_by,
      }));

      // Transform inventory items to transaction format (treating creation as expense)
      const inventoryData: any = inventoryResponse?.data || [];
      let inventoryTransactions = (Array.isArray(inventoryData) ? inventoryData : (inventoryData?.data || [])).map((item: any) => {
        // Calculate total cost for the initial quantity
        const totalCost = (item.total_cost || item.buying_price || 0) * (item.quantity || 0);
        return {
          id: `inventory-${item.id}`,
          transaction_type: 'inventory' as const,
          title: item.item_name || `Inventory Item #${item.id}`,
          description: item.description || `SKU: ${item.sku || 'N/A'}`,
          category: item.category || 'Inventory',
          amount: totalCost, // Total cost of inventory purchase
          date: item.created_at || item.date,
          is_approved: item.is_active !== false, // Active items are considered "approved"
          created_at: item.created_at,
          status: item.is_active ? 'active' : 'inactive',
          item_name: item.item_name,
          quantity: item.quantity || 0,
          sku: item.sku,
          buying_price: item.buying_price,
          total_cost: item.total_cost,
          created_by_id: item.created_by_id || item.createdBy || item.created_by,
        };
      });

      // Apply role-based filtering for Finance Admin
      // Note: Backend should filter for Admin, Accountant, and Employee, but Finance Admin
      // may see all data from backend, so we filter on frontend for Finance Admin
      if (isFinanceAdmin && userIds && userIds.length > 0) {
        // Filter transactions by accessible user IDs
        transactions = transactions.filter((t: any) => {
          const createdById = t.created_by_id || t.createdBy || t.created_by;
          if (!createdById) return false;
          const createdByIdNum = typeof createdById === 'string' ? parseInt(createdById, 10) : createdById;
          return userIds.includes(createdByIdNum);
        });

        // Filter sales by accessible user IDs
        salesTransactions = salesTransactions.filter((s: any) => {
          const soldById = s.sold_by_id || s.created_by_id;
          if (!soldById) return false;
          const soldByIdNum = typeof soldById === 'string' ? parseInt(soldById, 10) : soldById;
          return userIds.includes(soldByIdNum);
        });

        // Filter inventory by accessible user IDs
        inventoryTransactions = inventoryTransactions.filter((i: any) => {
          const createdById = i.created_by_id;
          if (!createdById) return false;
          const createdByIdNum = typeof createdById === 'string' ? parseInt(createdById, 10) : createdById;
          return userIds.includes(createdByIdNum);
        });
      } else if (isAccountant || isEmployee) {
        // Accountant and Employee should only see their own transactions
        // Backend should already filter, but we apply additional filtering for safety
        const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
        
        transactions = transactions.filter((t: any) => {
          const createdById = t.created_by_id || t.createdBy || t.created_by;
          if (!createdById) return false;
          const createdByIdNum = typeof createdById === 'string' ? parseInt(createdById, 10) : createdById;
          return createdByIdNum === userId;
        });

        salesTransactions = salesTransactions.filter((s: any) => {
          const soldById = s.sold_by_id || s.created_by_id;
          if (!soldById) return false;
          const soldByIdNum = typeof soldById === 'string' ? parseInt(soldById, 10) : soldById;
          return soldByIdNum === userId;
        });

        inventoryTransactions = inventoryTransactions.filter((i: any) => {
          const createdById = i.created_by_id;
          if (!createdById) return false;
          const createdByIdNum = typeof createdById === 'string' ? parseInt(createdById, 10) : createdById;
          return createdByIdNum === userId;
        });
      }
      // Admin sees all - no filtering needed

      // Combine all transactions and sort by date
      const allTransactions = [...transactions, ...salesTransactions, ...inventoryTransactions].sort((a, b) => {
        const dateA = new Date(a.date || a.created_at || 0).getTime();
        const dateB = new Date(b.date || b.created_at || 0).getTime();
        return dateB - dateA; // Most recent first
      });

      setTransactions(allTransactions);
    } catch (err: any) {
      let errorMessage = 'Failed to load transactions';
      
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (typeof detail === 'string') {
          errorMessage = detail;
        } else if (Array.isArray(detail)) {
          errorMessage = detail.map((e: any) => e.msg || JSON.stringify(e)).join(', ');
        } else if (typeof detail === 'object' && detail.msg) {
          errorMessage = detail.msg;
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

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.source?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.vendor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.receipt_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || transaction.transaction_type === typeFilter;
    
    // Handle status filter - include sales and inventory status
    let matchesStatus = false;
    if (statusFilter === 'all') {
      matchesStatus = true;
    } else if (statusFilter === 'approved') {
      matchesStatus = transaction.is_approved || transaction.status === 'posted' || transaction.status === 'active';
    } else if (statusFilter === 'pending') {
      matchesStatus = !transaction.is_approved && transaction.status !== 'posted' && transaction.status !== 'cancelled' && transaction.status !== 'active';
    } else if (statusFilter === 'posted') {
      matchesStatus = transaction.status === 'posted';
    } else if (statusFilter === 'active') {
      matchesStatus = transaction.status === 'active';
    } else if (statusFilter === 'inactive') {
      matchesStatus = transaction.status === 'inactive';
    } else {
      matchesStatus = transaction.status === statusFilter;
    }
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const totalRevenue = filteredTransactions
    .filter(t => t.transaction_type === 'revenue')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  
  const totalSales = filteredTransactions
    .filter(t => t.transaction_type === 'sale')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  
  const totalExpenses = filteredTransactions
    .filter(t => t.transaction_type === 'expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  
  const totalInventory = filteredTransactions
    .filter(t => t.transaction_type === 'inventory')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  
  const netAmount = totalRevenue + totalSales - totalExpenses - totalInventory;

  if (loading) {
    return (
      <Layout>
        <PageContainer>
          <ContentContainer>
            <LoadingContainer>
              <Spinner />
              <p>Loading transactions...</p>
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
            <h1>Transactions</h1>
            <p>View all revenue and expense transactions</p>
          </HeaderContainer>

          {error && (
            <ErrorBanner>
              <AlertCircle />
              <span>{error}</span>
            </ErrorBanner>
          )}

          <SummaryGrid>
            <SummaryCard $type="revenue">
              <div className="label">Total Revenue</div>
              <div className="value">{formatCurrency(totalRevenue)}</div>
            </SummaryCard>
            <SummaryCard $type="revenue">
              <div className="label">Total Sales</div>
              <div className="value">{formatCurrency(totalSales)}</div>
            </SummaryCard>
            <SummaryCard $type="expense">
              <div className="label">Total Expenses</div>
              <div className="value">{formatCurrency(totalExpenses)}</div>
            </SummaryCard>
          </SummaryGrid>

          <BottomSummaryGrid>
            <SummaryCard $type="expense">
              <div className="label">Total Inventory Cost</div>
              <div className="value">{formatCurrency(totalInventory)}</div>
            </SummaryCard>
            <SummaryCard $type="net">
              <div className="label">Net Amount</div>
              <div className="value" style={{ color: netAmount >= 0 ? '#16a34a' : '#dc2626' }}>
                {formatCurrency(netAmount)}
              </div>
            </SummaryCard>
            <SummaryCard $type="total">
              <div className="label">Total Transactions</div>
              <div className="value">{filteredTransactions.length}</div>
            </SummaryCard>
          </BottomSummaryGrid>

          <FiltersContainer>
            <FiltersGrid>
              <SearchContainer>
                <Search />
                <SearchInput
                  type="text"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </SearchContainer>
              
              <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <option value="all">All Types</option>
                <option value="revenue">Revenue</option>
                <option value="expense">Expense</option>
                <option value="sale">Sales</option>
                <option value="inventory">Inventory</option>
              </Select>
              
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Status</option>
                <option value="approved">Approved</option>
                <option value="posted">Posted</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="inactive">Inactive</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </FiltersGrid>
          </FiltersContainer>

          <TableContainer>
            {filteredTransactions.length === 0 ? (
              <EmptyState>
                <TrendingUp />
                <h3>No transactions found</h3>
                <p>Try adjusting your filters or create a new transaction.</p>
              </EmptyState>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <Table>
                  <TableHeader>
                    <tr>
                      <th>Type</th>
                      <th>Title</th>
                      <th>Category</th>
                      <th>Amount</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction) => {
                      const originalId = transaction.id.split('-')[1];
                      const isExpense = transaction.transaction_type === 'expense';
                      const isSale = transaction.transaction_type === 'sale';
                      const isInventory = transaction.transaction_type === 'inventory';
                      
                      return (
                        <tr key={transaction.id}>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <TypeBadge $type={transaction.transaction_type}>
                              {isExpense ? (
                                <ArrowDownRight size={12} />
                              ) : isSale ? (
                                <ShoppingCart size={12} />
                              ) : transaction.transaction_type === 'inventory' ? (
                                <Package size={12} />
                              ) : (
                                <ArrowUpRight size={12} />
                              )}
                              {transaction.transaction_type === 'revenue' 
                                ? 'Revenue' 
                                : transaction.transaction_type === 'expense' 
                                ? 'Expense' 
                                : transaction.transaction_type === 'sale'
                                ? 'Sale'
                                : 'Inventory'}
                            </TypeBadge>
                          </td>
                          <td>
                            <TransactionTitle>{transaction.title}</TransactionTitle>
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <CategoryBadge>{transaction.category || 'N/A'}</CategoryBadge>
                          </td>
                          <AmountCell $isExpense={isExpense || transaction.transaction_type === 'inventory'} style={{ whiteSpace: 'nowrap' }}>
                            {isExpense || transaction.transaction_type === 'inventory' ? '-' : '+'}{formatCurrency(Math.abs(transaction.amount))}
                          </AmountCell>
                          <td style={{ whiteSpace: 'nowrap' }}>{formatDate(transaction.date)}</td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <StatusBadge 
                              $approved={transaction.is_approved} 
                              $status={transaction.status}
                            >
                              {transaction.status === 'posted' 
                                ? 'Posted' 
                                : transaction.status === 'cancelled'
                                ? 'Cancelled'
                                : transaction.status === 'active'
                                ? 'Active'
                                : transaction.status === 'inactive'
                                ? 'Inactive'
                                : transaction.is_approved 
                                ? 'Approved' 
                                : 'Pending'}
                            </StatusBadge>
                            {transaction.is_recurring && (
                              <RecurringBadge>Recurring</RecurringBadge>
                            )}
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <ActionButtons>
                              {isSale ? (
                                <Link href={`/sales/accounting?sale_id=${originalId}`}>
                                  <Button size="sm" variant="secondary">
                                    View
                                  </Button>
                                </Link>
                              ) : transaction.transaction_type === 'inventory' ? (
                                <Link href={`/inventory/manage?item_id=${originalId}`}>
                                  <Button size="sm" variant="secondary">
                                    View
                                  </Button>
                                </Link>
                              ) : (
                                <Link href={isExpense ? `/expenses/edit/${originalId}` : `/revenue/edit/${originalId}`}>
                                  <Button size="sm" variant="secondary">
                                    View
                                  </Button>
                                </Link>
                              )}
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
        </ContentContainer>
      </PageContainer>
    </Layout>
  );
}
