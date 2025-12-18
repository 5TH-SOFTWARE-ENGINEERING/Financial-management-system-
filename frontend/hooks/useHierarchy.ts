// hooks/useHierarchy.ts
import { useState, useEffect, useCallback } from 'react';
import { roleService } from '@/lib/services/role-service';
import { Role, UserType, Permission } from '@/lib/rbac/models';

interface UseHierarchyProps {
  userType?: UserType;
}

type FetchRolesError = { message?: string };
type ServiceError = FetchRolesError & { response?: { data?: { detail?: string; error?: string } } };

const getErrorMessage = (err: unknown, fallback: string) => {
  if (typeof err === 'object' && err !== null) {
    const e = err as ServiceError;
    return e.response?.data?.detail || e.response?.data?.error || e.message || fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
};

export function useHierarchy({ userType }: UseHierarchyProps = {}) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all roles or roles by userType
  const fetchRoles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let fetchedRoles: Role[] = [];
      if (userType) {
        fetchedRoles = await roleService.getRolesByUserType(userType);
      } else {
        fetchedRoles = await roleService.getAllRoles();
      }
      setRoles(fetchedRoles);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to fetch roles'));
    } finally {
      setLoading(false);
    }
  }, [userType]);

  // Assign a role to a user (single role)
  const assignRole = useCallback(async (userId: string, role: UserType) => {
    try {
      const updatedUser = await roleService.assignRoleToUser(userId, role);
      return updatedUser;
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to assign role'));
      return null;
    }
  }, []);

  // Remove role from user (sets to default EMPLOYEE)
  const removeRole = useCallback(async (userId: string) => {
    try {
      const updatedUser = await roleService.removeRoleFromUser(userId);
      return updatedUser;
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to remove role'));
      return null;
    }
  }, []);

  // Get permissions for a role
  const getPermissions = useCallback(async (role: UserType) => {
    try {
      const permissions: Permission[] = await roleService.getRolePermissions(role);
      return permissions;
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to fetch permissions'));
      return [];
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  return {
    roles,
    loading,
    error,
    fetchRoles,
    assignRole,
    removeRole,
    getPermissions,
  };
}
