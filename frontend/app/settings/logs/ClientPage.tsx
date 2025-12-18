'use client';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
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
  Loader
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import apiClient from '@/lib/api';
import { toast } from 'sonner';

// Styled components
const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Card = styled.div`
  background-color: white;
  border-radius: 0.375rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.25rem;
`;

const CardHeader = styled.div`
  padding: 1rem 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f3f4f6;
`;

const CardTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CardContent = styled.div`
  padding: 1.25rem;
`;

const FiltersContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: #4b5563;
`;

const Input = styled.input`
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  transition: border-color 0.15s ease;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 1px #3b82f6;
  }
`;

const Select = styled.select`
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  background-color: white;
  transition: border-color 0.15s ease;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 1px #3b82f6;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
  flex-wrap: wrap;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
`;

const TableHeader = styled.thead`
  background-color: #f9fafb;
  border-bottom: 2px solid #e5e7eb;
`;

const TableHeaderCell = styled.th`
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: 600;
  color: #374151;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr`
  border-bottom: 1px solid #f3f4f6;
  transition: background-color 0.15s ease;
  
  &:hover {
    background-color: #f9fafb;
  }
`;

const TableCell = styled.td`
  padding: 0.75rem 1rem;
  color: #111827;
  vertical-align: top;
`;

const Badge = styled.span<{ $variant?: 'success' | 'warning' | 'danger' | 'info' }>`
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  
  ${props => {
    switch (props.$variant) {
      case 'success':
        return 'background-color: #dcfce7; color: #166534;';
      case 'warning':
        return 'background-color: #fef3c7; color: #92400e;';
      case 'danger':
        return 'background-color: #fee2e2; color: #991b1b;';
      case 'info':
      default:
        return 'background-color: #dbeafe; color: #1e40af;';
    }
  }}
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  color: #6b7280;
`;

const Message = styled.div<{ type: 'error' | 'success' | 'warning' }>`
  background-color: ${props => 
    props.type === 'error' ? '#fee2e2' : 
    props.type === 'warning' ? '#fef3c7' : 
    '#dcfce7'};
  color: ${props => 
    props.type === 'error' ? '#b91c1c' : 
    props.type === 'warning' ? '#92400e' : 
    '#166534'};
  padding: 0.75rem;
  border-radius: 0.25rem;
  margin-bottom: 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
`;

const AccessDeniedContainer = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const AccessDeniedTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
`;

const AccessDeniedMessage = styled.p`
  color: #6b7280;
  font-size: 1rem;
  margin-bottom: 1rem;
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
`;

const PaginationInfo = styled.span`
  font-size: 0.875rem;
  color: #6b7280;
`;

