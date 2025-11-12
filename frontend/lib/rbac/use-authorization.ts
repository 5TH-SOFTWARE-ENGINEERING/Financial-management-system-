import { useAuth } from './auth-context';
import { Resource, Action, UserType } from './models';

interface AuthorizationHook {
  hasPermission: (resource: Resource, action: Action) => boolean;
  hasUserPermission: (userId: string, resource: Resource, action: Action) => Promise<boolean>;
  isAdmin: () => boolean;
  isCorporateAdmin: () => boolean;
  isProvider: () => boolean;
  isMember: () => boolean;
  isStaff: () => boolean;
  hasRole: (roleName: string) => boolean;
  hasUserType: (userType: UserType) => boolean;
  isInsuranceAdmin: () => boolean;
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
    return user.roles.some(role => role.name === 'ADMIN') || 
           user.userType === UserType.ADMIN || 
           user.userType === UserType.INSURANCE_ADMIN;
  };

  /**
   * Check if the user is an insurance administrator
   */
  const isInsuranceAdmin = (): boolean => {
    if (!user) return false;
    return user.userType === UserType.INSURANCE_ADMIN;
  };

  /**
   * Check if the user is a corporate administrator
   */
  const isCorporateAdmin = (): boolean => {
    if (!user) return false;
    return user.roles.some(role => role.name === 'CORPORATE') || 
           user.userType === UserType.CORPORATE_ADMIN;
  };

  /**
   * Check if the user is a provider
   */
  const isProvider = (): boolean => {
    if (!user) return false;
    return user.roles.some(role => role.name === 'PROVIDER') || 
           user.userType === UserType.PROVIDER || 
           user.userType === UserType.PROVIDER_ADMIN;
  };

  /**
   * Check if the user is a member
   */
  const isMember = (): boolean => {
    if (!user) return false;
    return user.roles.some(role => role.name === 'MEMBER') || 
           user.userType === UserType.MEMBER;
  };

  /**
   * Check if the user is a staff
   */
  const isStaff = (): boolean => {
    if (!user) return false;
    return user.roles.some(role => role.name === 'STAFF') || 
           user.userType === UserType.STAFF || 
           user.userType === UserType.INSURANCE_STAFF;
  };

  /**
   * Check if the user has a specific role
   */
  const hasRole = (roleName: string): boolean => {
    if (!user) return false;
    return user.roles.some(role => role.name === roleName);
  };

  /**
   * Check if the user has a specific user type
   */
  const hasUserType = (userType: UserType): boolean => {
    if (!user) return false;
    return user.userType === userType;
  };

  return {
    hasPermission,
    hasUserPermission,
    isAdmin,
    isCorporateAdmin,
    isProvider,
    isMember,
    isStaff,
    hasRole,
    hasUserType,
    isInsuranceAdmin,
    refreshUser
  };
}; 