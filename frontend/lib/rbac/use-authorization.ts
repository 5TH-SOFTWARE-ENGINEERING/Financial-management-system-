// lib/rbac/use-authorization.tsx
import { useAuth } from './auth-context';
import { Resource, Action, UserType } from './models';

interface AuthorizationHook {
  hasPermission: (resource: Resource, action: Action) => boolean;
  hasUserPermission: (userId: string, resource: Resource, action: Action) => boolean;
  isAdmin: () => boolean;
  isAccountant: () => boolean;
  isEmployee: () => boolean;
  hasRole: (roleName: string) => boolean;
  hasUserType: (userType: UserType) => boolean;
  isFinanceAdmin: () => boolean;
  refreshUser: () => Promise<void>;
}

/**
 * Custom hook to check permissions and roles
 */
export const useAuthorization = (): AuthorizationHook => {
  const { user, hasPermission, hasUserPermission, refreshUser } = useAuth();

  /**
   * Check if the user is an administrator
   */
  const isAdmin = (): boolean => {
    if (!user) return false;
    return user.role === UserType.ADMIN || 
           user.role === UserType.FINANCE_ADMIN;
  };

  /**
   * Check if the user is a finance admin
   */
  const isFinanceAdmin = (): boolean => {
    if (!user) return false;
    return user.role === UserType.FINANCE_ADMIN;
  };

  /**
   * Check if the user is an accountant
   */
  const isAccountant = (): boolean => {
    if (!user) return false;
    return user.role === UserType.ACCOUNTANT;
  };

  /**
   * Check if the user is an employee
   */
  const isEmployee = (): boolean => {
    if (!user) return false;
    return user.role === UserType.EMPLOYEE;
  };

  /**
   * Check if the user has a specific role
   */
  const hasRole = (roleName: string): boolean => {
    if (!user) return false;
    return user.role === roleName;
  };

  /**
   * Check if the user has a specific user type
   */
  const hasUserType = (userType: UserType): boolean => {
    if (!user) return false;
    return user.role === userType;
  };

  return {
    hasPermission,
    hasUserPermission,
    isAdmin,
    isAccountant,
    isEmployee,
    hasRole,
    hasUserType,
    isFinanceAdmin,
    refreshUser
  };
}; 