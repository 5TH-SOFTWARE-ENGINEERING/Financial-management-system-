'use client';

import React, { createContext, useContext, useEffect, useMemo, ReactNode } from 'react';
import { User, Resource, Action, UserType } from './models';
import useUserStore from '@/store/userStore';

// Only redirect on client side
const redirectToHome = () => {
  if (typeof window !== 'undefined') {
    window.location.href = '/';
  }
};

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
    const userType = mapStoreRoleToUserType(storeUser.role);
    return {
      id: storeUser.id,
      username: storeUser.name,
      email: storeUser.email,
      full_name: storeUser.name,
      phone: storeUser.phone ?? null,
      userType: userType,
      role: storeUser.role,
      is_active: storeUser.isActive,
      created_at: storeUser.createdAt ? new Date(storeUser.createdAt) : new Date(),
      updated_at: new Date(),
      last_login: null,
    };
  }, [storeUser]);

  // Auto-fetch user if token exists but user is not loaded
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token && !mappedUser && !isLoading) {
        getCurrentUser().catch((error) => {
          console.error('Failed to get current user:', error);
          // If token is invalid, clear it
          if (error.response?.status === 401) {
            localStorage.removeItem('access_token');
          }
        });
      }
    }
  }, [mappedUser, isLoading, getCurrentUser]);

  const login = async (identifier: string, password: string): Promise<boolean> => {
    try {
      await storeLogin(identifier, password);
      // Verify that user is actually authenticated before returning true
      const currentState = useUserStore.getState();
      if (!currentState.isAuthenticated || !currentState.user) {
        throw new Error('Login failed: User not authenticated');
      }
      return true;
    } catch (error) {
      console.error('Login error:', error);
      // Re-throw the error so the calling code can handle it properly
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Call store logout which handles API call and state clearing
      await storeLogout();
      
      // Clear any additional localStorage items
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('language');
      }
      
      // Redirect to home page after logout
      redirectToHome();
    } catch (error) {
      console.error('Logout error:', error);
      
      // Even if logout fails, clear local storage and redirect
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('language');
      }
      
      // Still redirect to home page
      redirectToHome();
    }
  };

  const hasPermission = (resource: Resource, _action?: Action): boolean => {
    if (!mappedUser || !mappedUser.is_active) return false;

    const rolePermissions: Record<UserType, Resource[]> = {
      [UserType.ADMIN]: [
        Resource.DASHBOARD,
        Resource.USERS,
        Resource.ROLES,
        Resource.REVENUES,
        Resource.EXPENSES,
        Resource.TRANSACTIONS,
        Resource.REPORTS,
        Resource.SETTINGS,
        Resource.DEPARTMENTS,
        Resource.PROJECTS,
        Resource.PROFILE,
        Resource.FINANCIAL_PLANS,
      ],
      [UserType.FINANCE_ADMIN]: [
        Resource.DASHBOARD,
        Resource.REVENUES,
        Resource.EXPENSES,
        Resource.TRANSACTIONS,
        Resource.REPORTS,
        Resource.DEPARTMENTS,
        Resource.PROJECTS,
        Resource.PROFILE,
      ],
      [UserType.ACCOUNTANT]: [
        Resource.DASHBOARD,
        Resource.REVENUES,
        Resource.EXPENSES,
        Resource.REPORTS,
        Resource.PROFILE,
      ],
      [UserType.EMPLOYEE]: [
        Resource.DASHBOARD,
        Resource.PROFILE,
      ],
    };

    const userType = mappedUser.userType;
    const allowedResources = rolePermissions[userType] || [];
    return allowedResources.includes(resource);
  };

  const hasUserPermission = (userId: string, resource: Resource, action?: Action): boolean => {
    if (!mappedUser || mappedUser.id.toString() !== userId) return false;
    return hasPermission(resource, action);
  };

  const refreshUser = async (): Promise<void> => {
    try {
      await getCurrentUser();
    } catch (error) {
      console.error('Failed to refresh user:', error);
      // If refresh fails with 401, user is not authenticated
      if (error && typeof error === 'object' && 'response' in error) {
        const httpError = error as { response?: { status?: number } };
        if (httpError.response?.status === 401) {
          // Clear invalid token
          if (typeof window !== 'undefined') {
            localStorage.removeItem('access_token');
          }
        }
      }
      throw error;
    }
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