'use client';

import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { ComponentGate, ComponentId } from '@/lib/rbac';
import { useAuth } from '@/lib/rbac/auth-context';
import {
  FileText,
  RefreshCw,
  Filter,
  Calendar,
  User,
  Activity,
  AlertTriangle,
  Download,
  Loader,
  Search,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import apiClient, { AuditLog } from '@/lib/api';
import { toast } from 'sonner';
import { theme } from '@/components/common/theme';

// --- Styled Components ---

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const PageContainer = styled.div`
  padding: ${theme.spacing.xl};
  max-width: 1600px;
  margin: 0 auto;
  animation: ${fadeIn} 0.4s ease-out;
`;

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing.xl};
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: ${theme.spacing.md};
  }
`;

const Title = styled.h1`
  font-size: ${theme.typography.fontSizes.xxl};
  font-weight: ${theme.typography.fontWeights.bold};
  color: ${theme.colors.text};
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
`;

const Subtitle = styled.p`
  color: ${theme.colors.textSecondary};
  font-size: ${theme.typography.fontSizes.md};
  margin-top: ${theme.spacing.xs};
`;

const Card = styled.div`
  background: ${props => props.theme.colors.background};
  border-radius: ${theme.borderRadius.lg};
  box-shadow: ${theme.shadows.sm};
  border: 1px solid ${theme.colors.border};
  overflow: hidden;
  margin-bottom: ${theme.spacing.xl};
  transition: box-shadow 0.3s ease;

  &:hover {
    box-shadow: ${theme.shadows.md};
  }
`;

const FilterSection = styled.div`
  padding: ${theme.spacing.lg};
  background: ${theme.colors.backgroundSecondary};
  border-bottom: 1px solid ${theme.colors.border};
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${theme.spacing.md};
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.xs};
`;

const Label = styled.label`
  font-size: ${theme.typography.fontSizes.sm};
  font-weight: 500;
  color: ${theme.colors.textSecondary};
  display: flex;
  align-items: center;
  gap: ${theme.spacing.xs};
`;

const Input = styled.input`
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.typography.fontSizes.sm};
  transition: all 0.2s;
  
  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 2px ${theme.colors.primary}20;
  }
`;

const Select = styled.select`
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.typography.fontSizes.sm};
  background-color: white;
  transition: all 0.2s;
  
  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 2px ${theme.colors.primary}20;
  }
`;

const TableContainer = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: ${theme.typography.fontSizes.sm};
`;

const Th = styled.th`
  text-align: left;
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  background: ${theme.colors.backgroundSecondary};
  color: ${theme.colors.textSecondary};
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  border-bottom: 1px solid ${theme.colors.border};
  white-space: nowrap;
`;

const Td = styled.td`
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  color: ${theme.colors.text};
  border-bottom: 1px solid ${theme.colors.border};
  vertical-align: middle;
`;

const Tr = styled.tr`
  transition: background-color 0.15s ease;
  
  &:hover {
    background-color: ${theme.colors.backgroundSecondary}50;
  }

  &:last-child td {
    border-bottom: none;
  }
`;

