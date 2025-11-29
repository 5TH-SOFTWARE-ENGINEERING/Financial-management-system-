'use client';
import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/common/Navbar';
import Sidebar from '@/components/common/Sidebar';
import Link from 'next/link';
import apiClient from '@/lib/api';
import { useRouter } from 'next/navigation';
import { AlertCircle, UserPlus, Edit, Trash2, Users, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

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

const EmptyState = styled.div`
  text-align: center;
  padding: 48px 24px;
  
  svg {
    margin: 0 auto 16px;
    color: var(--muted-foreground);
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
  
  th {
    text-align: left;
    padding: 12px 16px;
    font-weight: 600;
    color: var(--foreground);
    font-size: 14px;
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

const StatusBadge = styled.span<{ $active: boolean }>`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  background: ${(p) => (p.$active ? '#d1fae5' : '#fee2e2')};
  color: ${(p) => (p.$active ? '#065f46' : '#991b1b')};
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
      <LayoutWrapper>
        <SidebarWrapper>
          <Sidebar />
        </SidebarWrapper>
        <ContentArea>
          <Navbar />
          <LoadingContainer>
            <Spinner />
            <p>Loading employees...</p>
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
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Users size={16} style={{ color: 'var(--muted-foreground)' }} />
                            <span style={{ fontWeight: 500, color: 'var(--foreground)' }}>
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
                                Edit
                              </Button>
                            </Link>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleDelete(employee.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
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
        </InnerContent>
      </ContentArea>
    </LayoutWrapper>
  );
}

