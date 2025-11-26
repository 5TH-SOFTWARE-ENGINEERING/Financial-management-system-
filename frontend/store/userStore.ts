'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserRole } from '@/lib/validation'; // Assume only UserRole is needed; remove User if conflicting
import apiClient, { type ApiUser } from '@/lib/api';

// Define store user type (frontend-optimized, string IDs)
export interface StoreUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'finance_manager' | 'accountant' | 'employee';
  department?: string;
  isActive: boolean;
  createdAt?: string;
  managerId?: string;
  phone?: string | null;
}

// Map API User to StoreUser
const normalizeInboundRole = (role?: string): StoreUser['role'] => {
  const normalized = role?.toLowerCase();
  switch (normalized) {
    case 'admin':
    case 'super_admin':
      return 'admin';
    case 'manager':
    case 'finance_manager':
      return 'finance_manager';
    case 'accountant':
      return 'accountant';
    case 'employee':
    default:
      return 'employee';
  }
};

const mapToStoreUser = (apiUser: ApiUser): StoreUser => ({
  id: apiUser.id.toString(),
  name: apiUser.full_name || apiUser.username || apiUser.email,
  email: apiUser.email,
  role: normalizeInboundRole(apiUser.role),
  department: apiUser.department,
  isActive: apiUser.is_active,
  createdAt: apiUser.created_at,
  managerId: apiUser.manager_id !== undefined && apiUser.manager_id !== null ? apiUser.manager_id.toString() : undefined,
  phone: apiUser.phone,
});

// Map back if needed (for API calls)
const normalizeOutboundRole = (role?: StoreUser['role']): string | undefined => {
  switch (role) {
    case 'finance_manager':
      return 'manager';
    case 'admin':
      return 'admin';
    case 'accountant':
      return 'accountant';
    case 'employee':
      return 'employee';
    default:
      return undefined;
  }
};

const mapToApiUser = (userLike: Partial<StoreUser>): Partial<ApiUser> => ({
  full_name: userLike.name,
  email: userLike.email,
  role: normalizeOutboundRole(userLike.role),
  department: userLike.department,
  is_active: userLike.isActive,
  manager_id: userLike.managerId ? parseInt(userLike.managerId, 10) : undefined,
});

