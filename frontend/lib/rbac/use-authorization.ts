// lib/rbac/use-authorization.tsx
import { useAuth } from './auth-context';
import { Resource, Action, UserType } from './models';

interface AuthorizationHook {
  hasPermission: (resource: Resource, action: Action) => boolean;
  hasUserPermission: (userId: string, resource: Resource, action: Action) => boolean;

  // Role helpers
  isAdmin: () => boolean;
  isFinanceAdmin: () => boolean;
  isAccountant: () => boolean;
  isEmployee: () => boolean;

  hasRole: (roleName: string | string[]) => boolean;
  hasUserType: (userType: UserType | UserType[]) => boolean;

  refreshUser: () => Promise<void>;
}

/**
 * Custom hook to check permissions and roles
 */
export const useAuthorization = (): AuthorizationHook => {
  const { user, hasPermission, hasUserPermission, refreshUser } = useAuth();

  /**
   * ROLE CHECK HELPERS
   */
  const isAdmin = (): boolean => {
    if (!user) return false;
    return (
      user.userType === UserType.ADMIN ||
      user.userType === UserType.FINANCE_ADMIN
    );
  };

  const isFinanceAdmin = (): boolean => {
    if (!user) return false;
    return user.userType === UserType.FINANCE_ADMIN;
  };

  const isAccountant = (): boolean => {
    if (!user) return false;
    return user.userType === UserType.ACCOUNTANT;
  };

  const isEmployee = (): boolean => {
    if (!user) return false;
    return user.userType === UserType.EMPLOYEE;
  };

  /**
   * Check if the user has a specific role string OR ANY from a list
   * Uses the role string (e.g., 'admin', 'manager', 'accountant', 'employee')
   */
  const hasRole = (roleName: string | string[]): boolean => {
    if (!user) return false;

    const userRole = user.role?.toLowerCase() || '';
    const normalizedRoleName = Array.isArray(roleName) 
      ? roleName.map(r => r.toLowerCase())
      : roleName.toLowerCase();

    if (Array.isArray(roleName)) {
      return normalizedRoleName.includes(userRole);
    }

    return userRole === normalizedRoleName;
  };

  /**
   * Check if the user has a specific UserType enum OR ANY from a list
   * Uses the userType enum (e.g., UserType.ADMIN, UserType.FINANCE_ADMIN)
   */
  const hasUserType = (userType: UserType | UserType[]): boolean => {
    if (!user) return false;

    if (Array.isArray(userType)) {
      return userType.includes(user.userType);
    }

    return user.userType === userType;
  };

  return {
    hasPermission,
    hasUserPermission,
    isAdmin,
    isFinanceAdmin,
    isAccountant,
    isEmployee,
    hasRole,
    hasUserType,
    refreshUser,
  };
};
