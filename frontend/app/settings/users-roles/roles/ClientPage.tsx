'use client';

import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { theme } from '@/components/common/theme';
import { Resource, Action } from '@/lib/rbac/models';
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
import { useRouter } from 'next/navigation';
import apiClient, { type ApiRole } from '@/lib/api';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Copy,
  Loader2
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const Message = styled.div`
  padding: 16px;
  background-color: ${theme.colors.background};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  margin-bottom: 24px;
  color: ${theme.colors.textSecondary};
`;

const ErrorText = styled.p`
  color: #dc2626;
  font-size: ${theme.typography.fontSizes.sm};
  margin-top: 8px;
`;

const HelperText = styled.p`
  font-size: ${theme.typography.fontSizes.sm};
  color: ${theme.colors.textSecondary};
  margin-top: 6px;
`;

interface Role {
  id: number;
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'duplicate'>('create');
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formValues, setFormValues] = useState({
    name: '',
    description: '',
    permissionsText: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState<number | null>(null);

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
          id: Number(role.id ?? Date.now()),
          name: role.name,
          description: role.description || `Users with ${role.name} role`,
          permissions,
          userCount: role.user_count ?? (role as any).userCount ?? 0,
          permissionCount: role.permission_count ?? (role as any).permissionCount ?? permissions.length,
          createdAt: role.created_at ?? (role as any).createdAt,
        };
      });
      setRoles(transformedRoles);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load roles');
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };
  
  const formatRoleName = (value: string) =>
    value
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());

  const resetForm = () => {
    setFormValues({
      name: '',
      description: '',
      permissionsText: '',
    });
    setFormError(null);
    setEditingRole(null);
  };

  const handleModalStateChange = (open: boolean) => {
    setIsModalOpen(open);
    if (!open) {
      resetForm();
      setIsSubmitting(false);
    }
  };

  const parsePermissionsFromInput = () => {
    return Array.from(
      new Set(
        formValues.permissionsText
          .split(/[\n,]+/)
          .map((perm) => perm.trim())
          .filter(Boolean)
      )
    );
  };

  const openCreateModal = () => {
    setModalMode('create');
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (role: Role) => {
    setModalMode('edit');
    setEditingRole(role);
    setFormValues({
      name: role.name,
      description: role.description || '',
      permissionsText: role.permissions.join('\n'),
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openDuplicateModal = (role: Role) => {
    setModalMode('duplicate');
    setEditingRole(null);
    setFormValues({
      name: `${role.name}_copy`,
      description: role.description || '',
      permissionsText: role.permissions.join('\n'),
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const trimmedName = formValues.name.trim();
    if (!trimmedName) {
      setFormError('Role name is required.');
      return;
    }

    setIsSubmitting(true);
    const payload = {
      name: trimmedName,
      description: formValues.description.trim() || undefined,
      permissions: parsePermissionsFromInput(),
    };

    try {
      if (modalMode === 'edit' && editingRole) {
        await apiClient.updateRole(editingRole.id, payload);
        toast.success('Role updated successfully');
      } else {
        await apiClient.createRole(payload);
        toast.success(modalMode === 'duplicate' ? 'Role duplicated successfully' : 'Role created successfully');
      }
      handleModalStateChange(false);
      await loadRoles();
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.message || 'Unable to save role';
      setFormError(detail);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRole = async (role: Role) => {
    if (!confirm(`Delete role "${formatRoleName(role.name)}"? This action cannot be undone.`)) {
      return;
    }
    setDeleteLoadingId(role.id);
    try {
      await apiClient.deleteRole(role.id);
      setRoles((prev) => prev.filter((item) => item.id !== role.id));
      toast.success('Role deleted successfully');
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.message || 'Failed to delete role';
      toast.error(detail);
    } finally {
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
      <div style={{ padding: '48px', textAlign: 'center' }}>
        <p>Loading roles...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: 'red' }}>
        <p>Error: {error}</p>
        <Button onClick={loadRoles} style={{ marginTop: '16px' }}>Retry</Button>
      </div>
    );
  }

  const navigateToUserRoles = () => {
    router.push('/settings/users-roles/user-roles');
  };

  return (
    <Container>
      <Title>Role Management</Title>
      
      <PermissionGate 
        resource={Resource.SETTINGS} 
        action={Action.UPDATE}
        fallback={
          <Message>
            You do not have permission to access the role management settings.
          </Message>
        }
      >
        <Card>
          <ButtonGroup>
            <Button 
              onClick={openCreateModal}
            >
              <Plus size={16} className="mr-2" />
              Create New Role
            </Button>
            <Button onClick={navigateToUserRoles}>
              Assign User Roles
            </Button>
          </ButtonGroup>
          
          <SearchInput 
            placeholder="Search roles..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRoles.map(role => (
                <TableRow key={role.id}>
                  <TableCell>{formatRoleName(role.name)}</TableCell>
                  <TableCell>{role.description}</TableCell>
                  <TableCell>{role.userCount}</TableCell>
                  <TableCell>{role.permissionCount}</TableCell>
                  <TableCell>{role.createdAt}</TableCell>
                  <TableCell>
                    <ActionButtons>
                      <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={() => openEditModal(role)}
                      >
                        <Edit size={14} className="mr-1" />
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={() => openDuplicateModal(role)}
                      >
                        <Copy size={14} className="mr-1" />
                        Duplicate
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleDeleteRole(role)}
                        disabled={deleteLoadingId === role.id}
                      >
                        {deleteLoadingId === role.id ? (
                          <>
                            <Loader2 size={14} className="mr-1 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 size={14} className="mr-1" />
                            Delete
                          </>
                        )}
                      </Button>
                    </ActionButtons>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </PermissionGate>
    </Container>
  );
};

export default RolesPage; 