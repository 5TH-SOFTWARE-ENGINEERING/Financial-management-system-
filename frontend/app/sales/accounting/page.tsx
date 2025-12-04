'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import {
  FileText, DollarSign, CheckCircle, Clock, TrendingUp,
  Loader2, AlertCircle, Search, Filter, Calendar,
  BookOpen, Receipt, Eye
} from 'lucide-react';
import Layout from '@/components/layout';
import apiClient from '@/lib/api';
import { useAuth } from '@/lib/rbac/auth-context';
import { toast } from 'sonner';
import { theme } from '@/components/common/theme';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const PRIMARY_COLOR = theme.colors.primary || '#00AA00';
const TEXT_COLOR_DARK = '#111827';
const TEXT_COLOR_MUTED = theme.colors.textSecondary || '#666';

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
  padding: ${theme.spacing.lg};
  box-shadow: ${CardShadow};
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

const Badge = styled.span<{ variant: 'success' | 'warning' | 'info' }>`
  display: inline-flex;
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  font-size: ${theme.typography.fontSizes.xs};
  font-weight: ${theme.typography.fontWeights.bold};
  border-radius: 9999px;
  ${(p) => {
    switch (p.variant) {
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
`;

const FormGroup = styled.div`
  margin-bottom: ${theme.spacing.md};
`;

const ModalActions = styled.div`
  display: flex;
  gap: ${theme.spacing.md};
  justify-content: flex-end;
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
  sold_by_name?: string;
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
  posted_by_name?: string;
  posted_at: string;
}

export default function AccountingDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'sales' | 'journal'>('sales');
  const [sales, setSales] = useState<Sale[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [summary, setSummary] = useState<any>(null);
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

  useEffect(() => {
    if (!user) {
      return; // Wait for user to load
    }
    const hasAccess = user.role === 'accountant' || user.role === 'finance_manager' || user.role === 'admin';
    if (!hasAccess) {
      router.push('/dashboard');
      return;
    }
    // Only load data if user has access
    if (hasAccess) {
      loadData();
    }
  }, [user, router, statusFilter]);

  const loadData = async () => {
    // Double-check permissions before making API calls
    if (!user || (user.role !== 'accountant' && user.role !== 'finance_manager' && user.role !== 'admin')) {
      return;
    }
    
    setLoading(true);
    try {
      const [salesRes, summaryRes, journalRes] = await Promise.all([
        apiClient.getSales({ status: statusFilter === 'all' ? undefined : statusFilter, limit: 1000 }).catch((err: any) => {
          if (err.response?.status === 403) {
            console.warn('Access denied to sales data');
            return { data: [] };
          }
          throw err;
        }),
        apiClient.getSalesSummary().catch((err: any) => {
          if (err.response?.status === 403) {
            console.warn('Access denied to sales summary');
            return { data: null };
          }
          throw err;
        }),
        apiClient.getJournalEntries({ limit: 1000 }).catch((err: any) => {
          if (err.response?.status === 403) {
            console.warn('Access denied to journal entries');
            return { data: [] };
          }
          throw err;
        }),
      ]);
      
      // Handle API response structure - ApiResponse wraps data in .data property
      const salesData = Array.isArray(salesRes.data) 
        ? salesRes.data 
        : (Array.isArray((salesRes.data as any)?.data) ? (salesRes.data as any).data : []);
      
      const summaryData = summaryRes.data || (summaryRes.data as any)?.data || null;
      
      const journalData = Array.isArray(journalRes.data) 
        ? journalRes.data 
        : (Array.isArray((journalRes.data as any)?.data) ? (journalRes.data as any).data : []);
      
      setSales(salesData as Sale[]);
      setSummary(summaryData);
      setJournalEntries(journalData as JournalEntry[]);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to load data';
      toast.error(errorMessage);
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

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
      await loadData();
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to post sale';
      toast.error(errorMessage);
    }
  };

  if (!user || (user.role !== 'accountant' && user.role !== 'finance_manager' && user.role !== 'admin')) {
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
              <p>View sales, post journal entries, and manage revenue (Accountant Access)</p>
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
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                style={{
                  padding: theme.spacing.sm,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.borderRadius.md,
                }}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="posted">Posted</option>
              </select>
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
                    <TableHeaderCell>Item</TableHeaderCell>
                    <TableHeaderCell>Quantity</TableHeaderCell>
                    <TableHeaderCell>Price</TableHeaderCell>
                    <TableHeaderCell>Total</TableHeaderCell>
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
                          <Badge variant={sale.status === 'posted' ? 'success' : 'warning'}>
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
            <h2 style={{ margin: 0, marginBottom: theme.spacing.lg }}>Journal Entries</h2>
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
                <button
                  onClick={() => setShowPostModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }}
                >
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
                <Label htmlFor="debit_account">Debit Account</Label>
                <Input
                  id="debit_account"
                  value={postData.debit_account}
                  onChange={(e) => setPostData({ ...postData, debit_account: e.target.value })}
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="credit_account">Credit Account</Label>
                <Input
                  id="credit_account"
                  value={postData.credit_account}
                  onChange={(e) => setPostData({ ...postData, credit_account: e.target.value })}
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="reference_number">Reference Number</Label>
                <Input
                  id="reference_number"
                  value={postData.reference_number}
                  onChange={(e) => setPostData({ ...postData, reference_number: e.target.value })}
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  value={postData.notes}
                  onChange={(e) => setPostData({ ...postData, notes: e.target.value })}
                  style={{
                    width: '100%',
                    padding: theme.spacing.sm,
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: theme.borderRadius.md,
                    minHeight: '60px',
                    fontFamily: 'inherit',
                    fontSize: theme.typography.fontSizes.sm,
                  }}
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

