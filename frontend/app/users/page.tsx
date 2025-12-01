'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import {
  Users,
  UserPlus,
  Search,
  Edit,
  Trash2,
  Eye,
  Mail,
  Phone,
  Building,
  UserCheck,
  Briefcase,
  Shield,
  Calendar,
  ChevronDown,
  ChevronRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { formatDate } from '@/lib/utils';
import apiClient from '@/lib/api';
import { toast } from 'sonner';
import Layout from '@/components/layout';
import { theme } from '@/components/common/theme';
import { Button } from '@/components/ui/button';

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

const HeaderCard = styled.div`
  background: ${theme.colors.background};
  border-bottom: 1px solid ${theme.colors.border};
  padding: ${theme.spacing.lg};
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
    font-size: clamp(24px, 3vw, 32px);
    font-weight: ${theme.typography.fontWeights.bold};
    margin: 0 0 ${theme.spacing.xs};
    color: ${TEXT_COLOR_DARK};
  }

  p {
    color: ${TEXT_COLOR_MUTED};
    font-size: ${theme.typography.fontSizes.md};
    margin: 0;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.lg};
`;

const StatCard = styled.div`
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  padding: ${theme.spacing.lg};
  box-shadow: ${CardShadow};
`;

const StatContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const StatInfo = styled.div`
  p:first-child {
    font-size: ${theme.typography.fontSizes.sm};
    font-weight: ${theme.typography.fontWeights.medium};
    color: ${TEXT_COLOR_MUTED};
    margin: 0 0 ${theme.spacing.xs};
  }

  p:last-child {
    font-size: clamp(20px, 2.5vw, 28px);
    font-weight: ${theme.typography.fontWeights.bold};
    color: ${TEXT_COLOR_DARK};
    margin: 0;
  }
`;

const StatIcon = styled.div<{ color: string }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${(p) => p.color}20;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${(p) => p.color};
  flex-shrink: 0;
`;

const FiltersContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.lg};

  @media (min-width: 640px) {
    flex-direction: row;
  }
`;

const SearchWrapper = styled.div`
  flex: 1;
  position: relative;

  svg {
    position: absolute;
    left: ${theme.spacing.md};
    top: 50%;
    transform: translateY(-50%);
    color: ${TEXT_COLOR_MUTED};
    pointer-events: none;
  }
`;

const SearchInput = styled.input`
  width: 70%;
  padding: ${theme.spacing.sm} ${theme.spacing.md} ${theme.spacing.sm} 40px;
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  background: ${theme.colors.background};
  color: ${TEXT_COLOR_DARK};
  font-size: ${theme.typography.fontSizes.sm};

  &::placeholder {
    color: ${TEXT_COLOR_MUTED};
  }

  &:focus {
    outline: none;
    border-color: ${PRIMARY_COLOR};
    box-shadow: 0 0 0 3px rgba(0, 170, 0, 0.1);
  }
`;

const Select = styled.select`
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  background: ${theme.colors.background};
  color: ${TEXT_COLOR_DARK};
  font-size: ${theme.typography.fontSizes.sm};

  &:focus {
    outline: none;
    border-color: ${PRIMARY_COLOR};
    box-shadow: 0 0 0 3px rgba(0, 170, 0, 0.1);
  }
`;

const UsersCard = styled.div`
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  box-shadow: ${CardShadow};
`;

const CardHeader = styled.div`
  padding: ${theme.spacing.lg};
  border-bottom: 1px solid ${theme.colors.border};

  h2 {
    font-size: ${theme.typography.fontSizes.lg};
    font-weight: ${theme.typography.fontWeights.bold};
    color: ${TEXT_COLOR_DARK};
    margin: 0 0 ${theme.spacing.xs};
  }

  p {
    font-size: ${theme.typography.fontSizes.sm};
    color: ${TEXT_COLOR_MUTED};
    margin: 0;
  }
`;

const UsersList = styled.div`
  max-height: 500px;
  overflow-y: auto;
  padding: ${theme.spacing.md};
`;

const UserItem = styled.div<{ level: number }>`
  user-select: none;
  margin-left: ${(p) => Math.min(p.level * 32, 96)}px;
`;

const UserRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  padding: ${theme.spacing.md};
  border-radius: ${theme.borderRadius.md};
  transition: background-color ${theme.transitions.default};
  cursor: pointer;

  &:hover {
    background: ${theme.colors.backgroundSecondary};
  }
`;

const ChevronWrapper = styled.div`
  display: flex;
  align-items: center;
  width: 16px;
  flex-shrink: 0;
