// app/accountants/list/page.tsx
'use client';
import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import apiClient from '@/lib/api';
import { useRouter } from 'next/navigation';
import { AlertCircle, Edit, Trash2, UserPlus } from 'lucide-react';
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

const PageContainer = styled.div`
  padding: 32px;
`;

const PageHeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
`;

const PageTitle = styled.h1`
  font-size: 2rem;
  font-weight: 700;
`;

const AlertBox = styled.div`
  margin-bottom: 16px;
  padding: 16px;
  background: #FEF2F2; /* red-50 */
  border: 1px solid #FECACA; /* red-200 */
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #B91C1C; /* red-700 */
`;

const Card = styled.div`
  background: var(--card, #ffffff);
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 48px 0;
  color: #6B7280; /* gray-500 */
`;

const StatusPill = styled.span<{ isActive: boolean }>`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem; /* text-xs */
  font-weight: 500;

  ${({ isActive }) =>
    isActive
      ? `
        background: #D1FAE5; /* green-100 */
        color: #065F46; /* green-800 */
      `
      : `
        background: #FEE2E2; /* red-100 */
        color: #991B1B; /* red-800 */
      `}
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const LoadingMessage = styled.div`
  padding: 32px;
  text-align: center;
  padding-top: 48px;
  font-size: 1rem;
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
      <LoadingMessage>
        <p>Loading accountants...</p>
      </LoadingMessage>
    );
  }

  return (
    <PageContainer>
      <PageHeaderRow>
        <PageTitle>Accountants</PageTitle>
        <Link href="/accountants/create">
          <Button>
            <UserPlus size={16} className="mr-2" />
            Create Accountant
          </Button>
        </Link>
      </PageHeaderRow>

      {error && (
        <AlertBox>
          <AlertCircle size={16} />
          <span>{error}</span>
        </AlertBox>
      )}

      <Card>
        {accountants.length === 0 ? (
          <EmptyState>
            <p>No accountants found.</p>
            <Link href="/accountants/create">
              <Button className="mt-4">Create First Accountant</Button>
            </Link>
          </EmptyState>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ textAlign: 'left', padding: '12px', fontWeight: 600 }}>Name</th>
                <th style={{ textAlign: 'left', padding: '12px', fontWeight: 600 }}>Email</th>
                <th style={{ textAlign: 'left', padding: '12px', fontWeight: 600 }}>Username</th>
                <th style={{ textAlign: 'left', padding: '12px', fontWeight: 600 }}>Phone</th>
                <th style={{ textAlign: 'left', padding: '12px', fontWeight: 600 }}>Department</th>
                <th style={{ textAlign: 'left', padding: '12px', fontWeight: 600 }}>Status</th>
                <th style={{ textAlign: 'left', padding: '12px', fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {accountants.map((accountant) => (
                <tr key={accountant.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px' }}>{accountant.full_name || 'N/A'}</td>
                  <td style={{ padding: '12px' }}>{accountant.email}</td>
                  <td style={{ padding: '12px' }}>{accountant.username}</td>
                  <td style={{ padding: '12px' }}>{accountant.phone || 'N/A'}</td>
                  <td style={{ padding: '12px' }}>{accountant.department || 'N/A'}</td>
                  <td style={{ padding: '12px' }}>
                    <StatusPill isActive={accountant.is_active}>
                      {accountant.is_active ? 'Active' : 'Inactive'}
                    </StatusPill>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <ActionButtons>
                      <Link href={`/accountants/edit/${accountant.id}`}>
                        <Button size="sm" variant="secondary">
                          <Edit size={14} className="mr-1" />
                          Edit
                        </Button>
                      </Link>
                      <Link href={`/accountants/delete/${accountant.id}`}>
                        <Button size="sm" variant="destructive">
                          <Trash2 size={14} className="mr-1" />
                          Delete
                        </Button>
                      </Link>
                    </ActionButtons>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </PageContainer>
  );
}