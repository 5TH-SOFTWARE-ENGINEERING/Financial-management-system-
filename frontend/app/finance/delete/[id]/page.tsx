'use client';

import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';

import Sidebar from '@/components/common/Sidebar';
import Navbar from '@/components/common/Navbar';

import apiClient from '@/lib/api';
import { useUserStore } from '@/store/userStore';

import {
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Briefcase,
  Loader2,
  AlertTriangle
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/* -------------------------------------------------------------------------- */
/*                             GLOBAL PAGE LAYOUT                             */
/* -------------------------------------------------------------------------- */

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
  max-width: 700px;
  margin: 0 auto;
`;

/* -------------------------------------------------------------------------- */
/*                                   UI STYLES                                */
/* -------------------------------------------------------------------------- */

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--muted-foreground);
  font-size: 14px;
  margin-bottom: 16px;
  transition: 0.2s;

  &:hover {
    color: var(--foreground);
  }
`;

const Title = styled.h1`
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Subtitle = styled.p`
  color: var(--muted-foreground);
  margin-bottom: 24px;
`;

const AlertBox = styled.div<{ status: 'error' | 'success' }>`
  padding: 14px;
  border-radius: 6px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;

  background: ${({ status }) =>
    status === 'error' ? '#FEF2F2' : '#ECFDF5'};
  border: 1px solid
    ${({ status }) =>
      status === 'error' ? '#FECACA' : '#A7F3D0'};
  color: ${({ status }) =>
    status === 'error' ? '#B91C1C' : '#047857'};
`;

const Card = styled.div`
  background: #fff;
  padding: 28px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
`;

const WarningSection = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 24px;
  
  .icon-wrapper {
    padding: 12px;
    background: #fee2e2;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  h2 {
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

const InfoBox = styled.div`
  background: var(--muted);
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 24px;
  
  div {
    margin-bottom: 8px;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    span:first-child {
      font-weight: 500;
      color: var(--foreground);
      margin-right: 8px;
    }
    
    span:last-child {
      color: var(--muted-foreground);
    }
  }
`;

const StatusBadge = styled.span<{ $active?: boolean }>`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  background: ${({ $active }) =>
    $active ? '#d1fae5' : '#fee2e2'};
  color: ${({ $active }) =>
    $active ? '#065f46' : '#991b1b'};
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 12px;
`;

const LoadingContainer = styled.div`
  padding: 32px;
  text-align: center;
  
  p {
    color: var(--muted-foreground);
    margin-top: 16px;
  }
`;

/* -------------------------------------------------------------------------- */
/*                                  COMPONENT                                 */
/* -------------------------------------------------------------------------- */

export default function DeleteFinancePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { deleteUser, fetchAllUsers } = useUserStore();

  const [loading, setLoading] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [financeManager, setFinanceManager] = useState<any>(null);
  const [password, setPassword] = useState('');

  /* ---------------------------- Load user details ---------------------------- */
  useEffect(() => {
    if (id) loadUser();
  }, [id]);

  const loadUser = async () => {
    setLoadingUser(true);
    setError(null);

    try {
      const response = await apiClient.getUsers();
      const user = (response.data || []).find(
        (u: any) => u.id.toString() === id
      );

      if (!user) {
        setError('Finance manager not found');
        return;
      }

      setFinanceManager(user);
    } catch (err: any) {
      setError('Failed to load finance manager');
      toast.error('Failed to load finance manager');
    } finally {
      setLoadingUser(false);
    }
  };

  /* ------------------------------- Delete user ------------------------------ */
  const handleDelete = async () => {
    if (!financeManager) return;

    if (
      !confirm(
        `Delete "${financeManager.full_name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    if (!password) {
      setError('Password is required');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!id) {
        throw new Error('Finance manager ID is required');
      }
      await apiClient.deleteUser(Number(id), password);
      await deleteUser(id, password);
      await fetchAllUsers();

      setSuccess('Finance manager deleted successfully!');
      toast.success('Finance manager deleted successfully!');

      setTimeout(() => router.push('/finance/list'), 1500);
    } catch (err: any) {
      const msg =
        err.response?.data?.detail ||
        'Failed to delete finance manager';

      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------ Loading state ------------------------------ */
  if (loadingUser) {
    return (
      <LayoutWrapper>
        <SidebarWrapper>
          <Sidebar />
        </SidebarWrapper>
        <ContentArea>
          <Navbar />
          <LoadingContainer>
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p>Loading finance manager...</p>
          </LoadingContainer>
        </ContentArea>
      </LayoutWrapper>
    );
  }

  /* ---------------------------- Not found / error --------------------------- */
  if (!financeManager) {
    return (
      <LayoutWrapper>
        <SidebarWrapper>
          <Sidebar />
        </SidebarWrapper>
        <ContentArea>
          <Navbar />
          <InnerContent>
            <BackLink href="/finance/list">
              <ArrowLeft size={16} />
              Back to Finance Managers
            </BackLink>
            <Card>
              <AlertBox status="error">
                <AlertCircle size={18} />
                {error || 'Finance manager not found'}
              </AlertBox>
            </Card>
          </InnerContent>
        </ContentArea>
      </LayoutWrapper>
    );
  }

  /* ------------------------------ Main content ------------------------------ */
  return (
    <LayoutWrapper>
      <SidebarWrapper>
        <Sidebar />
      </SidebarWrapper>
      <ContentArea>
        <Navbar />

        <InnerContent>
          <BackLink href="/finance/list">
            <ArrowLeft size={16} />
            Back to Finance Managers
          </BackLink>

          <Title>
            <Briefcase className="h-8 w-8 text-red-600" />
            Delete Finance Manager
          </Title>
          <Subtitle>Confirm deletion of finance manager</Subtitle>

          {error && (
            <AlertBox status="error">
              <AlertCircle size={18} />
              {error}
            </AlertBox>
          )}

          {success && (
            <AlertBox status="success">
              <CheckCircle size={18} />
              {success}
            </AlertBox>
          )}

          <Card>
            <WarningSection>
              <div className="icon-wrapper">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div style={{ flex: 1 }}>
                <h2>Are you sure you want to delete this finance manager?</h2>
                <p>This action cannot be undone. All associated data will be permanently deleted.</p>
              </div>
            </WarningSection>

            <InfoBox>
              <div>
                <span>Name:</span>
                <span>{financeManager.full_name}</span>
              </div>
              <div>
                <span>Email:</span>
                <span>{financeManager.email}</span>
              </div>
              <div>
                <span>Username:</span>
                <span>{financeManager.username}</span>
              </div>
              <div>
                <span>Department:</span>
                <span>{financeManager.department || 'N/A'}</span>
              </div>
              <div>
                <span>Status:</span>
                <StatusBadge $active={financeManager.is_active}>
                  {financeManager.is_active ? 'Active' : 'Inactive'}
                </StatusBadge>
              </div>
            </InfoBox>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--foreground)', fontWeight: 500 }}>
                Enter your password to confirm
              </label>
              <Input
                type="password"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            <ButtonRow>
              <Button
                type="button"
                variant="secondary"
                disabled={loading}
                onClick={() => router.push('/finance/list')}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={loading}
                onClick={handleDelete}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Delete Finance Manager
                  </>
                )}
              </Button>
            </ButtonRow>
          </Card>
        </InnerContent>
      </ContentArea>
    </LayoutWrapper>
  );
}
