'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { theme } from '@/components/common/theme';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Save, Filter, Copy, Check, Loader2 } from 'lucide-react';
import { Resource, Action, UserType } from '@/lib/rbac/models';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@/components/ui/table';
import apiClient from '@/lib/api';
import { useAuth } from '@/lib/rbac/auth-context';

// Styled components
const PRIMARY_COLOR = theme.colors.primary || '#00AA00';
const TEXT_COLOR_DARK = '#111827';
const TEXT_COLOR_MUTED = theme.colors.textSecondary || '#6b7280';
const BACKGROUND_GRADIENT = `linear-gradient(180deg, #f9fafb 0%, #f3f4f6 60%, ${theme.colors.background} 100%)`;

const Container = styled.div`
  min-height: 100vh;
  background: ${BACKGROUND_GRADIENT};
  padding: ${theme.spacing.lg};
`;

const HeaderContainer = styled.div`
  background: linear-gradient(135deg, ${PRIMARY_COLOR} 0%, #008800 100%);
  color: #ffffff;
  padding: ${theme.spacing.xl};
  margin: -${theme.spacing.lg} -${theme.spacing.lg} ${theme.spacing.xl};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-bottom: 3px solid rgba(255, 255, 255, 0.1);
`;

const Title = styled.h1`
  font-size: clamp(28px, 3.5vw, 36px);
  font-weight: ${theme.typography.fontWeights.bold};
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
`;

const Subtitle = styled.h2`
  font-size: ${theme.typography.fontSizes.lg};
  font-weight: ${theme.typography.fontWeights.bold};
  margin-bottom: ${theme.spacing.md};
  margin-top: ${theme.spacing.xl};
  color: ${TEXT_COLOR_DARK};
`;

const Card = styled.div`
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.md};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: ${theme.spacing.xl};
  margin-bottom: ${theme.spacing.xl};
  border: 1px solid ${theme.colors.border};
  transition: box-shadow 0.2s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  }
`;

const SearchInput = styled.input`
  width: 100%;
  max-width: 400px;
  padding: ${theme.spacing.md};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.typography.fontSizes.sm};
  transition: all 0.2s ease;
  background: ${theme.colors.background};

  &:focus {
    outline: none;
    border-color: ${PRIMARY_COLOR};
    box-shadow: 0 0 0 3px ${PRIMARY_COLOR}15;
  }

  &::placeholder {
    color: ${TEXT_COLOR_MUTED};
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${theme.spacing.md};
  margin-top: ${theme.spacing.xl};
  justify-content: space-between;
  align-items: center;
  width: 100%;
  flex-wrap: wrap;
`;

const ConfirmOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${theme.spacing.lg};
  z-index: 50;
`;

const ConfirmDialog = styled.div`
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.lg};
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  padding: ${theme.spacing.xl};
  max-width: 720px;
  width: 100%;
  border: 1px solid ${theme.colors.border};
`;

const ConfirmTitle = styled.h3`
  margin: 0 0 ${theme.spacing.md};
  font-size: ${theme.typography.fontSizes.lg};
  font-weight: ${theme.typography.fontWeights.bold};
  color: ${TEXT_COLOR_DARK};
`;

const ConfirmBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
  max-height: 60vh;
  overflow-y: auto;
`;

const ConfirmFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${theme.spacing.md};
  margin-top: ${theme.spacing.lg};
  flex-wrap: wrap;
`;

const PermissionChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${theme.spacing.xs};
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.sm};
  background: ${PRIMARY_COLOR}10;
  color: ${TEXT_COLOR_DARK};
  font-size: ${theme.typography.fontSizes.xs};
  border: 1px solid ${PRIMARY_COLOR}30;
`;

const SelectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing.md};
  flex-wrap: wrap;
  gap: ${theme.spacing.md};
`;

const FilterContainer = styled.div`
  display: flex;
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.xl};
  align-items: center;
  flex-wrap: wrap;
  background: ${theme.colors.background};
  padding: ${theme.spacing.lg};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
`;

const Select = styled.select`
  padding: ${theme.spacing.md};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.typography.fontSizes.sm};
  background-color: ${theme.colors.background};
  color: ${TEXT_COLOR_DARK};
  cursor: pointer;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${PRIMARY_COLOR};
    box-shadow: 0 0 0 3px ${PRIMARY_COLOR}15;
  }