`;

const AvatarWrapper = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(0, 170, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${PRIMARY_COLOR};
  flex-shrink: 0;
`;

const UserDetails = styled.div`
  flex: 1;
  min-width: 0;
`;

const UserHeaderRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  flex-wrap: wrap;
`;

const UserName = styled.p`
  font-size: ${theme.typography.fontSizes.sm};
  font-weight: ${theme.typography.fontWeights.medium};
  color: ${TEXT_COLOR_DARK};
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Badge = styled.span<{ variant: 'admin' | 'finance_manager' | 'accountant' | 'employee' | 'active' | 'inactive' | 'default' }>`
  display: inline-flex;
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  font-size: ${theme.typography.fontSizes.xs};
  font-weight: ${theme.typography.fontWeights.bold};
  border-radius: 9999px;

  ${(p) => {
    switch (p.variant) {
      case 'admin':
        return 'background-color: #f3e8ff; color: #6b21a8;';
      case 'finance_manager':
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

const UserMeta = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  margin-top: ${theme.spacing.xs};
  flex-wrap: wrap;
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.xs};
  font-size: ${theme.typography.fontSizes.xs};
  color: ${TEXT_COLOR_MUTED};
`;

const UserActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  flex-shrink: 0;
`;

const ActionButton = styled.button`
  padding: ${theme.spacing.xs};
  background: none;
  border: none;
  cursor: pointer;
  color: ${TEXT_COLOR_MUTED};
  transition: color ${theme.transitions.default};
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: ${TEXT_COLOR_DARK};
  }

  &[data-destructive='true'] {
    color: #dc2626;

    &:hover {
      color: #b91c1c;
    }
  }
