'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import styled from 'styled-components';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import apiClient from '@/lib/api';
import { useUserStore } from '@/store/userStore';
import { toast } from 'sonner';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Building,
  Shield,
  Calendar,
  Edit,
  Trash2,
  UserCheck,
  Briefcase,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Layout from '@/components/layout';
import { theme } from '@/components/common/theme';

const PRIMARY_COLOR = theme.colors.primary || '#00AA00';
const TEXT_COLOR_DARK = '#111827';
const TEXT_COLOR_MUTED = theme.colors.textSecondary || '#666';

const CardShadow = `
  0 2px 4px -1px rgba(0, 0, 0, 0.06),
  0 1px 2px -1px rgba(0, 0, 0, 0.03),
  inset 0 0 0 1px rgba(0, 0, 0, 0.02)
`;

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 980px;
  margin-left: auto;
  margin-right: 0;
  padding: ${theme.spacing.sm} ${theme.spacing.sm} ${theme.spacing.sm};
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  color: ${TEXT_COLOR_MUTED};
  text-decoration: none;
  margin-bottom: ${theme.spacing.md};
  transition: color ${theme.transitions.default};

  &:hover {
    color: ${TEXT_COLOR_DARK};
  }
`;

const HeaderSection = styled.div`
  margin-bottom: ${theme.spacing.lg};
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: ${theme.spacing.md};
`;

const HeaderText = styled.div`
  h1 {
    font-size: clamp(24px, 3vw, 36px);
    font-weight: ${theme.typography.fontWeights.bold};
    margin: 0 0 ${theme.spacing.sm};
    color: ${TEXT_COLOR_DARK};
  }

  p {
    color: ${TEXT_COLOR_MUTED};
    font-size: ${theme.typography.fontSizes.md};
    margin: 0;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
`;

const ErrorBanner = styled.div`
  padding: ${theme.spacing.md};
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: ${theme.borderRadius.md};
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  color: #dc2626;
  margin-bottom: ${theme.spacing.md};
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${theme.spacing.lg};

  @media (min-width: 1024px) {
    grid-template-columns: 2fr 1fr;
  }
`;

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.lg};
`;

const SidebarContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.lg};
`;

const Card = styled.div`
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  padding: ${theme.spacing.lg};
  box-shadow: ${CardShadow};
`;

const CardTitle = styled.h2`
  font-size: ${theme.typography.fontSizes.lg};
  font-weight: ${theme.typography.fontWeights.bold};
  color: ${TEXT_COLOR_DARK};
  margin: 0 0 ${theme.spacing.lg};
`;

const UserHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.md};
`;

const AvatarWrapper = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(0, 170, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${PRIMARY_COLOR};
  flex-shrink: 0;
`;

const UserInfo = styled.div`
  h3 {
    font-size: ${theme.typography.fontSizes.xxl};
    font-weight: ${theme.typography.fontWeights.bold};
    color: ${TEXT_COLOR_DARK};
    margin: 0 0 ${theme.spacing.xs};
  }
`;

const BadgeContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  flex-wrap: wrap;
`;

const Badge = styled.span<{ variant: 'admin' | 'manager' | 'accountant' | 'employee' | 'active' | 'inactive' | 'default' }>`
  padding: ${theme.spacing.xs} ${theme.spacing.md};
  font-size: ${theme.typography.fontSizes.sm};
  font-weight: ${theme.typography.fontWeights.bold};
  border-radius: 9999px;
  display: inline-block;

  ${(p) => {
    switch (p.variant) {
      case 'admin':
        return 'background-color: #f3e8ff; color: #6b21a8;';
      case 'manager':
        return 'background-color: #dbeafe; color: #1e40af;';
      case 'accountant':
        return 'background-color: #dcfce7; color: #166534;';
      case 'employee':
        return 'background-color: #fed7aa; color: #9a3412;';
      case 'active':
        return 'background-color: #dcfce7; color: #166534;';
      case 'inactive':
        return 'background-color: #fee2e2; color: #991b1b;';
      default:
        return 'background-color: #f3f4f6; color: #374151;';
    }
  }}
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${theme.spacing.md};
  padding-top: ${theme.spacing.md};
  border-top: 1px solid ${theme.colors.border};

  @media (min-width: 768px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const InfoItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
`;

const IconWrapper = styled.div`
  color: ${TEXT_COLOR_MUTED};
  flex-shrink: 0;
`;

const InfoContent = styled.div`
  p:first-child {
    font-size: ${theme.typography.fontSizes.sm};
    color: ${TEXT_COLOR_MUTED};
    margin: 0 0 ${theme.spacing.xs};
  }

  p:last-child {
    font-size: ${theme.typography.fontSizes.sm};
    font-weight: ${theme.typography.fontWeights.medium};
    color: ${TEXT_COLOR_DARK};
    margin: 0;
  }
`;

const Section = styled.div`
  p:first-child {
    font-size: ${theme.typography.fontSizes.sm};
    color: ${TEXT_COLOR_MUTED};
    margin: 0 0 ${theme.spacing.sm};
  }

  p:last-child {
    font-size: ${theme.typography.fontSizes.sm};
    font-weight: ${theme.typography.fontWeights.medium};
    color: ${TEXT_COLOR_DARK};
    margin: 0;
  }
`;

const SubordinateList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.sm};
  margin-top: ${theme.spacing.sm};