`;

const FilterLabel = styled.label`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  font-size: ${theme.typography.fontSizes.sm};
  font-weight: ${theme.typography.fontWeights.medium};
  color: ${TEXT_COLOR_DARK};
  
  svg {
    color: ${PRIMARY_COLOR};
  }
`;

const TemplateContainer = styled.div`
  margin-top: ${theme.spacing.xl};
  margin-bottom: ${theme.spacing.xl};
  padding: ${theme.spacing.lg};
  background: ${PRIMARY_COLOR}05;
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${PRIMARY_COLOR}20;
`;

const TemplateControls = styled.div`
  display: flex;
  gap: ${theme.spacing.md};
  margin-top: ${theme.spacing.md};
  flex-wrap: wrap;
  align-items: center;
`;

const TemplateName = styled.input`
  padding: ${theme.spacing.md};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.typography.fontSizes.sm};
  min-width: 250px;
  background: ${theme.colors.background};
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${PRIMARY_COLOR};
    box-shadow: 0 0 0 3px ${PRIMARY_COLOR}15;
  }
`;

const TemplateSelect = styled.select`
  padding: ${theme.spacing.md};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.typography.fontSizes.sm};
  min-width: 250px;
  background: ${theme.colors.background};
  cursor: pointer;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${PRIMARY_COLOR};
    box-shadow: 0 0 0 3px ${PRIMARY_COLOR}15;
  }
`;

const SuccessMessage = styled.div`
  color: #059669;
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  font-size: ${theme.typography.fontSizes.sm};
  margin-top: ${theme.spacing.md};
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  background: #d1fae5;
  border-radius: ${theme.borderRadius.sm};
  border: 1px solid #6ee7b7;
`;

const ErrorMessage = styled.div`
  color: #dc2626;
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  font-size: ${theme.typography.fontSizes.sm};
  padding: ${theme.spacing.md};
  background: #fee2e2;
  border-radius: ${theme.borderRadius.md};
  border: 1px solid #fecaca;
  margin-bottom: ${theme.spacing.lg};
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: ${theme.spacing.md};
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid ${theme.colors.border};
  border-top-color: ${PRIMARY_COLOR};
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const StatusBadge = styled.span<{ $active: boolean }>`
  display: inline-block;
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.sm};
  font-size: ${theme.typography.fontSizes.xs};
  font-weight: ${theme.typography.fontWeights.medium};
  background: ${props => props.$active ? '#d1fae5' : '#fecaca'};
  color: ${props => props.$active ? '#065f46' : '#991b1b'};
`;

const UserTypeBadge = styled.span`
  display: inline-block;
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.sm};
  font-size: ${theme.typography.fontSizes.xs};
  font-weight: ${theme.typography.fontWeights.medium};
  background: #dbeafe;
  color: #1e40af;
  text-transform: capitalize;
`;

const TableWrapper = styled.div`
  overflow-x: auto;
  margin-top: ${theme.spacing.lg};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${theme.spacing.xl} * 2;
  color: ${TEXT_COLOR_MUTED};
  
  p {
    font-size: ${theme.typography.fontSizes.md};
    margin-top: ${theme.spacing.md};
  }
`;

// Interfaces
interface PermissionItem {
  resource: Resource;
  actions: {
    [key in Action]?: boolean;
  };
}

interface UserPermissions {
  userId: string;
  userName: string;
  email: string;
  userType: UserType;
  permissions: PermissionItem[];
  isActive: boolean;
}

interface PermissionManagerProps {
  title: string;
  managedUserTypes: UserType[];
  adminType?: UserType;
}

interface RoleTemplate {
  id: string;
  name: string;
  userType: UserType;
  permissions: PermissionItem[];
}

type ApiUserLite = {
  id: string | number;
  full_name?: string;
  username?: string;
  email?: string;
  role?: string;
  is_active?: boolean;
};

type PermissionResponse = {
  permissions?: unknown;
};

// Ensure permissions are unique per resource and merged
const mergePermissionsByResource = (perms: PermissionItem[]): PermissionItem[] => {
  const merged = new Map<Resource, PermissionItem>();
  perms.forEach((perm) => {
    const existing = merged.get(perm.resource);
    if (existing) {
      merged.set(perm.resource, {
        resource: perm.resource,
        actions: {
          ...existing.actions,
          ...perm.actions,
        },
      });
    } else {
      merged.set(perm.resource, {
        resource: perm.resource,
        actions: { ...perm.actions },
      });
    }
  });
  return Array.from(merged.values());
};

