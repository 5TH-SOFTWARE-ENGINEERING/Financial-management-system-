'use client';

import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import useUserStore from '@/store/userStore';

// Define User type to match store (from error message)
interface StoreUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'finance_manager' | 'accountant' | 'employee';
  isActive: boolean;
  createdAt: string;
  managerId?: string;
}

// Define full UserState based on store
interface UserState {
  user: StoreUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: any) => Promise<void>;
  canManageUsers: () => boolean;
  canViewAllData: () => boolean;
  canApproveTransactions: () => boolean;
  canSubmitTransactions: () => boolean;
  getCurrentUser: () => Promise<void>;
}

interface AuthContextType extends Pick<UserState, 'user' | 'isAuthenticated' | 'isLoading' | 'login' | 'logout' | 'register' | 'canManageUsers' | 'canViewAllData' | 'canApproveTransactions' | 'canSubmitTransactions'> {}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    register,
    canManageUsers,
    canViewAllData,
    canApproveTransactions,
    canSubmitTransactions,
    getCurrentUser,
  } = useUserStore();

  // Fetch current user on mount if needed (integrate with store or useQuery)
  const { isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => apiClient.getCurrentUser().then(res => res.data),
    enabled: !!localStorage.getItem('access_token'),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!!localStorage.getItem('access_token') && user === null) {
      // Call store's getCurrentUser to fetch and set user
      getCurrentUser();
    }
  }, [getCurrentUser, user]);

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading: isLoading || userLoading,
    login,
    logout,
    register,
    canManageUsers,
    canViewAllData,
    canApproveTransactions,
    canSubmitTransactions,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthProvider;