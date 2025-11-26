'use client';

import { useState, useEffect } from 'react';
import styled from 'styled-components';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import apiClient from '@/lib/api';

import {
  AlertCircle,
  UserPlus,
  Edit,
  Trash2,
  Briefcase,
  Search
} from 'lucide-react';

import Navbar from '@/components/common/Navbar';
import Sidebar from '@/components/common/Sidebar';
import { toast } from 'sonner';

// ──────────────────────────────────────────
// Types
// ──────────────────────────────────────────
interface FinanceManager {
  id: number;
  full_name?: string | null;
  email: string;
  username?: string | null;
  phone?: string | null;
  role: string;
  is_active: boolean;
  department?: string | null;
}

// ──────────────────────────────────────────
// Styled Components Layout
// ──────────────────────────────────────────
const PageWrapper = styled.div`
  display: flex;
  height: 100vh;
  background: #f7f7f9;
`;

const ContentArea = styled.div`
  flex: 1;
  padding-left: 260px; /* Sidebar width */
  display: flex;
  flex-direction: column;
`;

const PageContent = styled.div`
  padding: 24px;
`;

const Card = styled.div`
  background: white;
  padding: 24px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
`;

const Table = styled.table`
  width: 100%;
`;

const TableRow = styled.tr`
  border-bottom: 1px solid #e5e7eb;

  &:hover {
    background: #fafafa;
  }
`;

const Badge = styled.span<{ active: boolean }>`
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  color: ${(p) => (p.active ? '#065f46' : '#991b1b')};
  background: ${(p) => (p.active ? '#d1fae5' : '#fee2e2')};
`;

// ──────────────────────────────────────────
// Component
// ──────────────────────────────────────────
export default function FinanceListPage() {
  const router = useRouter();
  const [financeManagers, setFinanceManagers] = useState<FinanceManager[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadFinanceManagers();
  }, []);

  const loadFinanceManagers = async () => {
    try {
      setLoading(true);

      const response = await apiClient.getUsers();

      const managers = (response.data || []).filter((user: any) =>
        ['manager', 'finance_manager'].includes(user.role?.toLowerCase())
      );

      setFinanceManagers(managers);
    } catch (err: any) {
      console.error('Error loading finance managers:', err);
      let message = 'Failed to load finance managers';
      
      if (err.response) {
        if (err.response.status === 404) {
          message = 'Users endpoint not found. Please check API configuration.';
        } else if (err.response.status === 403) {
          message = 'You do not have permission to view users. Only managers and admins can access this page.';
        } else {
          message = err.response?.data?.detail || err.response?.data?.message || message;
        }
      } else if (err.message) {
        message = err.message;
      }
      
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure? This action cannot be undone.')) return;

    try {
      await apiClient.deleteUser(id);
      toast.success('Finance manager deleted');
      loadFinanceManagers();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to delete manager');
    }
  };

  const filtered = financeManagers.filter((m) =>
    [m.full_name, m.email, m.username]
      .join(' ')
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <PageWrapper>
        <Sidebar />
        <ContentArea>
          <Navbar />
          <PageContent>
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <div className="animate-spin w-8 h-8 border-2 border-gray-400 border-r-transparent rounded-full mx-auto"></div>
              <p style={{ marginTop: '12px', color: '#6b7280' }}>Loading...</p>
            </div>
          </PageContent>
        </ContentArea>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <Sidebar />
      <ContentArea>
        <Navbar />

        <PageContent>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 700 }}>Finance Managers</h1>
              <p style={{ color: '#6b7280', marginTop: 4 }}>Manage financial department users</p>
            </div>

            <Link href="/finance/create">
              <Button>
                <UserPlus size={16} className="mr-2" /> Add Finance Manager
              </Button>
            </Link>
          </div>

          {error && (
            <div
              style={{
                background: '#fee2e2',
                border: '1px solid #fecaca',
                padding: '12px',
                borderRadius: 8,
                display: 'flex',
                gap: 8,
                color: '#991b1b',
                marginBottom: 16,
              }}
            >
              <AlertCircle size={18} /> {error}
            </div>
          )}

          {/* Search */}
          <div style={{ marginBottom: 20, position: 'relative' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                top: '50%',
                left: 12,
                transform: 'translateY(-50%)',
                color: '#9ca3af',
              }}
            />
            <Input
              placeholder="Search finance managers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <Card>
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px' }}>
                <Briefcase size={40} style={{ color: '#9ca3af', margin: '0 auto' }} />
                <p style={{ marginTop: 12, color: '#6b7280' }}>No finance managers found.</p>
              </div>
            ) : (
              <Table>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ textAlign: 'left', padding: '12px' }}>Name</th>
                    <th>Email</th>
                    <th>Username</th>
                    <th>Phone</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((m) => (
                    <TableRow key={m.id}>
                      <td style={{ padding: '12px' }}>{m.full_name || 'N/A'}</td>
                      <td>{m.email}</td>
                      <td>{m.username}</td>
                      <td>{m.phone || 'N/A'}</td>
                      <td>{m.department || 'N/A'}</td>
                      <td>
                      <Badge active={m.is_active}>
                         {m.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      </td>
                      <td style={{ padding: '12px', display: 'flex', gap: 8 }}>
                        <Link href={`/finance/edit/${m.id}`}>
                          <Button size="sm" variant="secondary">
                            <Edit size={14} className="mr-1" /> Edit
                          </Button>
                        </Link>

                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(m.id)}
                        >
                          <Trash2 size={14} className="mr-1" /> Delete
                        </Button>
                      </td>
                    </TableRow>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
        </PageContent>
      </ContentArea>
    </PageWrapper>
  );
}