const PermissionManager: React.FC<PermissionManagerProps> = ({
  title,
  managedUserTypes
}) => {
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [userPermissions, setUserPermissions] = useState<UserPermissions[]>([]);
  const [userTypeFilter, setUserTypeFilter] = useState<string>('all');
  const [templates, setTemplates] = useState<RoleTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [newTemplateName, setNewTemplateName] = useState<string>('');
  const [showSavedMessage, setShowSavedMessage] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const messageTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmUser, setConfirmUser] = useState<UserPermissions | null>(null);

  // Map backend role to frontend UserType
  const mapRoleToUserType = (role?: string): UserType => {
    const normalized = role?.toLowerCase() ?? '';
    if (normalized === 'admin') return UserType.ADMIN;
    if (normalized === 'manager' || normalized === 'finance_manager') return UserType.FINANCE_ADMIN;
    if (normalized === 'accountant') return UserType.ACCOUNTANT;
    return UserType.EMPLOYEE;
  };

  // Get default permissions based on user type
  const getDefaultPermissions = (userType: UserType): PermissionItem[] => {
    const defaultPerms: PermissionItem[] = [];

    // All users can view their profile
    defaultPerms.push({
      resource: Resource.PROFILE,
      actions: {
        [Action.READ]: true,
        [Action.UPDATE]: true,
      }
    });

    // Role-specific defaults
    switch (userType) {
      case UserType.ADMIN:
        // Admin gets all permissions
        Object.values(Resource).forEach(resource => {
          defaultPerms.push({
            resource,
            actions: {
              [Action.READ]: true,
              [Action.CREATE]: true,
              [Action.UPDATE]: true,
              [Action.DELETE]: true,
              [Action.MANAGE]: true,
            }
          });
        });
        break;
      case UserType.FINANCE_ADMIN:
        // Finance Manager gets financial and user management
        [Resource.USERS, Resource.REVENUES, Resource.EXPENSES, Resource.TRANSACTIONS, Resource.REPORTS].forEach(resource => {
          defaultPerms.push({
            resource,
            actions: {
              [Action.READ]: true,
              [Action.CREATE]: true,
              [Action.UPDATE]: true,
              [Action.DELETE]: false,
              [Action.MANAGE]: true,
            }
          });
        });
        break;
      case UserType.ACCOUNTANT:
        // Accountant gets read/write on financial data
        [Resource.REVENUES, Resource.EXPENSES, Resource.TRANSACTIONS, Resource.REPORTS].forEach(resource => {
          defaultPerms.push({
            resource,
            actions: {
              [Action.READ]: true,
              [Action.CREATE]: true,
              [Action.UPDATE]: true,
              [Action.DELETE]: false,
            }
          });
        });
        break;
      case UserType.EMPLOYEE:
        // Employee gets limited permissions
        [Resource.REVENUES, Resource.EXPENSES].forEach(resource => {
          defaultPerms.push({
            resource,
            actions: {
              [Action.READ]: true,
              [Action.CREATE]: true,
              [Action.UPDATE]: false,
              [Action.DELETE]: false,
            }
          });
        });
        break;
    }

    return defaultPerms;
  };

  const normalizePermissions = (raw: unknown): PermissionItem[] => {
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((p): p is { resource: Resource; actions: Record<string, boolean> } => {
        return (
          typeof p === 'object' &&
          p !== null &&
          'resource' in p &&
          'actions' in p &&
          typeof (p as { resource?: unknown }).resource === 'string' &&
          typeof (p as { actions?: unknown }).actions === 'object'
        );
      })
      .map((p) => ({
        resource: (p.resource as Resource) || Resource.REPORTS,
        actions: { ...(p.actions as Record<string, boolean>) },
      }));
  };

  const loadUsers = useCallback(async () => {
    if (!currentUser) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.getUsers();
      const apiUsers = (response.data || []) as ApiUserLite[];

      // Load permissions from backend for each user
      const usersWithPermissions = await Promise.allSettled(
        apiUsers.map(async (apiUser) => {
          const userType = mapRoleToUserType(apiUser.role);

          // Try to load permissions from backend
          let permissions = getDefaultPermissions(userType);
          try {
            const permResponse = await apiClient.getUserPermissions(Number(apiUser.id));
            // If backend returns permissions and it's a non-empty array, use them
            // Empty array or null/undefined means use defaults
            const apiPerms = (permResponse.data as PermissionResponse | undefined)?.permissions;
            const normalized = normalizePermissions(apiPerms);
            if (normalized.length > 0) {
              permissions = normalized;
            }
          } catch (permErr: unknown) {
            // If 403 (forbidden) or 404 (not found), user doesn't have permissions set yet, use defaults
            // This is expected for new users or users without custom permissions
            if (
              typeof permErr === 'object' &&
              permErr !== null &&
              'response' in permErr &&
              typeof (permErr as { response?: { status?: number } }).response?.status === 'number' &&
              (((permErr as { response?: { status?: number } }).response?.status ?? 0) === 403 ||
                ((permErr as { response?: { status?: number } }).response?.status ?? 0) === 404)
            ) {
              // Use defaults, no error needed
            } else {
              // Other errors (network, server error, etc.) - log but continue with defaults
              console.warn(`Failed to load permissions for user ${apiUser.id}:`, permErr);
            }
          }

          return {
            userId: apiUser.id.toString(),
            userName: apiUser.full_name || apiUser.username || apiUser.email,
            email: apiUser.email,
            userType,
            isActive: apiUser.is_active ?? false,
            permissions: mergePermissionsByResource(permissions),
          };
        })
      );

      // Convert Promise.allSettled results to UserPermissions array
      const users: UserPermissions[] = usersWithPermissions
        .filter((result): result is PromiseFulfilledResult<UserPermissions> => result.status === 'fulfilled')
        .map(result => result.value);

      // Filter users based on managedUserTypes
      const filteredUsers = users.filter(user =>
        managedUserTypes.includes(user.userType)
      );

      setUserPermissions(filteredUsers);
      if (filteredUsers.length > 0 && !selectedUser) {
        setSelectedUser(filteredUsers[0].userId);
      }
    } catch (err: unknown) {
      const message =
        typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : null;
      setError(message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [currentUser, managedUserTypes, selectedUser]);

  // Load users from API
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Handlers
  const handlePermissionChange = (
    userId: string,
    resource: Resource,
    action: Action,
    value: boolean
  ) => {
    setUserPermissions(prev =>
      prev.map(user => {
        if (user.userId === userId) {
          // Find the resource in the user's permissions
          const resourceIndex = user.permissions.findIndex(p => p.resource === resource);

          // If resource exists, update the action; otherwise add a new resource
          if (resourceIndex !== -1) {
            const updatedPermissions = [...user.permissions];
            updatedPermissions[resourceIndex] = {
              ...updatedPermissions[resourceIndex],
              actions: {
                ...updatedPermissions[resourceIndex].actions,
                [action]: value
              }
            };
            return { ...user, permissions: updatedPermissions };
          } else {
            // Create new resource with this action
            return {
              ...user,
              permissions: [
                ...user.permissions,
                {
                  resource,
                  actions: { [action]: value }
                }
              ]
            };
          }
        }
        return user;
      })
    );
  };

  const handleToggleAllForResource = (userId: string, resource: Resource, value: boolean) => {
    setUserPermissions(prev =>
      prev.map(user => {
        if (user.userId === userId) {
          // Find the resource in the user's permissions
          const resourceIndex = user.permissions.findIndex(p => p.resource === resource);

          // Create an object with all actions set to the specified value
          const allActions = {
            [Action.READ]: value,
            [Action.CREATE]: value,
            [Action.UPDATE]: value,
            [Action.DELETE]: value,
            [Action.MANAGE]: value
          };

          // If resource exists, update all actions; otherwise add a new resource
          if (resourceIndex !== -1) {
            const updatedPermissions = [...user.permissions];
            updatedPermissions[resourceIndex] = {
              ...updatedPermissions[resourceIndex],
              actions: allActions
            };
            return { ...user, permissions: updatedPermissions };
          } else {
            // Create new resource with all actions
            return {
              ...user,
              permissions: [
                ...user.permissions,
                {
                  resource,
                  actions: allActions
                }
              ]
            };
          }
        }
        return user;
      })
    );
  };

  const areAllActionsSelected = (permissions: PermissionItem[], resource: Resource): boolean => {
    const resourcePermission = permissions.find(p => p.resource === resource);
    if (!resourcePermission) return false;

    // Check if all actions are true
    return Object.values(Action).every(action =>
      resourcePermission.actions[action] === true
    );
  };

  const handleSaveClick = () => {
    if (!selectedUser) return;
    const selectedUserData = userPermissions.find(u => u.userId === selectedUser);
    if (!selectedUserData) return;
    setConfirmUser(selectedUserData);
    setShowConfirm(true);
    setError(null);
    setSuccess(null);
  };

  const executeSavePermissions = async () => {
    if (!selectedUser) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const selectedUserData = userPermissions.find(u => u.userId === selectedUser);
      if (!selectedUserData) {
        throw new Error('Selected user not found');
      }

      const userId = parseInt(selectedUser, 10);
      if (isNaN(userId)) {
        throw new Error('Invalid user ID');
      }

      // Serialize permissions locally to JSON format required by backend
      const serializedPermissions = selectedUserData.permissions
        .filter(perm => Object.values(perm.actions).some(enabled => enabled))
        .map(perm => ({
          resource: perm.resource,
          actions: perm.actions
        }));

      // Type assertion needed because apiClient expects Record<string, unknown>[]
      await apiClient.updateUserPermissions(userId, serializedPermissions as unknown as Record<string, unknown>[]);

      setSuccess('Permissions saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
      setShowConfirm(false);
      setConfirmUser(null);
      // Refresh from backend to reflect real-time state
      await loadUsers();
    } catch (err: unknown) {
      const errorMessage =
        typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { data?: { detail?: string } }; message?: string }).response?.data?.detail ||
          (err as { message?: string }).message
          : err instanceof Error
            ? err.message
            : 'Failed to save permissions';
      setError(errorMessage || 'Failed to save permissions');
      console.error('Error saving permissions:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load templates from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTemplates = localStorage.getItem('permission_templates');
      if (savedTemplates) {
        try {
          setTemplates(JSON.parse(savedTemplates));
        } catch (err) {
          console.error('Failed to load templates:', err);
        }
      }
    }
  }, []);

  // Template handlers
  const handleSaveTemplate = () => {
    if (!selectedUser || !newTemplateName.trim()) return;

    const userToTemplate = userPermissions.find(u => u.userId === selectedUser);
    if (!userToTemplate) return;

    // Check if template name already exists
    const templateExists = templates.some(t =>
      t.name.toLowerCase() === newTemplateName.trim().toLowerCase() &&
      t.userType === userToTemplate.userType
    );

    if (templateExists) {
      setError('Template with this name already exists for this user type');
      return;
    }

    const newTemplate: RoleTemplate = {
      id: `template-${Date.now()}`,
      name: newTemplateName.trim(),
      userType: userToTemplate.userType,
      permissions: JSON.parse(JSON.stringify(userToTemplate.permissions))
    };

    const updatedTemplates = [...templates, newTemplate];
    setTemplates(updatedTemplates);

    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('permission_templates', JSON.stringify(updatedTemplates));
    }

    setNewTemplateName('');
    setError(null);

    // Show saved message
    setShowSavedMessage(true);

    // Clear previous timeout if it exists
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
    }

    // Hide message after 3 seconds
    messageTimeoutRef.current = setTimeout(() => {
      setShowSavedMessage(false);
    }, 3000);
  };

  const handleApplyTemplate = () => {
    if (!selectedUser || !selectedTemplate) return;

    const template = templates.find(t => t.id === selectedTemplate);
    if (!template) {
      setError('Template not found');
      return;
    }

    setUserPermissions(prev =>
      prev.map(user => {
        if (user.userId === selectedUser) {
          return {
            ...user,
            permissions: mergePermissionsByResource(JSON.parse(JSON.stringify(template.permissions)))
          };
        }
        return user;
      })
    );

    setError(null);
    setSuccess('Template applied successfully!');
    setTimeout(() => setSuccess(null), 3000);
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
    };
  }, []);

  // Get selected user data
  const selectedUserData = userPermissions.find(u => u.userId === selectedUser);

  // Get all available resources for checkboxes
  const allResources = Object.values(Resource);

  // Filter users by search term and user type
  const filteredUsers = userPermissions.filter(user => {
    const matchesSearch =
      user.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = userTypeFilter === 'all' || user.userType === userTypeFilter;

    return matchesSearch && matchesType;
  });

  if (loading && userPermissions.length === 0) {
    return (
      <Container>
        <HeaderContainer>
          <Title>{title}</Title>
        </HeaderContainer>
        <LoadingContainer>
          <Spinner />
          <p>Loading users...</p>
        </LoadingContainer>
      </Container>
    );
  }

  return (
    <Container>
      <HeaderContainer>
        <Title>{title}</Title>
        <p style={{ marginTop: theme.spacing.sm, opacity: 0.9, fontSize: theme.typography.fontSizes.md }}>
          Manage user permissions and access controls
        </p>
      </HeaderContainer>

      {error && (
        <ErrorMessage>
          {error}
        </ErrorMessage>
      )}

      {success && (
        <SuccessMessage>
          <Check size={16} />
          {success}
        </SuccessMessage>
      )}

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
            {managedUserTypes.map(type => (
              <option key={type} value={type}>
                {type.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())}
              </option>
            ))}
          </Select>
        </FilterLabel>
      </FilterContainer>

      <Card>
        {filteredUsers.length === 0 ? (
          <EmptyState>
            <p>No users found matching your criteria.</p>
          </EmptyState>
        ) : (
          <TableWrapper>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>User Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map(user => (
                  <TableRow key={user.userId}>
                    <TableCell style={{ fontWeight: theme.typography.fontWeights.medium }}>
                      {user.userName}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <UserTypeBadge>
                        {user.userType.replace(/_/g, ' ')}
                      </UserTypeBadge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge $active={user.isActive}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </StatusBadge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant={selectedUser === user.userId ? "default" : "secondary"}
                        onClick={() => setSelectedUser(user.userId)}
                      >
                        {selectedUser === user.userId ? 'Editing' : 'Edit Permissions'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableWrapper>
        )}
      </Card>

      {selectedUserData && (
        <Card>
          <SelectionHeader>
            <Subtitle>
              Managing Permissions for {selectedUserData.userName} ({selectedUserData.userType})
            </Subtitle>
          </SelectionHeader>

          <TemplateContainer>
            <Subtitle>Permission Templates</Subtitle>
            <TemplateControls>
              <TemplateName
                placeholder="New template name..."
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
              />
              <Button
                variant="secondary"
                onClick={handleSaveTemplate}
                disabled={!newTemplateName.trim()}
              >
                <Copy size={16} />
                Save as Template
              </Button>

              <TemplateSelect
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
              >
                <option value="">Select template to apply...</option>
                {templates
                  .filter(t => t.userType === selectedUserData.userType)
                  .map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))
                }
              </TemplateSelect>

              <Button
                variant="secondary"
                onClick={handleApplyTemplate}
                disabled={!selectedTemplate}
              >
                Apply Template
              </Button>
            </TemplateControls>

            {showSavedMessage && (
              <SuccessMessage>
                <Check size={16} />
                Template saved successfully
              </SuccessMessage>
            )}
          </TemplateContainer>
          <TableWrapper>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead style={{ fontWeight: theme.typography.fontWeights.bold }}>Resource</TableHead>
                  <TableHead style={{ textAlign: 'center' }}>View</TableHead>
                  <TableHead style={{ textAlign: 'center' }}>Create</TableHead>
                  <TableHead style={{ textAlign: 'center' }}>Edit</TableHead>
                  <TableHead style={{ textAlign: 'center' }}>Delete</TableHead>
                  <TableHead style={{ textAlign: 'center' }}>Manage All</TableHead>
                  <TableHead style={{ textAlign: 'center', fontWeight: theme.typography.fontWeights.bold }}>Select All</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allResources.map(resource => {
                  // Find if this user has permissions for this resource
                  const resourcePermission = selectedUserData.permissions.find(
                    p => p.resource === resource
                  );

                  // Check if all permissions are selected
                  const allSelected = areAllActionsSelected(selectedUserData.permissions, resource);

                  return (
                    <TableRow key={resource} style={{
                      backgroundColor: allSelected ? `${PRIMARY_COLOR}08` : 'transparent'
                    }}>
                      <TableCell style={{ fontWeight: theme.typography.fontWeights.medium }}>
                        {resource.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())}
                      </TableCell>
                      <TableCell style={{ textAlign: 'center' }}>
                        <Checkbox
                          checked={resourcePermission?.actions[Action.READ] || false}
                          onCheckedChange={(checked) => handlePermissionChange(
                            selectedUserData.userId,
                            resource,
                            Action.READ,
                            checked === true
                          )}
                        />
                      </TableCell>
                      <TableCell style={{ textAlign: 'center' }}>
                        <Checkbox
                          checked={resourcePermission?.actions[Action.CREATE] || false}
                          onCheckedChange={(checked) => handlePermissionChange(
                            selectedUserData.userId,
                            resource,
                            Action.CREATE,
                            checked === true
                          )}
                        />
                      </TableCell>
                      <TableCell style={{ textAlign: 'center' }}>
                        <Checkbox
                          checked={resourcePermission?.actions[Action.UPDATE] || false}
                          onCheckedChange={(checked) => handlePermissionChange(
                            selectedUserData.userId,
                            resource,
                            Action.UPDATE,
                            checked === true
                          )}
                        />
                      </TableCell>
                      <TableCell style={{ textAlign: 'center' }}>
                        <Checkbox
                          checked={resourcePermission?.actions[Action.DELETE] || false}
                          onCheckedChange={(checked) => handlePermissionChange(
                            selectedUserData.userId,
                            resource,
                            Action.DELETE,
                            checked === true
                          )}
                        />
                      </TableCell>
                      <TableCell style={{ textAlign: 'center' }}>
                        <Checkbox
                          checked={resourcePermission?.actions[Action.MANAGE] || false}
                          onCheckedChange={(checked) => handlePermissionChange(
                            selectedUserData.userId,
                            resource,
                            Action.MANAGE,
                            checked === true
                          )}
                        />
                      </TableCell>
                      <TableCell style={{ textAlign: 'center' }}>
                        <Checkbox
                          checked={allSelected}
                          onCheckedChange={(checked) => handleToggleAllForResource(
                            selectedUserData.userId,
                            resource,
                            checked === true
                          )}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableWrapper>

          <ButtonGroup>
            <Button
              variant="secondary"
              onClick={() => {
                setSelectedUser(null);
                setError(null);
                setSuccess(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveClick}
              disabled={loading || !selectedUser}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" style={{ marginRight: theme.spacing.sm }} />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} style={{ marginRight: theme.spacing.sm }} />
                  Save Permissions
                </>
              )}
            </Button>
          </ButtonGroup>
        </Card>
      )}

      {showConfirm && confirmUser && (
        <ConfirmOverlay>
          <ConfirmDialog>
            <ConfirmTitle>Review permissions before saving</ConfirmTitle>
            <ConfirmBody>
              <div>
                <strong>User:</strong> {confirmUser.userName} ({confirmUser.email})
              </div>
              <div>
                <strong>User Type:</strong> {confirmUser.userType.replace(/_/g, ' ')}
              </div>
              <div>
                <strong>Status:</strong> {confirmUser.isActive ? 'Active' : 'Inactive'}
              </div>
              <div>
                <strong>Permissions preview:</strong>
                <div style={{ marginTop: theme.spacing.sm, display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
                  {confirmUser.permissions.map((perm) => {
                    const enabledActions = Object.entries(perm.actions || {})
                      .filter(([, value]) => value === true)
                      .map(([action]) => action.toLowerCase());
                    return (
                      <PermissionChip key={perm.resource}>
                        {perm.resource.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())}: {enabledActions.length > 0 ? enabledActions.join(', ') : 'No actions'}
                      </PermissionChip>
                    );
                  })}
                </div>
              </div>
            </ConfirmBody>
            <ConfirmFooter>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowConfirm(false);
                  setConfirmUser(null);
                }}
                disabled={loading}
              >
                Back
              </Button>
              <Button onClick={executeSavePermissions} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" style={{ marginRight: theme.spacing.sm }} />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} style={{ marginRight: theme.spacing.sm }} />
                    Confirm & Save
                  </>
                )}
              </Button>
            </ConfirmFooter>
          </ConfirmDialog>
        </ConfirmOverlay>
      )}
    </Container>
  );
};

export default PermissionManager; 