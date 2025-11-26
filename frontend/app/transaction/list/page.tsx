'use client';
import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/common/Navbar';
import Sidebar from '@/components/common/Sidebar';
import Link from 'next/link';
import apiClient from '@/lib/api';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowUpRight, ArrowDownRight, Search, Filter, Loader2, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { formatCurrency, formatDate } from '@/lib/utils';

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
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-between;
  align-items: center;
  margin-bottom: 24px;
`;

const HeaderText = styled.div`
  h1 {
    font-size: 32px;
    font-weight: 700;
    margin-bottom: 4px;
  }
  
  p {
    color: var(--muted-foreground);
  }
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

const Card = styled.div`
  background: #fff;
  padding: 24px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
`;

const FiltersCard = styled.div`
  background: #fff;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
  margin-bottom: 20px;
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 16px;
  align-items: center;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const SearchWrapper = styled.div`
  position: relative;
  
  svg {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--muted-foreground);
  }
  
  input {
    padding-left: 40px;
  }
`;

const Select = styled.select`
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
  font-size: 14px;
  color: var(--foreground);
  
  &:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 48px 24px;
  
  svg {
    margin: 0 auto 16px;
    color: var(--muted-foreground);
  }
  
  h3 {
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

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHeader = styled.thead`
  border-bottom: 1px solid var(--border);
  background: var(--muted);
  
  th {
    text-align: left;
    padding: 12px 16px;
    font-weight: 600;
    color: var(--foreground);
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
`;

const TableBody = styled.tbody`
  tr {
    border-bottom: 1px solid var(--border);
    transition: background-color 0.2s;
    
    &:hover {
      background: var(--muted);
    }
    
    td {
      padding: 12px 16px;
      color: var(--muted-foreground);
      font-size: 14px;
    }
  }
`;

const TypeBadge = styled.span<{ $type: 'revenue' | 'expense' }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  background: ${(p) => (p.$type === 'revenue' ? '#d1fae5' : '#fee2e2')};
  color: ${(p) => (p.$type === 'revenue' ? '#065f46' : '#991b1b')};
`;

const AmountCell = styled.td<{ $isExpense: boolean }>`
  font-weight: 600;
  color: ${(p) => (p.$isExpense ? '#dc2626' : '#16a34a')} !important;
`;

const CategoryBadge = styled.span`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  background: #dbeafe;
  color: #1e40af;
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

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const LoadingContainer = styled.div`
  padding: 32px;
  text-align: center;
  
  p {
    color: var(--muted-foreground);
    margin-top: 16px;
  }
`;

const Spinner = styled.div`
  width: 32px;
  height: 32px;
  border: 3px solid var(--border);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

interface Transaction {
  id: string;
  transaction_type: 'revenue' | 'expense';
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
}

export default function TransactionListPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.getTransactions();
      setTransactions(response.data || []);
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

  // Get unique categories from transactions
  const categories = Array.from(new Set(transactions.map(t => t.category).filter(Boolean)));

  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.source?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.vendor?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || transaction.transaction_type === typeFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'approved' && transaction.is_approved) ||
      (statusFilter === 'pending' && !transaction.is_approved);
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Calculate totals
  const totalRevenue = filteredTransactions
    .filter(t => t.transaction_type === 'revenue')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  
  const totalExpenses = filteredTransactions
    .filter(t => t.transaction_type === 'expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  
  const netAmount = totalRevenue - totalExpenses;

  if (loading) {
    return (
      <LayoutWrapper>
        <SidebarWrapper>
          <Sidebar />
        </SidebarWrapper>
        <ContentArea>
          <Navbar />
          <LoadingContainer>
            <Spinner />
            <p>Loading transactions...</p>
          </LoadingContainer>
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
          <Header>
            <HeaderText>
              <h1>Transactions</h1>
              <p>View all revenue and expense transactions</p>
            </HeaderText>
          </Header>

          {error && (
            <MessageBox type="error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </MessageBox>
          )}

          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <Card>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Total Revenue</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#16a34a' }}>{formatCurrency(totalRevenue)}</div>
            </Card>
            <Card>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Total Expenses</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#dc2626' }}>{formatCurrency(totalExpenses)}</div>
            </Card>
            <Card>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Net Amount</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: netAmount >= 0 ? '#16a34a' : '#dc2626' }}>
                {formatCurrency(netAmount)}
              </div>
            </Card>
            <Card>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Total Transactions</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#1f2937' }}>{filteredTransactions.length}</div>
            </Card>
          </div>

          {/* Filters */}
          <FiltersCard>
            <SearchWrapper>
              <Search size={16} />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </SearchWrapper>
            <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="all">All Types</option>
              <option value="revenue">Revenue</option>
              <option value="expense">Expense</option>
            </Select>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
            </Select>
          </FiltersCard>

          <Card>
            {filteredTransactions.length === 0 ? (
              <EmptyState>
                <TrendingUp size={40} />
                <h3>No transactions found</h3>
                <p>Try adjusting your filters or create a new transaction.</p>
              </EmptyState>
            ) : (
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
                    
                    return (
                      <tr key={transaction.id}>
                        <td>
                          <TypeBadge $type={transaction.transaction_type}>
                            {isExpense ? <ArrowDownRight size={12} /> : <ArrowUpRight size={12} />}
                            {transaction.transaction_type === 'revenue' ? 'Revenue' : 'Expense'}
                          </TypeBadge>
                        </td>
                        <td>
                          <div style={{ fontWeight: 500, color: '#1f2937' }}>{transaction.title}</div>
                          {transaction.description && (
                            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                              {transaction.description.length > 50 
                                ? `${transaction.description.substring(0, 50)}...` 
                                : transaction.description}
                            </div>
                          )}
                        </td>
                        <td>
                          <CategoryBadge>{transaction.category || 'N/A'}</CategoryBadge>
                        </td>
                        <AmountCell $isExpense={isExpense}>
                          {isExpense ? '-' : '+'}{formatCurrency(Math.abs(transaction.amount))}
                        </AmountCell>
                        <td style={{ whiteSpace: 'nowrap' }}>{formatDate(transaction.date)}</td>
                        <td>
                          <StatusBadge $approved={transaction.is_approved}>
                            {transaction.is_approved ? 'Approved' : 'Pending'}
                          </StatusBadge>
                          {transaction.is_recurring && (
                            <span style={{ 
                              padding: '4px 8px', 
                              borderRadius: '4px', 
                              fontSize: '12px', 
                              fontWeight: 500,
                              background: '#dbeafe',
                              color: '#1e40af'
                            }}>
                              Recurring
                            </span>
                          )}
                        </td>
                        <td>
                          <ActionButtons>
                            <Link href={isExpense ? `/expenses/edit/${originalId}` : `/revenue/edit/${originalId}`}>
                              <Button size="sm" variant="secondary">
                                View
                              </Button>
                            </Link>
                          </ActionButtons>
                        </td>
                      </tr>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </Card>
        </InnerContent>
      </ContentArea>
    </LayoutWrapper>
  );
}

