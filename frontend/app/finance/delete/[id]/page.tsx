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

/* -------------------------------------------------------------------------- */
/*                             GLOBAL PAGE LAYOUT                             */
/* -------------------------------------------------------------------------- */

const Layout = styled.div`
  display: flex;
  width: 100%;
  min-height: 100vh;
  background: var(--background);
`;

const SidebarWrapper = styled.div`
  width: 250px;
  background: var(--card);
  border-right: 1px solid var(--border);
`;

const MainWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const ContentWrapper = styled.div`
  flex: 1;
  padding: 32px;
`;

const PageWrapper = styled.div`
  max-width: 720px;
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

const PageHeader = styled.div`
  margin-bottom: 24px;
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 700;
`;

const Subtitle = styled.p`
  color: var(--muted-foreground);
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
  background: var(--card);
  padding: 24px;
  border-radius: 8px;
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
`;

const DangerInfo = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 24px;
`;

const IconContainer = styled.div`
  padding: 12px;
  background: #fee2e2;
  border-radius: 999px;
`;

const UserInfoBox = styled.div`
  background: var(--muted);
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 24px;
`;

const UserInfoRow = styled.div`
  margin-bottom: 8px;

  span:first-child {
    font-weight: 600;
    color: var(--foreground);
  }

  span:last-child {
    color: var(--muted-foreground);
  }
`;

const StatusBadge = styled.span<{ active?: boolean }>`
  padding: 3px 8px;
  font-size: 12px;
  border-radius: 6px;

  background: ${({ active }) =>
    active ? '#DCFCE7' : '#FEE2E2'};
  color: ${({ active }) =>
    active ? '#166534' : '#B91C1C'};
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 16px;
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

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!id) {
        throw new Error('Finance manager ID is required');
      }
      await apiClient.deleteUser(Number(id));
      await deleteUser(id);
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
      <Layout>
        <SidebarWrapper>
          <Sidebar />
        </SidebarWrapper>

        <MainWrapper>
          <Navbar />
          <ContentWrapper>
            <PageWrapper>
              <div style={{ textAlign: 'center', padding: '70px' }}>
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">
                  Loading finance manager...
                </p>
              </div>
            </PageWrapper>
          </ContentWrapper>
        </MainWrapper>
      </Layout>
    );
  }

  /* ---------------------------- Not found / error --------------------------- */
  if (!financeManager) {
    return (
      <Layout>
        <SidebarWrapper>
          <Sidebar />
        </SidebarWrapper>

        <MainWrapper>
          <Navbar />
          <ContentWrapper>
            <PageWrapper>
              <BackLink href="/finance/list">
                <ArrowLeft size={16} />
                Back to Finance Managers
              </BackLink>

              <AlertBox status="error">
                <AlertCircle size={16} />
                {error || 'Finance manager not found'}
              </AlertBox>
            </PageWrapper>
          </ContentWrapper>
        </MainWrapper>
      </Layout>
    );
  }

  /* ------------------------------ Main content ------------------------------ */
  return (
    <Layout>
      <SidebarWrapper>
        <Sidebar />
      </SidebarWrapper>

      <MainWrapper>
        <Navbar />

        <ContentWrapper>
          <PageWrapper>
            {/* Back */}
            <BackLink href="/finance/list">
              <ArrowLeft size={16} />
              Back to Finance Managers
            </BackLink>

            {/* Header */}
            <PageHeader>
              <HeaderRow>
                <Briefcase className="h-8 w-8 text-red-600" />
                <Title>Delete Finance Manager</Title>
              </HeaderRow>
              <Subtitle>Confirm deletion of finance manager</Subtitle>
            </PageHeader>

            {/* Alerts */}
            {error && (
              <AlertBox status="error">
                <AlertCircle size={16} />
                {error}
              </AlertBox>
            )}

            {success && (
              <AlertBox status="success">
                <CheckCircle size={16} />
                {success}
              </AlertBox>
            )}

            <Card>
              {/* Warning box */}
              <DangerInfo>
                <IconContainer>
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </IconContainer>

                <div>
                  <h2 className="text-lg font-semibold mb-2">
                    Are you sure you want to delete this finance manager?
                  </h2>
                  <p className="text-muted-foreground">
                    This action cannot be undone. All associated data will be
                    permanently deleted.
                  </p>
                </div>
              </DangerInfo>

              {/* User Info */}
              <UserInfoBox>
                <UserInfoRow>
                  <span>Name:</span> <span>{financeManager.full_name}</span>
                </UserInfoRow>

                <UserInfoRow>
                  <span>Email:</span> <span>{financeManager.email}</span>
                </UserInfoRow>

                <UserInfoRow>
                  <span>Username:</span>{' '}
                  <span>{financeManager.username}</span>
                </UserInfoRow>

                <UserInfoRow>
                  <span>Department:</span>{' '}
                  <span>{financeManager.department || 'N/A'}</span>
                </UserInfoRow>

                <UserInfoRow>
                  <span>Status:</span>
                  <StatusBadge active={financeManager.is_active}>
                    {financeManager.is_active ? 'Active' : 'Inactive'}
                  </StatusBadge>
                </UserInfoRow>
              </UserInfoBox>

              {/* Buttons */}
              <ButtonRow>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={loading}
                  onClick={() => router.push('/finance/list')}
                >
                  Cancel
                </Button>

                <Button
                  type="button"
                  variant="destructive"
                  disabled={loading}
                  onClick={handleDelete}
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
          </PageWrapper>
        </ContentWrapper>
      </MainWrapper>
    </Layout>
  );
}
