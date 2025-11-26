'use client';

import React, { createContext, useContext, useEffect, useMemo, ReactNode } from 'react';
import { User, Resource, Action, UserType } from './models';
import useUserStore from '@/store/userStore';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (identifier: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  hasPermission: (resource: Resource, action: Action) => boolean;
  hasUserPermission: (userId: string, resource: Resource, action: Action) => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const roleMap: Record<string, UserType> = {
  super_admin: UserType.ADMIN,
  admin: UserType.ADMIN,
  finance_manager: UserType.FINANCE_ADMIN,
  manager: UserType.FINANCE_ADMIN,
  accountant: UserType.ACCOUNTANT,
  employee: UserType.EMPLOYEE,
};

const mapStoreRoleToUserType = (role?: string): UserType => {
  return roleMap[role ?? ''] ?? UserType.EMPLOYEE;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const {
    user: storeUser,
    isAuthenticated,
    isLoading,
    error,
    login: storeLogin,
    logout: storeLogout,
    getCurrentUser,
  } = useUserStore();

  const mappedUser = useMemo<User | null>(() => {
    if (!storeUser) return null;
    return {
      id: storeUser.id,
      username: storeUser.name,
      email: storeUser.email,
      full_name: storeUser.name,
      phone: storeUser.phone ?? null,
      role: mapStoreRoleToUserType(storeUser.role),
      is_active: storeUser.isActive,
      created_at: storeUser.createdAt ? new Date(storeUser.createdAt) : new Date(),
      updated_at: new Date(),
      last_login: null,
    };
  }, [storeUser]);

  useEffect(() => {
    if (!mappedUser && typeof window !== 'undefined' && localStorage.getItem('access_token')) {
      getCurrentUser();
    }
  }, [mappedUser, getCurrentUser]);

  const login = async (identifier: string, password: string): Promise<boolean> => {
    try {
      await storeLogin(identifier, password);
      return true;
    } catch {
      return false;
    }
  };

  const logout = async () => {
    await storeLogout();
  };

  const hasPermission = (resource: Resource, _action?: Action): boolean => {
    if (!mappedUser) return false;

    const rolePermissions: Record<UserType, Resource[]> = {
      [UserType.ADMIN]: [Resource.DASHBOARD, Resource.USERS, Resource.ROLES, Resource.REVENUES, Resource.EXPENSES, Resource.TRANSACTIONS, Resource.REPORTS, Resource.SETTINGS],
      [UserType.FINANCE_ADMIN]: [Resource.DASHBOARD, Resource.REVENUES, Resource.EXPENSES, Resource.TRANSACTIONS, Resource.REPORTS],
      [UserType.ACCOUNTANT]: [Resource.DASHBOARD, Resource.REVENUES, Resource.EXPENSES, Resource.REPORTS],
      [UserType.EMPLOYEE]: [Resource.DASHBOARD, Resource.PROFILE],
    };

    const allowedResources = rolePermissions[mappedUser.role] || [];
    return allowedResources.includes(resource);
  };

  const hasUserPermission = (userId: string, resource: Resource, action?: Action): boolean => {
    if (!mappedUser || mappedUser.id.toString() !== userId) return false;
    return hasPermission(resource, action);
  };

  const refreshUser = async (): Promise<void> => {
    await getCurrentUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user: mappedUser,
        isAuthenticated,
        isLoading,
        error,
        login,
        logout,
        hasPermission,
        hasUserPermission,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};