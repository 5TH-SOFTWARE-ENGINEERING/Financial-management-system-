'use client';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { theme } from '@/components/common/theme';
import { useRouter } from 'next/navigation';
import { Resource, Action, UserType } from '@/lib/rbac/models';
import { PermissionGate } from '@/lib/rbac/permission-gate';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from '@/components/common/Table';
import { Search, Filter, Save, Check, User } from 'lucide-react';
import apiClient from '@/lib/api';
import { useUserStore } from '@/store/userStore';
import { toast } from 'sonner';

// Styled components
const Container = styled.div`
  padding: 24px;
`;

const Title = styled.h1`
  font-size: 24px;
  margin-bottom: 24px;
  color: #333;
`;

const Card = styled.div`
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.md};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 24px;
  margin-bottom: 24px;
`;

const SearchInput = styled.input`
  width: 100%;
  max-width: 400px;
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  margin-bottom: 24px;
  font-size: ${theme.typography.fontSizes.sm};
`;

const FilterContainer = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  align-items: center;
`;

const Select = styled.select`
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.typography.fontSizes.sm};
  background-color: white;
`;

const FilterLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: ${theme.typography.fontSizes.sm};
  color: ${theme.colors.textSecondary};
  
  svg {
    color: ${theme.colors.primary};
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 24px;
  justify-content: flex-end;
`;

const RoleChip = styled.div`
  background-color: ${theme.colors.primary}15;
  color: ${theme.colors.primary};
  font-size: ${theme.typography.fontSizes.xs};
  padding: 4px 8px;
  border-radius: ${theme.borderRadius.sm};
  display: inline-block;
  margin-right: 4px;
  margin-bottom: 4px;
`;

const Message = styled.div`
  padding: 16px;
  background-color: ${theme.colors.background};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  margin-bottom: 24px;
  color: ${theme.colors.textSecondary};
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
  const { allUsers, fetchAllUsers } = useUserStore();
  
  // Load users from API
  useEffect(() => {
    loadUsers();
  }, []);
  
  const loadUsers = async () => {
    try {
      setLoading(true);
      await fetchAllUsers();
      
      const response = await apiClient.getUsers();
      const userList = (response.data || []).map((user: any) => ({
        id: user.id.toString(),
        name: user.full_name || user.username || user.email,
        email: user.email,
        userType: mapRoleToUserType(user.role),
        role: user.role || 'employee'
      }));
      
      setUsers(userList);
    } catch (err: any) {
      toast.error('Failed to load users');
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };
  
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

  return (
    <Container>
      <Title>User Role Assignment</Title>
      
      <PermissionGate 
        resource={Resource.SETTINGS} 
        action={Action.UPDATE}
        fallback={
          <Message>
            You do not have permission to access the user role assignment settings.
          </Message>
        }
      >
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
      </PermissionGate>
    </Container>
  );
};

export default UserRolesPage; 