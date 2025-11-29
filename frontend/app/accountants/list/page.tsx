// app/accountants/list/page.tsx
'use client';
import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/common/Navbar';
import Sidebar from '@/components/common/Sidebar';
import Link from 'next/link';
import apiClient from '@/lib/api';
import { useRouter } from 'next/navigation';
import { AlertCircle, Edit, Trash2, UserPlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

/* --------------------------------- INTERFACE ---------------------------------- */

interface Accountant {
  id: number;
  full_name: string;
  email: string;
  username: string;
  phone: string | null;
  role: string;
  is_active: boolean;
  department: string | null;
}

/* --------------------------------- STYLED COMPONENTS ---------------------------------- */

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
  justify-content: space-between;
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

const AlertBox = styled.div`
  margin-bottom: 16px;
  padding: 16px;
  background: #FEF2F2;
  border: 1px solid #FECACA;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #B91C1C;
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
  
  p {
    color: var(--muted-foreground);
    margin-bottom: 16px;
  }
`;

const StatusPill = styled.span<{ $isActive: boolean }>`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;

  ${({ $isActive }) =>
    $isActive
      ? `
        background: #D1FAE5;
        color: #065F46;
      `
      : `
        background: #FEE2E2;
        color: #991B1B;
      `}
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

/* --------------------------------- PAGE ---------------------------------- */

export default function AccountantListPage() {
  const router = useRouter();
  const [accountants, setAccountants] = useState<Accountant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAccountants();
  }, []);

  const loadAccountants = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.getUsers();
      // Filter for accountants only
      const accountantUsers = (response.data || []).filter(
        (user: any) => user.role?.toLowerCase() === 'accountant'
      ).map((user: any) => ({
        id: user.id,
        full_name: user.full_name || '',
        email: user.email || '',
        username: user.username || '',
        phone: user.phone || null,
        role: user.role || 'accountant',
        is_active: user.is_active ?? true,
        department: user.department || null,
      }));
      setAccountants(accountantUsers);
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Failed to load accountants';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this accountant?')) {
      return;
    }

    try {
      await apiClient.deleteUser(id);
      toast.success('Accountant deleted successfully');
      loadAccountants();
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Failed to delete accountant';
      toast.error(errorMsg);
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
            <p>Loading accountants...</p>
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
              <h1>Accountants</h1>
              <p>Manage accountant accounts</p>
            </HeaderText>
            <Link href="/accountants/create">
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Create Accountant
              </Button>
            </Link>
          </Header>

          {error && (
            <AlertBox>
              <AlertCircle size={18} />
              <span>{error}</span>
            </AlertBox>
          )}

          <Card>
            {accountants.length === 0 ? (
              <EmptyState>
                <p>No accountants found.</p>
                <Link href="/accountants/create">
                  <Button className="mt-4">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create First Accountant
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
                    {accountants.map((accountant) => (
                      <tr key={accountant.id}>
                        <td>{accountant.full_name || 'N/A'}</td>
                        <td>{accountant.email}</td>
                        <td>{accountant.username}</td>
                        <td>{accountant.phone || 'N/A'}</td>
                        <td>{accountant.department || 'N/A'}</td>
                        <td>
                          <StatusPill $isActive={accountant.is_active}>
                            {accountant.is_active ? 'Active' : 'Inactive'}
                          </StatusPill>
                        </td>
                        <td>
                          <ActionButtons>
                            <Link href={`/accountants/edit/${accountant.id}`}>
                              <Button size="sm" variant="secondary">
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                            </Link>
                            <Link href={`/accountants/delete/${accountant.id}`}>
                              <Button size="sm" variant="destructive">
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </Link>
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