`;

const SubordinateItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.md};
  background: ${theme.colors.backgroundSecondary};
`;

const SubordinateName = styled.span`
  font-size: ${theme.typography.fontSizes.sm};
  font-weight: ${theme.typography.fontWeights.medium};
  color: ${TEXT_COLOR_DARK};
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${theme.spacing.xxl};
  text-align: center;

  p {
    color: ${TEXT_COLOR_MUTED};
    margin-top: ${theme.spacing.md};
  }
`;

const Spinner = styled(Loader2)`
  animation: spin 1s linear infinite;
  color: ${PRIMARY_COLOR};

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

interface UserDetail {
  id: number;
  full_name: string;
  email: string;
  username: string;
  phone?: string | null;
  role: string;
  is_active: boolean;
  department?: string | null;
  manager_id?: number | null;
  created_at?: string;
  updated_at?: string | null;
}

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.id ? parseInt(params.id as string, 10) : null;
  const { user: currentUser, allUsers, fetchAllUsers } = useUserStore();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (userId) {
      loadUser();
    }
  }, [userId]);

  useEffect(() => {
    fetchAllUsers();
  }, []);

  const loadUser = async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.getUsers();
      const users = response.data || [];
      const foundUser = users.find((u: any) => u.id === userId);
      
      if (!foundUser) {
        setError('User not found');
        return;
      }

      setUser({
        id: foundUser.id,
        full_name: foundUser.full_name || foundUser.username || foundUser.email || '',
        email: foundUser.email || '',
        username: foundUser.username || '',
        phone: foundUser.phone || null,
        role: foundUser.role?.toLowerCase() || 'employee',
        is_active: foundUser.is_active !== false,
        department: foundUser.department || null,
        manager_id: foundUser.manager_id || null,
        created_at: foundUser.created_at || '',
        updated_at: (foundUser as any).updated_at || null,
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to load user';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!userId || !user) return;

    if (!confirm(`Are you sure you want to delete ${user.full_name}? This action cannot be undone.`)) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      await apiClient.deleteUser(userId);
      toast.success('User deleted successfully');
      router.push('/users');
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to delete user';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  const getRoleBadgeVariant = (role: string): 'admin' | 'manager' | 'accountant' | 'employee' | 'default' => {
    switch (role) {
      case 'admin':
        return 'admin';
      case 'finance_manager':
      case 'manager':
        return 'manager';
      case 'accountant':
        return 'accountant';
      case 'employee':
        return 'employee';
      default:
        return 'default';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield size={20} />;
      case 'finance_manager':
      case 'manager':
        return <Building size={20} />;
      case 'accountant':
        return <UserCheck size={20} />;
      case 'employee':
        return <Briefcase size={20} />;
      default:
        return <User size={20} />;
    }
  };

  const getRoleDisplayName = (role: string) => {
    const roleNames: Record<string, string> = {
      admin: 'Administrator',
      finance_manager: 'Finance Manager',
      manager: 'Manager',
      accountant: 'Accountant',
      employee: 'Employee',
    };
    return roleNames[role] || role;
  };

  const getManagerName = () => {
    if (!user?.manager_id) return 'None';
    const manager = allUsers.find(u => u.id === user.manager_id?.toString());
    return manager?.name || 'Unknown';
  };

  const getSubordinates = () => {
    if (!user) return [];
    return allUsers.filter(u => u.managerId === user.id.toString());
  };

  if (loading) {
    return (
      <Layout>
        <PageContainer>
          <LoadingContainer>
            <Spinner size={32} />
            <p>Loading user details...</p>
          </LoadingContainer>
        </PageContainer>
      </Layout>
    );
  }

  if (error && !user) {
    return (
      <Layout>
        <PageContainer>
          <BackLink href="/users">
            <ArrowLeft size={16} />
            Back to Users
          </BackLink>
          <ErrorBanner>
            <AlertCircle size={16} />
            <span>{error}</span>
          </ErrorBanner>
        </PageContainer>
      </Layout>
    );
  }

  if (!user) {
    return null;
  }

  const subordinates = getSubordinates();

  return (
    <Layout>
      <PageContainer>
        <HeaderSection>
          <BackLink href="/users">
            <ArrowLeft size={16} />
            Back to Users
          </BackLink>
          <HeaderContent>
            <HeaderText>
              <h1>User Details</h1>
              <p>View and manage user information</p>
            </HeaderText>
            <ActionButtons>
              <Button
                variant="outline"
                onClick={() => {
                  if (user.role === 'employee') {
                    router.push(`/employees/edit/${user.id}`);
                  } else if (user.role === 'accountant') {
                    router.push(`/accountants/edit/${user.id}`);
                  } else if (user.role === 'finance_manager' || user.role === 'manager') {
                    router.push(`/finance/edit/${user.id}`);
                  } else {
                    router.push(`/users/${user.id}/edit`);
                  }
                }}
              >
                <Edit size={16} style={{ marginRight: theme.spacing.sm }} />
                Edit User
              </Button>
              {(currentUser?.role === 'admin' || (currentUser?.role === 'finance_manager' && currentUser.id !== user.id.toString())) && 
               user.role !== 'admin' && user.role !== 'super_admin' && (
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? (
                    <>
                      <Spinner size={16} style={{ marginRight: theme.spacing.sm }} />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} style={{ marginRight: theme.spacing.sm }} />
                      Delete User
                    </>
                  )}
                </Button>
              )}
            </ActionButtons>
          </HeaderContent>
        </HeaderSection>

        {error && (
          <ErrorBanner>
            <AlertCircle size={16} />
            <span>{error}</span>
          </ErrorBanner>
        )}

        <ContentGrid>
          <MainContent>
            <Card>
              <CardTitle>Personal Information</CardTitle>
              <UserHeader>
                <AvatarWrapper>
                  {getRoleIcon(user.role)}
                </AvatarWrapper>
                <UserInfo>
                  <h3>{user.full_name}</h3>
                  <BadgeContainer>
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {getRoleDisplayName(user.role)}
                    </Badge>
                    <Badge variant={user.is_active ? 'active' : 'inactive'}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </BadgeContainer>
                </UserInfo>
              </UserHeader>

              <InfoGrid>
                <InfoItem>
                  <IconWrapper>
                    <Mail size={20} />
                  </IconWrapper>
                  <InfoContent>
                    <p>Email</p>
                    <p>{user.email}</p>
                  </InfoContent>
                </InfoItem>

                <InfoItem>
                  <IconWrapper>
                    <User size={20} />
                  </IconWrapper>
                  <InfoContent>
                    <p>Username</p>
                    <p>{user.username}</p>
                  </InfoContent>
                </InfoItem>

                {user.phone && (
                  <InfoItem>
                    <IconWrapper>
                      <Phone size={20} />
                    </IconWrapper>
                    <InfoContent>
                      <p>Phone</p>
                      <p>{user.phone}</p>
                    </InfoContent>
                  </InfoItem>
                )}

                {user.department && (
                  <InfoItem>
                    <IconWrapper>
                      <Building size={20} />
                    </IconWrapper>
                    <InfoContent>
                      <p>Department</p>
                      <p>{user.department}</p>
                    </InfoContent>
                  </InfoItem>
                )}
              </InfoGrid>
            </Card>

            <Card>
              <CardTitle>Team Hierarchy</CardTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
                <Section>
                  <p>Manager</p>
                  <p>{getManagerName()}</p>
                </Section>
                {subordinates.length > 0 && (
                  <Section>
                    <p>Subordinates ({subordinates.length})</p>
                    <SubordinateList>
                      {subordinates.map((sub) => (
                        <SubordinateItem key={sub.id}>
                          <SubordinateName>{sub.name}</SubordinateName>
                          <Badge variant={getRoleBadgeVariant(sub.role)}>
                            {getRoleDisplayName(sub.role)}
                          </Badge>
                        </SubordinateItem>
                      ))}
                    </SubordinateList>
                  </Section>
                )}
              </div>
            </Card>
          </MainContent>

          <SidebarContent>
            <Card>
              <CardTitle>Account Information</CardTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
                <Section>
                  <p>User ID</p>
                  <p>#{user.id}</p>
                </Section>
                {user.created_at && (
                  <Section>
                    <p>Created</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                      <Calendar size={16} style={{ color: TEXT_COLOR_MUTED }} />
                      <p style={{ margin: 0, fontSize: theme.typography.fontSizes.sm, fontWeight: theme.typography.fontWeights.medium, color: TEXT_COLOR_DARK }}>
                        {formatDate(user.created_at)}
                      </p>
                    </div>
                  </Section>
                )}
                {user.updated_at && (
                  <Section>
                    <p>Last Updated</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                      <Calendar size={16} style={{ color: TEXT_COLOR_MUTED }} />
                      <p style={{ margin: 0, fontSize: theme.typography.fontSizes.sm, fontWeight: theme.typography.fontWeights.medium, color: TEXT_COLOR_DARK }}>
                        {formatDate(user.updated_at)}
                      </p>
                    </div>
                  </Section>
                )}
              </div>
            </Card>
          </SidebarContent>
        </ContentGrid>
      </PageContainer>
    </Layout>
  );
}