`;

const SubordinateCount = styled.span`
  font-size: ${theme.typography.fontSizes.xs};
  color: ${TEXT_COLOR_MUTED};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${theme.spacing.xxl};
  
  svg {
    margin: 0 auto ${theme.spacing.md};
    color: ${TEXT_COLOR_MUTED};
    opacity: 0.5;
  }

  p {
    color: ${TEXT_COLOR_MUTED};
    margin: 0;
    font-size: ${theme.typography.fontSizes.md};
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
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

const AccessDeniedContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  text-align: center;
`;

const SubordinateList = styled.div`
  margin-top: ${theme.spacing.xs};
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
`;

const ModalContent = styled.div`
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  padding: ${theme.spacing.xl};
  max-width: 500px;
  width: 90%;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
`;

const ModalTitle = styled.h3`
  font-size: ${theme.typography.fontSizes.lg};
  font-weight: ${theme.typography.fontWeights.bold};
  color: #111827;
  margin: 0 0 ${theme.spacing.md};
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
`;

const WarningBox = styled.div`
  padding: ${theme.spacing.md};
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: ${theme.borderRadius.md};
  margin-bottom: ${theme.spacing.lg};
  
  p {
    margin: 0;
    color: #dc2626;
    font-size: ${theme.typography.fontSizes.sm};
    line-height: 1.5;
  }
`;

const FormGroup = styled.div`
  margin-bottom: ${theme.spacing.md};
`;

const Label = styled.label`
  display: block;
  font-size: ${theme.typography.fontSizes.sm};
  font-weight: ${theme.typography.fontWeights.medium};
  color: #111827;
  margin-bottom: ${theme.spacing.xs};
`;

const PasswordInput = styled.input`
  width: 100%;
  padding: ${theme.spacing.md};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  background: ${theme.colors.background};
  color: #111827;
  font-size: ${theme.typography.fontSizes.sm};
  font-family: inherit;
  
  &:focus {
    outline: none;
    border-color: ${theme.colors.primary || '#00AA00'};
    box-shadow: 0 0 0 3px ${theme.colors.primary || '#00AA00'}15;
  }
`;

const ErrorText = styled.p`
  color: #dc2626;
  font-size: ${theme.typography.fontSizes.sm};
  margin: ${theme.spacing.xs} 0 0 0;
`;

const ModalActions = styled.div`
  display: flex;
  gap: ${theme.spacing.md};
  justify-content: flex-end;
  margin-top: ${theme.spacing.lg};
`;

export default function UsersPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, allUsers, fetchAllUsers } = useUserStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{ id: number; name: string } | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletePasswordError, setDeletePasswordError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !['admin', 'finance_manager'].includes(user?.role || ''))) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, user, router]);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchAllUsers();
    }
  }, [isAuthenticated, user]);

  const toggleUserExpansion = (userId: string) => {
    setExpandedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setUserToDelete(null);
    setDeletePassword('');
    setDeletePasswordError(null);
  };

  const handleDelete = async () => {
    if (!userToDelete || !deletePassword.trim()) {
      setDeletePasswordError('Password is required');
      return;
    }

    setDeleting(true);
    setDeletePasswordError(null);

    try {
      await apiClient.deleteUser(userToDelete.id, deletePassword.trim());
      toast.success('User deleted successfully');
      setShowDeleteModal(false);
      setUserToDelete(null);
      setDeletePassword('');
      fetchAllUsers();
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to delete user';
      setDeletePasswordError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  // Get direct subordinates of a user from a given user list
  const getSubordinates = (userId: string, usersList: any[]) => {
    const userIdStr = userId.toString();
    return usersList.filter((u: any) => {
      const managerId = u.managerId?.toString() || u.manager_id?.toString();
      return managerId === userIdStr;
    });
  };

  // Get all users in a finance_manager's hierarchy recursively (including themselves)
  const getAllTeamMembers = (managerId: string, users: any[] = allUsers): any[] => {
    const managerIdStr = managerId.toString();
    const teamMembers = new Set<string>();
    
    // Add the manager themselves
    const manager = users.find((u: any) => u.id?.toString() === managerIdStr || u.id === managerIdStr);
    if (manager) {
      teamMembers.add(manager.id?.toString() || manager.id.toString());
    }
    
    // Recursively add all subordinates
    const addSubordinatesRecursively = (parentId: string) => {
      const subordinates = users.filter((u: any) => {
        const mgrId = u.managerId?.toString() || u.manager_id?.toString();
        return mgrId === parentId.toString();
      });
      
      subordinates.forEach((sub: any) => {
        const subId = sub.id?.toString() || sub.id.toString();
        if (!teamMembers.has(subId)) {
          teamMembers.add(subId);
          addSubordinatesRecursively(subId);
        }
      });
    };
    
    addSubordinatesRecursively(managerIdStr);
    
    return users.filter((u: any) => {
      const userId = u.id?.toString() || u.id.toString();
      return teamMembers.has(userId);
    });
  };

  // Get accessible users based on role
  const getAccessibleUsers = (): any[] => {
    if (!user) return [];
    
    if (user.role === 'admin') {
      // Admin sees all users
      return allUsers;
    } else if (user.role === 'finance_manager') {
      // Finance manager sees only their team (themselves + all subordinates recursively)
      return getAllTeamMembers(user.id);
    }
    
    return [];
  };

  // Get users that match search/filter criteria from accessible users
  const accessibleUsers = getAccessibleUsers();
  
  const filteredUsers = accessibleUsers.filter((userItem: any) => {
    const userRole = (userItem.role || '').toLowerCase();
    const userName = userItem.full_name || userItem.name || userItem.email || '';
    const matchesSearch = userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (userItem.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || userRole === filterRole;
    const matchesStatus = filterStatus === 'all' || 
                          (filterStatus === 'active' && (userItem.is_active !== false)) ||
                          (filterStatus === 'inactive' && (userItem.is_active === false));
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadgeVariant = (role: string): 'admin' | 'finance_manager' | 'accountant' | 'employee' | 'default' => {
    switch (role) {
      case 'admin':
        return 'admin';
      case 'finance_manager':
        return 'finance_manager';
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
        return <Shield size={16} />;
      case 'finance_manager':
        return <Building size={16} />;
      case 'accountant':
        return <UserCheck size={16} />;
      case 'employee':
        return <Briefcase size={16} />;
      default:
        return <UserCheck size={16} />;
    }
  };

  const getRoleDisplayName = (role: string) => {
    const roleNames: Record<string, string> = {
      admin: 'Administrator',
      finance_manager: 'Finance Manager',
      accountant: 'Accountant',
      employee: 'Employee',
    };
    return roleNames[role] || role;
  };

  const renderUserHierarchy = (users: any[], level = 0) => {
    return users.map((userItem: any) => {
      const userRole = (userItem.role || '').toLowerCase();
      const userId = userItem.id?.toString() || userItem.id;
      // Get all subordinates from accessible users to maintain hierarchy structure
      // The filteredUsers are already applied at the root level, so we show all subordinates
      const subordinates = getSubordinates(userId, accessibleUsers);
      const isExpanded = expandedUsers.has(userId);
      
      return (
        <UserItem key={userId} level={level}>
          <UserRow onClick={() => subordinates.length > 0 && toggleUserExpansion(userId)}>
            <ChevronWrapper>
              {subordinates.length > 0 && (
                isExpanded ? <ChevronDown size={16} style={{ color: TEXT_COLOR_MUTED }} /> : <ChevronRight size={16} style={{ color: TEXT_COLOR_MUTED }} />
              )}
            </ChevronWrapper>
            
            <AvatarWrapper>
              {getRoleIcon(userRole)}
            </AvatarWrapper>
            
            <UserDetails>
              <UserHeaderRow>
                <UserName>
                  {userItem.full_name || userItem.name || userItem.email}
                </UserName>
                <Badge variant={getRoleBadgeVariant(userRole)}>
                  {getRoleDisplayName(userRole)}
                </Badge>
                <Badge variant={userItem.is_active !== false ? 'active' : 'inactive'}>
                  {userItem.is_active !== false ? 'Active' : 'Inactive'}
                </Badge>
              </UserHeaderRow>
              <UserMeta>
                <MetaItem>
                  <Mail size={12} />
                  {userItem.email}
                </MetaItem>
                {userItem.phone && (
                  <MetaItem>
                    <Phone size={12} />
                    {userItem.phone}
                  </MetaItem>
                )}
                {userItem.created_at && (
                  <MetaItem>
                    <Calendar size={12} />
                    Joined {formatDate(userItem.created_at)}
                  </MetaItem>
                )}
              </UserMeta>
            </UserDetails>
            
            <UserActions>
              {subordinates.length > 0 && (
                <SubordinateCount>
                  {subordinates.length} {subordinates.length === 1 ? 'subordinate' : 'subordinates'}
                </SubordinateCount>
              )}
              <ActionButton
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/users/${userItem.id}`);
                }}
                title="View details"
              >
                <Eye size={16} />
              </ActionButton>
              <ActionButton
                onClick={(e) => {
                  e.stopPropagation();
                  const role = userRole;
                  if (role === 'employee') {
                    router.push(`/employees/edit/${userItem.id}`);
                  } else if (role === 'accountant') {
                    router.push(`/accountants/edit/${userItem.id}`);
                  } else if (role === 'finance_manager' || role === 'manager' || role === 'finance_admin') {
                    router.push(`/finance/edit/${userItem.id}`);
                  } else {
                    router.push(`/users/${userItem.id}/edit`);
                  }
                }}
                title="Edit user"
              >
                <Edit size={16} />
              </ActionButton>
              {(userRole === 'admin' || (userRole === 'finance_manager' && user?.id !== userId)) && 
               userItem.role !== 'admin' && userItem.role !== 'super_admin' && (
                <ActionButton
                  onClick={(e) => {
                    e.stopPropagation();
                    const userName = userItem.full_name || userItem.name || userItem.email;
                    const userId = typeof userItem.id === 'string' ? parseInt(userItem.id) : userItem.id;
                    setUserToDelete({ id: userId, name: userName });
                    setShowDeleteModal(true);
                    setDeletePassword('');
                    setDeletePasswordError(null);
                  }}
                  data-destructive="true"
                  title="Delete user"
                >
                  <Trash2 size={16} />
                </ActionButton>
              )}
            </UserActions>
          </UserRow>
          
          {isExpanded && subordinates.length > 0 && (
            <SubordinateList>
              {renderUserHierarchy(subordinates, level + 1)}
            </SubordinateList>
          )}
        </UserItem>
      );
    });
  };

  if (isLoading || !isAuthenticated || !user) {
    return (
      <Layout>
        <LoadingContainer>
          <Spinner size={32} />
        </LoadingContainer>
      </Layout>
    );
  }

  if (!['admin', 'finance_manager'].includes(user.role)) {
    return (
      <Layout>
        <AccessDeniedContainer>
          <Shield size={48} style={{ color: TEXT_COLOR_MUTED, marginBottom: theme.spacing.md }} />
          <h1 style={{ fontSize: theme.typography.fontSizes.lg, fontWeight: theme.typography.fontWeights.bold, color: TEXT_COLOR_DARK, marginBottom: theme.spacing.sm }}>
            Access Denied
          </h1>
          <p style={{ color: TEXT_COLOR_MUTED }}>
            You don't have permission to access this page.
          </p>
        </AccessDeniedContainer>
      </Layout>
    );
  }

  // Calculate stats based on accessible users
  const totalUsers = accessibleUsers.length;
  const activeUsers = accessibleUsers.filter((u: any) => u.is_active !== false).length;
  const inactiveUsers = accessibleUsers.filter((u: any) => u.is_active === false).length;

  return (
    <Layout>
      <PageContainer>
        <HeaderCard>
          <HeaderContent>
            <HeaderText>
              <h1>User Management</h1>
              <p>Manage users and team hierarchy</p>
            </HeaderText>
            <Button onClick={() => router.push('/employees/create')}>
              <UserPlus size={16} style={{ marginRight: theme.spacing.sm }} />
              Add User
            </Button>
          </HeaderContent>
        </HeaderCard>

        <StatsGrid>
          <StatCard>
            <StatContent>
              <StatInfo>
                <p>Total Users</p>
                <p>{totalUsers}</p>
              </StatInfo>
              <StatIcon color="#2563eb">
                <Users size={16} />
              </StatIcon>
            </StatContent>
          </StatCard>

          <StatCard>
            <StatContent>
              <StatInfo>
                <p>Active Users</p>
                <p style={{ color: '#16a34a' }}>{activeUsers}</p>
              </StatInfo>
              <StatIcon color="#16a34a">
                <UserCheck size={16} />
              </StatIcon>
            </StatContent>
          </StatCard>

          <StatCard>
            <StatContent>
              <StatInfo>
                <p>Inactive Users</p>
                <p style={{ color: '#dc2626' }}>{inactiveUsers}</p>
              </StatInfo>
              <StatIcon color="#dc2626">
                <Shield size={16} />
              </StatIcon>
            </StatContent>
          </StatCard>

          <StatCard>
            <StatContent>
              <StatInfo>
                <p>Team Size</p>
                <p>{user.role === 'admin' ? 'All' : (accessibleUsers.length - 1)}</p>
              </StatInfo>
              <StatIcon color="#9333ea">
                <Building size={16} />
              </StatIcon>
            </StatContent>
          </StatCard>
        </StatsGrid>

        <FiltersContainer>
          <SearchWrapper>
            <Search size={16} />
            <SearchInput
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </SearchWrapper>
          <Select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="admin">Administrator</option>
            <option value="finance_manager">Finance Manager</option>
            <option value="accountant">Accountant</option>
            <option value="employee">Employee</option>
          </Select>
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </FiltersContainer>

        <UsersCard>
          <CardHeader>
            <h2>{user.role === 'admin' ? 'All Users' : 'Your Team'}</h2>
            <p>
              {user.role === 'admin' 
                ? 'View and manage all users in the system'
                : 'View users in your team hierarchy'
              }
            </p>
          </CardHeader>
          
          <UsersList>
            {filteredUsers.length > 0 ? (
              <>
                {renderUserHierarchy(
                  user.role === 'admin' 
                    ? filteredUsers.filter((u: any) => {
                        // For admin: show top-level users (no manager) at root
                        const managerId = u.managerId?.toString() || u.manager_id?.toString();
                        return !managerId;
                      })
                    : (() => {
                        // For finance_manager: always show themselves at root, regardless of filters
                        // This ensures they can always see and manage their team
                        const currentUserId = user.id?.toString() || user.id.toString();
                        const self = accessibleUsers.find((u: any) => {
                          const userId = u.id?.toString() || u.id?.toString();
                          return userId === currentUserId;
                        });
                        return self ? [self] : [];
                      })()
                )}
              </>
            ) : (
              <EmptyState>
                <Users size={48} />
                <p>No users found</p>
              </EmptyState>
            )}
          </UsersList>
        </UsersCard>
      </PageContainer>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && userToDelete && (
        <ModalOverlay onClick={handleDeleteCancel}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>
              <AlertCircle size={20} style={{ color: '#dc2626' }} />
              Delete User
            </ModalTitle>

            <WarningBox>
              <p>
                <strong>Warning:</strong> This action cannot be undone. All data associated with this user will be permanently deleted.
              </p>
            </WarningBox>

            <FormGroup>
              <Label htmlFor="delete-password">
                Enter <strong>your own password</strong> to confirm deletion of <strong>{userToDelete.name}</strong>:
              </Label>
              <PasswordInput
                id="delete-password"
                type="password"
                value={deletePassword}
                onChange={(e) => {
                  setDeletePassword(e.target.value);
                  setDeletePasswordError(null);
                }}
                placeholder="Enter your password"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && deletePassword.trim()) {
                    handleDelete();
                  }
                }}
              />
              {deletePasswordError && (
                <ErrorText>{deletePasswordError}</ErrorText>
              )}
            </FormGroup>

            <ModalActions>
              <Button
                variant="outline"
                onClick={handleDeleteCancel}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={!deletePassword.trim() || deleting}
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
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}
    </Layout>
  );
}