interface UserState {
  // User data
  user: StoreUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Subordinates
  subordinates: StoreUser[];
  allUsers: StoreUser[];
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: any) => Promise<void>;
  getCurrentUser: () => Promise<void>;
  fetchSubordinates: () => Promise<void>;
  fetchAllUsers: () => Promise<void>;
  createUser: (userData: any) => Promise<void>;
  updateUser: (userId: string, userData: any) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  clearError: () => void;
  
  // Permission checks
  canManageUsers: () => boolean;
  canViewAllData: () => boolean;
  canApproveTransactions: () => boolean;
  canSubmitTransactions: () => boolean;
  getAccessibleRoutes: () => string[];
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      subordinates: [],
      allUsers: [],

      // Auth actions
      login: async (identifier: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.login(identifier, password);
          const mappedUser = mapToStoreUser(response.data.user);
          set({
            user: mappedUser,
            isAuthenticated: true,
            error: null,
          });
        } catch (error: any) {
          const detail = error.response?.data?.detail || error.response?.data?.error || error.message;
          set({ error: detail || 'Login failed', isAuthenticated: false });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await apiClient.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({
            user: null,
            isAuthenticated: false,
            subordinates: [],
            allUsers: [],
            isLoading: false,
            error: null,
          });
        }
      },

      register: async (userData: any) => {
        set({ isLoading: true, error: null });
        try {
          await apiClient.register(userData);
        } catch (error: any) {
          const detail = error.response?.data?.detail || error.response?.data?.error || error.message;
          set({ error: detail || 'Registration failed' });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      getCurrentUser: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.getCurrentUser();
          const mappedUser = mapToStoreUser(response.data);
          set({
            user: mappedUser,
            isAuthenticated: true,
            error: null,
          });
        } catch (error: any) {
          set({
            user: null,
            isAuthenticated: false,
            error: error.response?.data?.detail || error.response?.data?.error || 'Failed to get user data'
          });
        } finally {
          set({ isLoading: false });
        }
      },

      // User management actions
      fetchSubordinates: async () => {
        const { user } = get();
        if (!user) return;
        
        set({ isLoading: true });
        try {
          const response = await apiClient.getSubordinates(parseInt(user.id, 10));
          const mappedSubs = response.data.map(mapToStoreUser);
          set({ subordinates: mappedSubs });
        } catch (error: any) {
          set({ error: error.response?.data?.detail || error.response?.data?.error || 'Failed to fetch subordinates' });
        } finally {
          set({ isLoading: false });
        }
      },

      fetchAllUsers: async () => {
        set({ isLoading: true });
        try {
          const response = await apiClient.getUsers();
          const mappedUsers = response.data.map(mapToStoreUser);
          set({ allUsers: mappedUsers });
        } catch (error: any) {
          set({ error: error.response?.data?.detail || error.response?.data?.error || 'Failed to fetch users' });
        } finally {
          set({ isLoading: false });
        }
      },

      createUser: async (userData: any) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.createUser(userData);
          const mappedUser = mapToStoreUser(response.data);
          set(state => ({
            allUsers: [...state.allUsers, mappedUser]
          }));
        } catch (error: any) {
          set({ error: error.response?.data?.detail || error.response?.data?.error || 'Failed to create user' });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      updateUser: async (userId: string, userData: any) => {
        set({ isLoading: true, error: null });
        try {
          // Map userData to API format if needed
          const apiUserData = { ...userData, ...mapToApiUser(userData) };
          const response = await apiClient.updateUser(parseInt(userId, 10), apiUserData);
          const mappedUser = mapToStoreUser(response.data);
          set(state => ({
            allUsers: state.allUsers.map(u => u.id === userId ? mappedUser : u),
            subordinates: state.subordinates.map(u => u.id === userId ? mappedUser : u),
            user: state.user?.id === userId ? mappedUser : state.user
          }));
        } catch (error: any) {
          set({ error: error.response?.data?.detail || error.response?.data?.error || 'Failed to update user' });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      deleteUser: async (userId: string) => {
        set({ isLoading: true, error: null });
        try {
          await apiClient.deleteUser(parseInt(userId, 10));
          set(state => ({
            allUsers: state.allUsers.filter(u => u.id !== userId),
            subordinates: state.subordinates.filter(u => u.id !== userId)
          }));
        } catch (error: any) {
          set({ error: error.response?.data?.detail || error.response?.data?.error || 'Failed to delete user' });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      clearError: () => set({ error: null }),

      // Permission checks
      canManageUsers: () => {
        const { user } = get();
        return user?.role === 'admin' || user?.role === 'finance_manager';
      },

      canViewAllData: () => {
        const { user } = get();
        return user?.role === 'admin';
      },

      canApproveTransactions: () => {
        const { user } = get();
        return user?.role === 'admin' || user?.role === 'finance_manager';
      },

      canSubmitTransactions: () => {
        const { user } = get();
        return user?.role === 'accountant' || user?.role === 'employee';
      },

      getAccessibleRoutes: () => {
        const { user } = get();
        if (!user) return ['/auth/login', '/auth/register'];
        
        const baseRoutes = ['/dashboard', '/revenue', '/expenses', '/reports', '/notifications'];
        
        switch (user.role) {
          case 'admin':
            return [...baseRoutes, '/users', '/admin', '/approvals'];
          case 'finance_manager':
            return [...baseRoutes, '/users', '/approvals'];
          case 'accountant':
            return [...baseRoutes];
          case 'employee':
            return ['/dashboard', '/revenue', '/expenses', '/notifications'];
          default:
            return [];
        }
      },
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useUserStore;