const Badge = styled.span<{ $variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' }>`
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.625rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.025em;
  
  ${props => {
    switch (props.$variant) {
      case 'success':
        return `background-color: #dcfce7; color: #166534; border: 1px solid #bbf7d0;`;
      case 'warning':
        return `background-color: #fef3c7; color: #92400e; border: 1px solid #fde68a;`;
      case 'danger':
        return `background-color: #fee2e2; color: #991b1b; border: 1px solid #fecaca;`;
      case 'neutral':
        return `background-color: ${theme.colors.backgroundSecondary}; color: #374151; border: 1px solid #e5e7eb;`;
      case 'info':
      default:
        return `background-color: #dbeafe; color: #1e40af; border: 1px solid #bfdbfe;`;
    }
  }}
`;

const ActionButtons = styled.div`
  display: flex;
  gap: ${theme.spacing.md};
  
  @media (max-width: 640px) {
    width: 100%;
    
    button {
      flex: 1;
    }
  }
`;

const UserCell = styled.div`
  display: flex;
  flex-direction: column;
`;

const UserSubtext = styled.span`
  font-size: 0.75rem;
  color: ${theme.colors.textSecondary};
`;

const Pagination = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  border-top: 1px solid ${theme.colors.border};
  background: ${theme.colors.backgroundSecondary};
`;

const LoadingState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  color: ${theme.colors.textSecondary};
  gap: ${theme.spacing.md};
`;

const ErrorState = styled.div`
  padding: ${theme.spacing.lg};
  background-color: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: ${theme.borderRadius.md};
  color: #991b1b;
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.lg};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: ${theme.colors.textSecondary};
`;

// --- Helpers ---

const ACTIONS = [
  { value: '', label: 'All Actions' },
  { value: 'create', label: 'Create' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
  { value: 'login', label: 'Login' },
  { value: 'logout', label: 'Logout' },
  { value: 'approve', label: 'Approve' },
  { value: 'reject', label: 'Reject' },
  { value: 'export', label: 'Export' },
  { value: 'view', label: 'View' },
];

const RESOURCE_TYPES = [
  { value: '', label: 'All Resources' },
  { value: 'user', label: 'User' },
  { value: 'revenue', label: 'Revenue' },
  { value: 'expense', label: 'Expense' },
  { value: 'report', label: 'Report' },
  { value: 'project', label: 'Project' },
  { value: 'department', label: 'Department' },
  { value: 'approval', label: 'Approval' },
  { value: 'budget', label: 'Budget' },
  { value: 'inventory', label: 'Inventory' },
];

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  } catch {
    return dateString;
  }
}

function getActionBadgeVariant(action: string): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
  switch (action.toLowerCase()) {
    case 'create':
    case 'approve':
    case 'restore':
      return 'success';
    case 'update':
    case 'export':
    case 'view':
      return 'info';
    case 'delete':
    case 'reject':
      return 'danger';
    case 'login':
    case 'logout':
      return 'warning';
    default:
      return 'neutral';
  }
}

// --- Component ---

export default function LogsPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<Partial<AuditLog['user'] & { id: number }>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [userIdFilter, setUserIdFilter] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('');
  const [resourceTypeFilter, setResourceTypeFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(20);
  const [hasMore, setHasMore] = useState(false);

  // Check permission
  const hasPermission = user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'super_admin';

  useEffect(() => {
    if (hasPermission) {
      loadUsers();
      loadLogs();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPermission, currentPage, userIdFilter, actionFilter, resourceTypeFilter, startDate, endDate]); // Trigger on filter changes

  // Debounced search effect could be added here, but direct search button is simpler for now

  const loadUsers = async () => {
    try {
      const response = await apiClient.getUsers();
      setUsers(response.data || []);
    } catch (err) {
      console.error('Failed to load users for filter', err);
    }
  };

  const loadLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const filters: Record<string, unknown> = {
        skip: (currentPage - 1) * limit,
        limit: limit + 1, // Fetch one extra to check for "next page"
        user_id: userIdFilter || undefined,
        action: actionFilter || undefined,
        resource_type: resourceTypeFilter || undefined,
        search: search || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      };

      const response = await apiClient.getAuditLogs(filters as any);
      const data = response.data || [];

      if (data.length > limit) {
        setHasMore(true);
        setLogs(data.slice(0, limit));
      } else {
        setHasMore(false);
        setLogs(data);
      }
    } catch (err) {
      console.error('Failed to load logs:', err);
      setError('Failed to fetch audit logs. Please try again later.');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadLogs();
  };

  const handleClearFilters = () => {
    setUserIdFilter('');
    setActionFilter('');
    setResourceTypeFilter('');
    setSearch('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
    // Explicitly reload after clearing (useEffect might not trigger if values were already empty)
    setTimeout(() => loadLogs(), 0);
  };

  const handleExport = () => {
    // Basic CSV export logic
    const headers = ['ID', 'Timestamp', 'User', 'Action', 'Resource', 'Resource ID', 'IP Address', 'User Agent'];
    const rows = logs.map(log => [
      log.id,
      formatDate(log.created_at),
      log.user?.full_name || log.user?.username || `User ${log.user_id}`,
      log.action,
      log.resource_type,
      log.resource_id || '',
      log.ip_address || '',
      log.user_agent || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Logs exported successfully');
  };

  if (!hasPermission) {
    return (
      <ComponentGate componentId={ComponentId.SETTINGS_VIEW}>
        <PageContainer>
          <HeaderContainer>
            <div>
              <Title><FileText size={32} /> Audit Logs</Title>
              <Subtitle>View and manage system audit logs</Subtitle>
            </div>
          </HeaderContainer>
          <EmptyState>
            <AlertTriangle size={48} style={{ margin: '0 auto', color: theme.colors.error }} />
            <h3 style={{ marginTop: '1rem', fontSize: '1.25rem', fontWeight: 600 }}>Access Denied</h3>
            <p style={{ marginTop: '0.5rem' }}>You do not have permission to view audit logs.</p>
          </EmptyState>
        </PageContainer>
      </ComponentGate>
    )
  }

  return (
    <ComponentGate componentId={ComponentId.SETTINGS_VIEW}>
      <PageContainer>
        <HeaderContainer>
          <div>
            <Title>
              <FileText size={32} className="text-blue-600" />
              Audit Logs
            </Title>
            <Subtitle>Track system activity, user actions, and security events</Subtitle>
          </div>
          <ActionButtons>
            <Button variant="outline" onClick={loadLogs} disabled={loading}>
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Refresh
            </Button>
            <Button onClick={handleExport} disabled={loading || logs.length === 0}>
              <Download size={16} />
              Export
            </Button>
          </ActionButtons>
        </HeaderContainer>

        {error && (
          <ErrorState>
            <AlertTriangle size={20} />
            <span>{error}</span>
            <Button variant="ghost" size="sm" onClick={() => setError(null)}><X size={16} /></Button>
          </ErrorState>
        )}

        <Card>
          <FilterSection>
            <FormGroup>
              <Label><Search size={14} /> Search</Label>
              <form onSubmit={handleSearch} style={{ display: 'flex' }}>
                <Input
                  placeholder="Search by user name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ width: '100%' }}
                />
              </form>
            </FormGroup>

            <FormGroup>
              <Label><User size={14} /> User</Label>
              <Select value={userIdFilter} onChange={(e) => { setUserIdFilter(e.target.value); setCurrentPage(1); }}>
                <option value="">All Users</option>
                {users.map((u) => (
                  u && <option key={u.id} value={u.id}>{u.full_name || u.username || u.email}</option>
                ))}
              </Select>
            </FormGroup>

            <FormGroup>
              <Label><Activity size={14} /> Action</Label>
              <Select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setCurrentPage(1); }}>
                {ACTIONS.map((action) => (
                  <option key={action.value} value={action.value}>{action.label}</option>
                ))}
              </Select>
            </FormGroup>

            <FormGroup>
              <Label><FileText size={14} /> Resource</Label>
              <Select value={resourceTypeFilter} onChange={(e) => { setResourceTypeFilter(e.target.value); setCurrentPage(1); }}>
                {RESOURCE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </Select>
            </FormGroup>

            <FormGroup>
              <Label><Calendar size={14} /> Date Range</Label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }} />
                <Input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }} />
              </div>
            </FormGroup>

            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <Button variant="ghost" onClick={handleClearFilters} style={{ width: '50%', justifyContent: 'flex-end', alignItems: 'flex-end', marginRight: '1rem',position: 'relative', right: '0' }}>
                Clear Filters
              </Button>
            </div>

          </FilterSection>

          <TableContainer>
            {loading ? (
              <LoadingState>
                <Loader size={32} className="animate-spin" />
                <p>Loading audit logs...</p>
              </LoadingState>
            ) : logs.length === 0 ? (
              <EmptyState>
                <FileText size={48} style={{ margin: '0 auto', opacity: 0.2 }} />
                <p>No audit logs found matching your criteria.</p>
              </EmptyState>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Time</Th>
                    <Th>User</Th>
                    <Th>Action</Th>
                    <Th>Resource</Th>
                    <Th>Details</Th>
                    <Th>IP Address</Th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <Tr key={log.id}>
                      <Td style={{ whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 500 }}>{formatDate(log.created_at).split(',')[0]}</div>
                        <div style={{ fontSize: '0.75rem', color: theme.colors.textSecondary }}>
                          {formatDate(log.created_at).split(',')[1]}
                        </div>
                      </Td>
                      <Td>
                        <UserCell>
                          <span style={{ fontWeight: 500 }}>{log.user?.full_name || log.user?.username || `User #${log.user_id}`}</span>
                          <UserSubtext>{log.user?.email}</UserSubtext>
                        </UserCell>
                      </Td>
                      <Td>
                        <Badge $variant={getActionBadgeVariant(log.action)}>
                          {log.action.toUpperCase()}
                        </Badge>
                      </Td>
                      <Td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ textTransform: 'capitalize' }}>{log.resource_type}</span>
                          {log.resource_id && <UserSubtext>ID: {log.resource_id}</UserSubtext>}
                        </div>
                      </Td>
                      <Td>
                        <div style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={`${log.new_values || ''} ${log.old_values || ''}`}>
                          {log.new_values || log.old_values || '-'}
                        </div>
                      </Td>
                      <Td>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{log.ip_address || '-'}</span>
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            )}
          </TableContainer>

          <Pagination>
            <span style={{ fontSize: '0.875rem', color: theme.colors.textSecondary }}>
              Page {currentPage}
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1 || loading}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              >
                <ChevronLeft size={16} /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!hasMore || loading}
                onClick={() => setCurrentPage(p => p + 1)}
              >
                Next <ChevronRight size={16} />
              </Button>
            </div>
          </Pagination>
        </Card>
      </PageContainer>
    </ComponentGate>
  );
}
