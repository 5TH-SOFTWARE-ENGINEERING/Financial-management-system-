'use client';
import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Navbar from '@/components/common/Navbar';
import Sidebar from '@/components/common/Sidebar';
import Link from 'next/link';
import apiClient from '@/lib/api';
import { useRouter } from 'next/navigation';
import { AlertCircle, Plus, Edit, Trash2, DollarSign, Search, Filter, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useAuth } from '@/lib/rbac/auth-context';
import { useUserStore } from '@/store/userStore';

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

const RecurringBadge = styled.span`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  background: #dbeafe;
  color: #1e40af;
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
  created_by_id: number;
  created_at: string;
  updated_at?: string | null;
}

export default function RevenueListPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { canApproveTransactions } = useUserStore();
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [showRejectModal, setShowRejectModal] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  
  // Check if user can approve transactions
  const canApprove = () => {
    if (canApproveTransactions()) return true;
    if (!user) return false;
    const role = user.role?.toLowerCase();
    return role === 'admin' || role === 'super_admin' || role === 'manager' || role === 'finance_manager';
  };

  useEffect(() => {
    loadRevenues();
  }, []);

  const loadRevenues = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.getRevenues();
      setRevenues(response.data || []);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load revenues');
      toast.error('Failed to load revenues');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this revenue entry? This action cannot be undone.')) {
      return;
    }

    try {
      await apiClient.deleteRevenue(id);
      toast.success('Revenue entry deleted successfully');
      loadRevenues();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to delete revenue entry');
    }
  };

  const handleApprove = async (id: number) => {
    if (!canApprove()) {
      toast.error('You do not have permission to approve revenue entries');
      return;
    }

    setApprovingId(id);
    try {
      await apiClient.approveItem(id, 'revenue');
      toast.success('Revenue entry approved successfully');
      loadRevenues();
    } catch (err: any) {
      let errorMessage = 'Failed to approve revenue entry';
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (typeof detail === 'string') {
          errorMessage = detail;
        } else if (Array.isArray(detail)) {
          errorMessage = detail.map((e: any) => e.msg || JSON.stringify(e)).join(', ');
        } else if (typeof detail === 'object' && detail.msg) {
          errorMessage = detail.msg;
        }
      }
      toast.error(errorMessage);
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (id: number, reason: string) => {
    if (!canApprove()) {
      toast.error('You do not have permission to reject revenue entries');
      return;
    }

    if (!reason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setRejectingId(id);
    try {
      await apiClient.rejectItem(id, 'revenue', reason);
      toast.success('Revenue entry rejected successfully');
      setShowRejectModal(null);
      setRejectionReason('');
      loadRevenues();
    } catch (err: any) {
      let errorMessage = 'Failed to reject revenue entry';
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (typeof detail === 'string') {
          errorMessage = detail;
        } else if (Array.isArray(detail)) {
          errorMessage = detail.map((e: any) => e.msg || JSON.stringify(e)).join(', ');
        } else if (typeof detail === 'object' && detail.msg) {
          errorMessage = detail.msg;
        }
      }
      toast.error(errorMessage);
    } finally {
      setRejectingId(null);
    }
  };

  // Get unique categories from revenues
  const categories = Array.from(new Set(revenues.map(r => r.category).filter(Boolean)));

  // Filter revenues
  const filteredRevenues = revenues.filter(revenue => {
    const matchesSearch = 
      revenue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      revenue.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      revenue.source?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || revenue.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'approved' && revenue.is_approved) ||
      (statusFilter === 'pending' && !revenue.is_approved);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

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
            <p>Loading revenues...</p>
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
              <h1>Revenue</h1>
              <p>Manage your revenue entries</p>
            </HeaderText>
            <Link href="/revenue/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Revenue
              </Button>
            </Link>
          </Header>

          {error && (
            <MessageBox type="error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </MessageBox>
          )}

          <FiltersCard>
            <SearchWrapper>
              <Search size={16} />
              <Input
                type="text"
                placeholder="Search by title, description, or source..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </SearchWrapper>
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
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
            </Select>
          </FiltersCard>

          <Card>
            {filteredRevenues.length === 0 ? (
              <EmptyState>
                <DollarSign size={48} />
                <h3>No revenue entries</h3>
                <p>
                  {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all'
                    ? 'No revenue entries match your filters'
                    : 'Get started by adding your first revenue entry'}
                </p>
                {!searchTerm && categoryFilter === 'all' && statusFilter === 'all' && (
                  <Link href="/revenue/create">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Revenue Entry
                    </Button>
                  </Link>
                )}
              </EmptyState>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <Table>
                  <TableHeader>
                    <tr>
                      <th>Title</th>
                      <th>Category</th>
                      <th>Amount</th>
                      <th>Source</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </TableHeader>
                  <TableBody>
                    {filteredRevenues.map((revenue) => (
                      <tr key={revenue.id}>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <div style={{ fontWeight: 500, color: 'var(--foreground)' }}>
                            {revenue.title}
                          </div>
                          {revenue.description && (
                            <div style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginTop: '4px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {revenue.description}
                            </div>
                          )}
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <CategoryBadge>{revenue.category}</CategoryBadge>
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <span style={{ fontWeight: 600, color: '#16a34a' }}>
                            {formatCurrency(revenue.amount)}
                          </span>
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>{revenue.source || '-'}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>{formatDate(revenue.date)}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <StatusBadge $approved={revenue.is_approved}>
                            {revenue.is_approved ? 'Approved' : 'Pending'}
                          </StatusBadge>
                          {revenue.is_recurring && (
                            <RecurringBadge>Recurring</RecurringBadge>
                          )}
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <ActionButtons>
                            <Link href={`/revenue/edit/${revenue.id}`}>
                              <Button variant="ghost" size="sm" style={{ height: '32px', width: '32px', padding: 0 }}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            {!revenue.is_approved && canApprove() && (
                              <>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleApprove(revenue.id)}
                                  disabled={approvingId === revenue.id || rejectingId === revenue.id}
                                  style={{ 
                                    height: '32px', 
                                    padding: '0 12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                >
                                  {approvingId === revenue.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <CheckCircle className="h-4 w-4" />
                                  )}
                                  <span>Approve</span>
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => setShowRejectModal(revenue.id)}
                                  disabled={approvingId === revenue.id || rejectingId === revenue.id}
                                  style={{ 
                                    height: '32px', 
                                    padding: '0 12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                >
                                  <XCircle className="h-4 w-4" />
                                  <span>Reject</span>
                                </Button>
                              </>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              style={{ height: '32px', width: '32px', padding: 0, color: 'var(--destructive)' }}
                              onClick={() => handleDelete(revenue.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </ActionButtons>
                        </td>
                      </tr>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>

          {/* Rejection Modal */}
          {showRejectModal && (
            <div style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 50
            }}>
              <div style={{
                background: '#fff',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                padding: '24px',
                maxWidth: '500px',
                width: '100%',
                margin: '16px'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Reject Revenue Entry</h3>
                <div style={{ marginBottom: '16px' }}>
                  <Label htmlFor="rejection-reason">Rejection Reason *</Label>
                  <Textarea
                    id="rejection-reason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please provide a reason for rejection..."
                    rows={4}
                    style={{ marginTop: '8px', width: '100%' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setShowRejectModal(null);
                      setRejectionReason('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleReject(showRejectModal, rejectionReason)}
                    disabled={!rejectionReason.trim() || rejectingId === showRejectModal}
                  >
                    {rejectingId === showRejectModal ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        Rejecting...
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </InnerContent>
      </ContentArea>
    </LayoutWrapper>
  );
}