const PaginationButtons = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #6b7280;
`;

const HelperText = styled.p`
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.25rem;
`;

const DetailsText = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

interface AuditLog {
  id: number;
  user_id: number;
  action: string;
  resource_type: string;
  resource_id?: number | null;
  old_values?: string | null;
  new_values?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
  user?: {
    id: number;
    username?: string;
    full_name?: string;
    email?: string;
  };
}

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
];

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  } catch {
    return dateString;
  }
}

function getActionBadgeVariant(action: string): 'success' | 'warning' | 'danger' | 'info' {
  switch (action.toLowerCase()) {
    case 'create':
    case 'approve':
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
      return 'info';
  }
}

export default function LogsPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<AuditLog['user'][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  
  // Filters
  const [userIdFilter, setUserIdFilter] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('');
  const [resourceTypeFilter, setResourceTypeFilter] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(50);
  const [totalCount, setTotalCount] = useState(0);

  // Check if user has required role (ADMIN or SUPER_ADMIN)
  const hasRequiredRole = React.useMemo(() => {
    if (!user) return false;
    const userRole = user.role?.toLowerCase();
    // Check normalized roles: admin (could be admin or super_admin)
    return userRole === 'admin';
  }, [user]);

  useEffect(() => {
    if (!user) return;
    
    // Check role upfront for better UX (optimistic permission check)
    if (hasRequiredRole) {
      setHasPermission(true);
    }
    
    // Load users for filter dropdown
    loadUsers();
    
    // Load logs
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Reload logs when filters or pagination changes
  useEffect(() => {
    if (hasPermission === true) {
      loadLogs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, userIdFilter, actionFilter, resourceTypeFilter, startDate, endDate]);

  const loadUsers = async () => {
    try {
      const response = await apiClient.getUsers();
      const userList = (response.data || []).map((u: { id?: unknown; username?: unknown; full_name?: unknown; email?: unknown }) => ({
        id: typeof u.id === 'number' ? u.id : parseInt(String(u.id ?? 0), 10),
        username: typeof u.username === 'string' ? u.username : undefined,
        full_name: typeof u.full_name === 'string' ? u.full_name : undefined,
        email: typeof u.email === 'string' ? u.email : undefined,
      }));
      setUsers(userList);
    } catch {
      // Silently fail - users are optional for filtering
      setUsers([]);
    }
  };

  const loadLogs = async () => {
    if (hasPermission === false) return;

    setLoading(true);
    setError(null);

    try {
      const filters: Record<string, unknown> = {
        skip: (currentPage - 1) * limit,
        limit: limit,
      };

      if (userIdFilter) {
        filters.user_id = parseInt(userIdFilter, 10);
      }
      if (actionFilter) {
        filters.action = actionFilter;
      }
      if (resourceTypeFilter) {
        filters.resource_type = resourceTypeFilter;
      }
      if (startDate) {
        filters.start_date = startDate;
      }
      if (endDate) {
        filters.end_date = endDate;
      }

      const response = await apiClient.getAuditLogs(filters);
      const logsData = Array.isArray(response.data)
        ? (response.data as unknown[]).filter((item): item is AuditLog => {
            const record = item as Partial<AuditLog>;
            return typeof record.id === 'number' && typeof record.user_id === 'number' && typeof record.created_at === 'string';
          })
        : [];
      
      // Use user information from API response or fallback to users list
      const enrichedLogs = logsData.map((log) => ({
        ...log,
        user:
          log.user ||
          users.find((u) => u?.id === log.user_id) || {
            id: log.user_id,
            username: `User ${log.user_id}`,
            full_name: `User ${log.user_id}`,
          },
      }));

      setLogs(enrichedLogs);
      setTotalCount(logsData.length); // Note: Backend doesn't return total count, so we use current page count
      
      // If we got a full page, there might be more
      if (logsData.length === limit) {
        // Could fetch next page to check, but for now we'll just show current count
      }
    } catch (err: unknown) {
      console.error('Failed to load logs:', err);
      const status = typeof err === 'object' && err !== null && 'response' in err
        ? (err as { response?: { status?: number } }).response?.status
        : undefined;
      const detail = typeof err === 'object' && err !== null && 'response' in err
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : err instanceof Error
          ? err.message
          : undefined;

      if (status === 403) {
        setError('Access denied. Logs view requires ADMIN role.');
        setHasPermission(false);
        toast.error('Access denied. Logs view requires ADMIN role.');
      } else {
        const message = detail || 'Failed to load logs. Please try again.';
        setError(message);
        toast.error(message);
      }
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setUserIdFilter('');
    setActionFilter('');
    setResourceTypeFilter('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const handleExport = () => {
    // Create CSV content
    const headers = ['ID', 'Timestamp', 'User', 'Action', 'Resource Type', 'Resource ID', 'IP Address', 'User Agent'];
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
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Logs exported successfully');
  };

  if (!user) {
    return (
      <Container>
        <LoadingContainer>
          <Loader size={24} className="animate-spin" />
          <p>Loading...</p>
        </LoadingContainer>
      </Container>
    );
  }

  // Show access denied message if user doesn't have permission
  if (hasPermission === false) {
    return (
      <ComponentGate componentId={ComponentId.SETTINGS_VIEW}>
        <Container>
          <Header>
            <Title>
              <FileText size={24} />
              Audit Logs
            </Title>
          </Header>
          <AccessDeniedContainer>
            <AlertTriangle size={48} color="#ef4444" />
            <AccessDeniedTitle>Access Denied</AccessDeniedTitle>
            <AccessDeniedMessage>
              You do not have the necessary permissions to view audit logs.
              <br />
              Audit logs view requires an <strong>ADMIN</strong> role.
            </AccessDeniedMessage>
            <HelperText>Please contact your administrator if you believe this is an error.</HelperText>
          </AccessDeniedContainer>
        </Container>
      </ComponentGate>
    );
  }

  return (
    <ComponentGate componentId={ComponentId.SETTINGS_VIEW}>
      <Container>
        <Header>
          <Title>
            <FileText size={24} />
            Audit Logs
          </Title>
          <ActionButtons>
            <Button
              variant="secondary"
              onClick={loadLogs}
              disabled={loading}
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Refresh
            </Button>
            {logs.length > 0 && (
              <Button
                variant="default"
                onClick={handleExport}
                disabled={loading}
              >
                <Download size={16} />
                Export CSV
              </Button>
            )}
          </ActionButtons>
        </Header>

        {error && (
          <Message type="error">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </Message>
        )}

        <Card>
          <CardHeader>
            <CardTitle>
              <Filter size={18} />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FiltersContainer>
              <FormGroup>
                <Label htmlFor="user-filter">
                  <User size={14} className="inline mr-1" />
                  User
                </Label>
                <Select
                  id="user-filter"
                  value={userIdFilter}
                  onChange={(e) => {
                    setUserIdFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="">All Users</option>
                  {users.map((u) => (
                    u ? (
                      <option key={u.id} value={u.id}>
                        {u.full_name || u.username || u.email}
                      </option>
                    ) : null
                  ))}
                </Select>
              </FormGroup>

              <FormGroup>
                <Label htmlFor="action-filter">
                  <Activity size={14} className="inline mr-1" />
                  Action
                </Label>
                <Select
                  id="action-filter"
                  value={actionFilter}
                  onChange={(e) => {
                    setActionFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  {ACTIONS.map((action) => (
                    <option key={action.value} value={action.value}>
                      {action.label}
                    </option>
                  ))}
                </Select>
              </FormGroup>

              <FormGroup>
                <Label htmlFor="resource-filter">
                  <FileText size={14} className="inline mr-1" />
                  Resource Type
                </Label>
                <Select
                  id="resource-filter"
                  value={resourceTypeFilter}
                  onChange={(e) => {
                    setResourceTypeFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  {RESOURCE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </Select>
              </FormGroup>

              <FormGroup>
                <Label htmlFor="start-date">
                  <Calendar size={14} className="inline mr-1" />
                  Start Date
                </Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="end-date">
                  <Calendar size={14} className="inline mr-1" />
                  End Date
                </Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </FormGroup>
            </FiltersContainer>

            <ActionButtons>
              <Button
                variant="secondary"
                onClick={handleClearFilters}
                disabled={loading}
              >
                Clear Filters
              </Button>
            </ActionButtons>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <FileText size={18} />
              Log Entries
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <LoadingContainer>
                <Loader size={24} className="animate-spin" />
                <p>Loading logs...</p>
              </LoadingContainer>
            ) : logs.length === 0 ? (
              <EmptyState>
                <FileText size={48} className="mx-auto mb-4 text-gray-400" />
                <p>No logs found</p>
                <HelperText>
                  {userIdFilter || actionFilter || resourceTypeFilter || startDate || endDate
                    ? 'Try adjusting your filters'
                    : 'Audit logs will appear here as users perform actions'}
                </HelperText>
              </EmptyState>
            ) : (
              <>
                <div style={{ overflowX: 'auto' }}>
                  <Table>
                    <TableHeader>
                      <tr>
                        <TableHeaderCell>ID</TableHeaderCell>
                        <TableHeaderCell>Timestamp</TableHeaderCell>
                        <TableHeaderCell>User</TableHeaderCell>
                        <TableHeaderCell>Action</TableHeaderCell>
                        <TableHeaderCell>Resource</TableHeaderCell>
                        <TableHeaderCell>Resource ID</TableHeaderCell>
                        <TableHeaderCell>IP Address</TableHeaderCell>
                        <TableHeaderCell>Details</TableHeaderCell>
                      </tr>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>#{log.id}</TableCell>
                          <TableCell>
                            <div style={{ whiteSpace: 'nowrap' }}>
                              {formatDate(log.created_at)}
                            </div>
                          </TableCell>
                          <TableCell>
                            {log.user?.full_name || log.user?.username || `User ${log.user_id}`}
                          </TableCell>
                          <TableCell>
                            <Badge $variant={getActionBadgeVariant(log.action)}>
                              {log.action.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {log.resource_type}
                          </TableCell>
                          <TableCell>
                            {log.resource_id || '-'}
                          </TableCell>
                          <TableCell>
                            {log.ip_address || '-'}
                          </TableCell>
                          <TableCell>
                            <DetailsText title={log.user_agent || ''}>
                              {log.user_agent || '-'}
                            </DetailsText>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <PaginationContainer>
                  <PaginationInfo>
                    Showing {logs.length} log{logs.length !== 1 ? 's' : ''}
                    {totalCount > logs.length && ` of ${totalCount}+`}
                  </PaginationInfo>
                  <PaginationButtons>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1 || loading}
                    >
                      Previous
                    </Button>
                    <span style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                      Page {currentPage}
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setCurrentPage(prev => prev + 1)}
                      disabled={logs.length < limit || loading}
                    >
                      Next
                    </Button>
                  </PaginationButtons>
                </PaginationContainer>
              </>
            )}
          </CardContent>
        </Card>
      </Container>
    </ComponentGate>
  );
}

