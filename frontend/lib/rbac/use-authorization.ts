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
      user.role === UserType.ADMIN ||
      user.role === UserType.FINANCE_ADMIN
    );
  };

  const isFinanceAdmin = (): boolean => {
    if (!user) return false;
    return user.role === UserType.FINANCE_ADMIN;
  };

  const isAccountant = (): boolean => {
    if (!user) return false;
    return user.role === UserType.ACCOUNTANT;
  };

  const isEmployee = (): boolean => {
    if (!user) return false;
    return user.role === UserType.EMPLOYEE;
  };

  /**
   * Check if the user has a specific role string OR ANY from a list
   */
  const hasRole = (roleName: string | string[]): boolean => {
    if (!user) return false;

    if (Array.isArray(roleName)) {
      return roleName.includes(user.role);
    }

    return user.role === roleName;
  };

  /**
   * Check if the user has a specific UserType enum OR ANY from a list
   */
  const hasUserType = (userType: UserType | UserType[]): boolean => {
    if (!user) return false;

    if (Array.isArray(userType)) {
      return userType.includes(user.role);
    }

    return user.role === userType;
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
