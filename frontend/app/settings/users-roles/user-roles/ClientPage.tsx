'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useRouter } from 'next/navigation';
import { UserType } from '@/lib/rbac/models';
import { useAuth } from '@/lib/rbac/auth-context';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@/components/common/Table';
import apiClient from '@/lib/api';
import { useUserStore } from '@/store/userStore';
import { toast } from 'sonner';
import { Filter } from 'lucide-react';

// Styled components
const Container = styled.div`
  padding: 24px;
`;

const Title = styled.h1`
  font-size: 24px;
  margin-bottom: 24px;
  color: ${props => props.theme.colors.text};
`;

const Card = styled.div`
  background: ${props => props.theme.colors.card};
  border-radius: ${props => props.theme.borderRadius.md};
  box-shadow: ${props => props.theme.shadows.sm};
  border: 1px solid ${props => props.theme.colors.border};
  padding: 24px;
  margin-bottom: 24px;
`;

const SearchInput = styled.input`
  width: 100%;
  max-width: 400px;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  margin-bottom: 24px;
  font-size: ${props => props.theme.typography.fontSizes.sm};
  background-color: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.text};
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
  }
`;

const FilterContainer = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  align-items: center;
`;

const Select = styled.select`
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: ${props => props.theme.typography.fontSizes.sm};
  background-color: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.text};
`;

const FilterLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: ${props => props.theme.typography.fontSizes.sm};
  color: ${props => props.theme.colors.mutedForeground};
  
  svg {
    color: ${props => props.theme.colors.primary};
  }
`;

const RoleChip = styled.div`
  background-color: ${props => `color-mix(in srgb, ${props.theme.colors.primary}, transparent 90%)`};
  color: ${props => props.theme.colors.primary};
  font-size: ${props => props.theme.typography.fontSizes.xs};
  padding: 4px 8px;
  border-radius: ${props => props.theme.borderRadius.sm};
  display: inline-block;
  margin-right: 4px;
  margin-bottom: 4px;
`;

const Message = styled.div`
  padding: 16px;
  background-color: ${props => props.theme.colors.background};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  margin-bottom: 24px;
  color: ${props => props.theme.colors.mutedForeground};
`;

// Data interfaces
interface UserData {
  id: string;
  name: string;
  email: string;
  userType: UserType;
  role: string;
}

const roleMap: Record<string, UserType> = {
  'admin': UserType.ADMIN,
  'super_admin': UserType.ADMIN,
  'manager': UserType.FINANCE_ADMIN,
  'finance_manager': UserType.FINANCE_ADMIN,
  'accountant': UserType.ACCOUNTANT,
  'employee': UserType.EMPLOYEE,
};

const mapRoleToUserType = (role?: string): UserType => {
  if (!role) return UserType.EMPLOYEE;
  return roleMap[role.toLowerCase()] || UserType.EMPLOYEE;
};

const UserRolesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState<string>('all');
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { fetchAllUsers } = useUserStore();

  // Load users from API
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      await fetchAllUsers();

      const response = await apiClient.getUsers();
      const userList = (response.data || []).map((user: unknown) => {
        const u = user as Record<string, unknown>;
        const id = u.id !== undefined ? String(u.id) : 'unknown';
        const name = (u.full_name as string) || (u.username as string) || (u.email as string) || 'Unknown';
        const email = (u.email as string) || 'N/A';
        const role = (u.role as string) || 'employee';
        return {
          id,
          name,
          email,
          userType: mapRoleToUserType(role),
          role,
        };
      });

      setUsers(userList);
    } catch (err: unknown) {
      toast.error('Failed to load users');
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchAllUsers]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Filter users by search term and user type
  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = userTypeFilter === 'all' || user.userType === userTypeFilter;

    return matchesSearch && matchesType;
  });

  const handleAssignRoles = (userId: string) => {
    // Navigate to permissions page for this user
    router.push(`/permissions?userId=${userId}`);
  };

  const getRoleDisplayName = (role: string): string => {
    const roleNames: Record<string, string> = {
      'admin': 'Admin',
      'super_admin': 'Super Admin',
      'manager': 'Finance Manager',
      'finance_manager': 'Finance Manager',
      'accountant': 'Accountant',
      'employee': 'Employee'
    };
    return roleNames[role.toLowerCase()] || role;
  };

  const navigateToRoles = () => {
    router.push('/settings/users-roles/roles');
  };

  const { user } = useAuth();
  const isAdmin = user?.userType === UserType.ADMIN || user?.role === 'admin' || user?.role === 'super_admin';

  return (
    <Container>
      <Title>User Role Assignment</Title>

      {!isAdmin ? (
        <Message>
          You do not have permission to access the user role assignment settings.
        </Message>
      ) : (
        <Card>
          <Button onClick={navigateToRoles} style={{ marginBottom: '16px' }}>
            Manage Roles
          </Button>

          <FilterContainer>
            <SearchInput
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <FilterLabel>
              <Filter size={16} />
              <Select
                value={userTypeFilter}
                onChange={(e) => setUserTypeFilter(e.target.value)}
              >
                <option value="all">All User Types</option>
                {Object.values(UserType).map(type => (
                  <option key={type} value={type}>
                    {type.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())}
                  </option>
                ))}
              </Select>
            </FilterLabel>
          </FilterContainer>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>User Type</TableHead>
                <TableHead>Assigned Roles</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} style={{ textAlign: 'center', padding: '40px' }}>
                    Loading users...
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} style={{ textAlign: 'center', padding: '40px' }}>
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map(user => (
                  <TableRow key={user.id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.userType}</TableCell>
                    <TableCell>
                      <RoleChip>{getRoleDisplayName(user.role)}</RoleChip>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleAssignRoles(user.id)}
                      >
                        Manage Permissions
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}
    </Container>
  );
};

export default UserRolesPage; 