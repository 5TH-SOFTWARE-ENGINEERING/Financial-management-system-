'use client';

import React, { useState, useEffect } from 'react';
import styled, { css } from 'styled-components';
import { theme } from '@/components/common/theme';
import { Resource, Action } from '@/lib/rbac/models';
import { PermissionGate } from '@/lib/rbac/permission-gate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@/components/common/Table';
import { RoleDeleteModal } from './RoleDeleteModal';
import { useRouter } from 'next/navigation';
import apiClient, { type ApiRole } from '@/lib/api';
import {
  Trash2,
  Loader2,
  Search,
  Shield,
  Users,
  Lock,
  Plus,
  ChevronRight,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

// --- Styled Components (Premium Theme) ---

const glassBackground = css`
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.3);
`;

const Container = styled.div`
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  min-height: 100vh;
  background: radial-gradient(circle at top right, rgba(var(--primary-rgb), 0.05), transparent),
              radial-gradient(circle at bottom left, rgba(var(--secondary-rgb), 0.05), transparent);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2.5rem;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1.5rem;
  }
`;

const TitleSection = styled.div`
  h1 {
    font-size: 2.25rem;
    font-weight: 800;
    color: #1a1a1a;
    margin-bottom: 0.5rem;
    letter-spacing: -0.025em;
  }
  
  p {
    color: #666;
    font-size: 1rem;
  }
`;

const StyledCard = styled.div`
  ${glassBackground}
  border-radius: 1.25rem;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 20px 35px -5px rgba(0, 0, 0, 0.1);
  }
`;

const Toolbar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  gap: 1rem;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const SearchWrapper = styled.div`
  position: relative;
  flex: 1;
  max-width: 400px;

  svg {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: #94a3b8;
    pointer-events: none;
  }

  input {
    padding-left: 2.75rem;
    background: rgba(248, 250, 252, 0.8);
    border-color: rgba(226, 232, 240, 0.8);
    height: 2.75rem;
    font-size: 0.95rem;

    &:focus {
      background: #fff;
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
    }
  }
`;

const Badge = styled.span<{ variant?: 'primary' | 'secondary' }>`
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: ${props => props.variant === 'primary' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(148, 163, 184, 0.1)'};
  color: ${props => props.variant === 'primary' ? '#2563eb' : '#475569'};
`;

const ActionButton = styled(Button)`
  border-radius: 0.75rem;
  font-weight: 600;
  transition: all 0.2s ease;
  
  &:active {
    transform: scale(0.98);
  }
`;

const Message = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: #fef2f2;
  border: 1px solid #fee2e2;
  border-radius: 0.75rem;
  color: #991b1b;
  margin-bottom: 2rem;
  font-weight: 500;
`;

// --- Interface ---

interface Role {
  id: string | number;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
  permissionCount: number;
  createdAt?: string;
}

const RolesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roles, setRoles] = useState<Role[]>([]);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | number | null>(null);

  // Deletion Modal State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Load roles from API
  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.getRoles();
      const transformedRoles: Role[] = (response.data || []).map((role: ApiRole) => {
        const permissions = role.permissions || [];
        return {
          id: role.id ?? String(Date.now()),
          name: role.name,
          description: role.description || `Users with ${role.name} role`,
          permissions,
          userCount: role.user_count ?? permissions.length,
          permissionCount: role.permission_count ?? permissions.length,
          createdAt: role.created_at ? new Date(role.created_at).toLocaleDateString() : 'N/A',
        };
      });
      setRoles(transformedRoles);
    } catch (err: unknown) {
      const detail =
        typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : err instanceof Error
            ? err.message
            : null;
      setError(detail || 'Failed to load roles');
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  const formatRoleName = (value: string) =>
    value
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());

  const openDeleteDialog = (role: Role) => {
    setRoleToDelete(role);
    setConfirmPassword('');
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async (password: string) => {
    if (!roleToDelete) return;

    setIsVerifying(true);
    setDeleteLoadingId(roleToDelete.id);
    try {
      await apiClient.deleteRole(roleToDelete.id, password);
      setRoles((prev) => prev.filter((item) => item.id !== roleToDelete.id));
      toast.success(`Role "${formatRoleName(roleToDelete.name)}" deleted successfully`);
      setIsDeleteDialogOpen(false);
    } catch (err: unknown) {
      const detail =
        typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : err instanceof Error
            ? err.message
            : 'Failed to delete role';
      toast.error(detail);
      throw err; // Re-throw to let the modal handle the error display
    } finally {
      setIsVerifying(false);
      setDeleteLoadingId(null);
    }
  };

  // Filter roles by search term
  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Container>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 className="animate-spin text-primary" size={48} />
          <p className="text-muted-foreground font-medium">Fetching architectural roles...</p>
        </div>
      </Container>
    );
  }

  const navigateToUserRoles = () => {
    router.push('/settings/users-roles/user-roles');
  };

  return (
    <Container>
      <Header>
        <TitleSection>
          <h1>Role Management</h1>
          <p>Define and manage system roles and user permissions</p>
        </TitleSection>

        <PermissionGate resource={Resource.ROLES} action={Action.UPDATE}>
          <ActionButton onClick={navigateToUserRoles} size="lg">
            <Plus className="mr-2" size={18} />
            Assign User Roles
          </ActionButton>
        </PermissionGate>
      </Header>

      <PermissionGate
        resource={Resource.ROLES}
        action={Action.READ}
        fallback={
          <Message>
            <Info size={20} />
            You do not have permission to access the role management settings.
          </Message>
        }
      >
        {error && (
          <div className="mb-8 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield size={20} />
              <p className="font-medium">{error}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={loadRoles} className="hover:bg-destructive/20">
              Retry Load
            </Button>
          </div>
        )}

        <StyledCard>
          <Toolbar>
            <SearchWrapper>
              <Search size={18} />
              <Input
                placeholder="Search roles by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </SearchWrapper>

            <div className="text-sm text-muted-foreground font-medium">
              Showing {filteredRoles.length} roles found
            </div>
          </Toolbar>

          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="font-bold py-4">Role Name</TableHead>
                <TableHead className="font-bold">Description</TableHead>
                <TableHead className="font-bold">Users</TableHead>
                <TableHead className="font-bold text-center">Permissions</TableHead>
                <TableHead className="font-bold">Created</TableHead>
                <TableHead className="font-bold text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRoles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    No roles found matching your criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRoles.map(role => (
                  <TableRow key={role.id} className="hover:bg-slate-50/30 transition-colors">
                    <TableCell className="font-semibold text-slate-900 border-l-4 border-l-transparent hover:border-l-primary py-4">
                      <div className="flex items-center gap-2">
                        <Lock size={14} className="text-slate-400" />
                        {formatRoleName(role.name)}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600 italic">
                      {role.description}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 font-medium">
                        <Users size={14} className="text-slate-500" />
                        {role.userCount}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="primary">{role.permissionCount} Perms</Badge>
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">
                      {role.createdAt}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <ActionButton
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => openDeleteDialog(role)}
                        disabled={deleteLoadingId === role.id}
                      >
                        {deleteLoadingId === role.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </ActionButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </StyledCard>
      </PermissionGate>

      <RoleDeleteModal
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        role={roleToDelete}
        isDeleting={isVerifying}
      />
    </Container>
  );
};

export default RolesPage;
