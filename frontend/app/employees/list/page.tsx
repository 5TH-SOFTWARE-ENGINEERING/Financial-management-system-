'use client';
import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Button } from '@/components/ui/button';
import Layout from '@/components/layout';
import Link from 'next/link';
import apiClient from '@/lib/api';
import { useRouter } from 'next/navigation';
import { AlertCircle, UserPlus, Edit, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { theme } from '@/components/common/theme';

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

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing.lg};
  flex-wrap: wrap;
  gap: ${theme.spacing.md};
`;

const HeaderText = styled.div`
  h1 {
    font-size: clamp(24px, 3vw, 32px);
    font-weight: ${theme.typography.fontWeights.bold};
    margin: 0 0 ${theme.spacing.xs};
    color: ${TEXT_COLOR_DARK};
  }
  
  p {
    color: ${TEXT_COLOR_MUTED};
    font-size: ${theme.typography.fontSizes.sm};
    margin: 0;
  }
`;

const MessageBox = styled.div<{ type: 'error' | 'success' }>`
  padding: ${theme.spacing.md};
  border-radius: ${theme.borderRadius.md};
  margin-bottom: ${theme.spacing.lg};
  display: flex;
  gap: ${theme.spacing.sm};
  align-items: center;
  background-color: ${(p) => (p.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)')};
  border: 1px solid ${(p) => (p.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)')};
  color: ${(p) => (p.type === 'error' ? '#dc2626' : '#059669')};
  font-size: ${theme.typography.fontSizes.sm};
`;

const Card = styled.div`
  background: ${theme.colors.background};
  padding: ${theme.spacing.lg};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  box-shadow: ${CardShadow};
  transition: box-shadow ${theme.transitions.default};

  &:hover {
    box-shadow: ${CardShadowHover};
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${theme.spacing.xxl} ${theme.spacing.lg};
  
  svg {
    margin: 0 auto ${theme.spacing.md};
    color: ${TEXT_COLOR_MUTED};
    opacity: 0.5;
  }
  
  p {
    color: ${TEXT_COLOR_MUTED};
    margin-bottom: ${theme.spacing.md};
    font-size: ${theme.typography.fontSizes.md};
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
`;

const TableHeader = styled.thead`
  border-bottom: 2px solid ${theme.colors.border};
  background: ${theme.colors.backgroundSecondary};
  
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

const StatusBadge = styled.span<{ $active: boolean }>`
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.sm};
  font-size: ${theme.typography.fontSizes.xs};
  font-weight: ${theme.typography.fontWeights.medium};
  background: ${(p) => (p.$active ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)')};
  color: ${(p) => (p.$active ? '#065f46' : '#991b1b')};
`;

const ActionButtons = styled.div`
  display: flex;
  gap: ${theme.spacing.sm};
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

interface Employee {
  id: number;
  full_name: string;
  email: string;
  username: string;
  phone: string | null;
  role: string;
  is_active: boolean;
  department: string | null;
  manager_id?: number | null;
}

export default function EmployeeListPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.getUsers();
      // Filter for employees only and map to Employee type
      const employeeUsers = (response.data || [])
        .filter((user: any) => user.role?.toLowerCase() === 'employee')
        .map((user: any): Employee => ({
          id: user.id,
          full_name: user.full_name || '',
          email: user.email || '',
          username: user.username || '',
          phone: user.phone || null,
          role: user.role || 'employee',
          is_active: user.is_active ?? true,
          department: user.department || null,
          manager_id: user.manager_id || null,
        }));
      setEmployees(employeeUsers);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load employees');
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this employee? This action cannot be undone.')) {
      return;
    }

    try {
      await apiClient.deleteUser(id);
      toast.success('Employee deleted successfully');
      loadEmployees();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to delete employee');
    }
  };

  if (loading) {
    return (
      <Layout>
        <PageContainer>
          <ContentContainer>
            <LoadingContainer>
              <Spinner />
              <p>Loading employees...</p>
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
          <Header>
            <HeaderText>
              <h1>Employees</h1>
              <p>Manage employee accounts</p>
            </HeaderText>
            <Link href="/employees/create">
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Create Employee
              </Button>
            </Link>
          </Header>

          {error && (
            <MessageBox type="error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </MessageBox>
          )}

          <Card>
            {employees.length === 0 ? (
              <EmptyState>
                <Users size={48} />
                <p>No employees found.</p>
                <Link href="/employees/create">
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create First Employee
                  </Button>
                </Link>
              </EmptyState>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <Table>
                  <TableHeader>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Username</th>
                      <th>Phone</th>
                      <th>Department</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </TableHeader>
                  <TableBody>
                    {employees.map((employee) => (
                      <tr key={employee.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                            <Users size={16} style={{ color: TEXT_COLOR_MUTED }} />
                            <span style={{ fontWeight: theme.typography.fontWeights.medium, color: TEXT_COLOR_DARK }}>
                              {employee.full_name || 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td>{employee.email}</td>
                        <td>{employee.username}</td>
                        <td>{employee.phone || 'N/A'}</td>
                        <td>{employee.department || 'N/A'}</td>
                        <td>
                          <StatusBadge $active={employee.is_active}>
                            {employee.is_active ? 'Active' : 'Inactive'}
                          </StatusBadge>
                        </td>
                        <td>
                          <ActionButtons>
                            <Link href={`/employees/edit/${employee.id}`}>
                              <Button size="sm" variant="secondary">
                                <Edit className="h-4 w-4 mr-1" />
                              </Button>
                            </Link>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleDelete(employee.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
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
        </ContentContainer>
      </PageContainer>
    </Layout>
  );
}
