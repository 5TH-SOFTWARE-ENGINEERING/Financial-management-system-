'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserRole } from '@/lib/validation'; // Assume only UserRole is needed; remove User if conflicting
import apiClient from '@/lib/api';

// Define API User type (from backend)
interface ApiUser {
  id: number;
  email: string;
  full_name: string;
  role: 'admin' | 'finance_manager' | 'accountant' | 'employee';
  department?: string;
  is_active: boolean;
  created_at?: string;
  manager_id?: number;
}

// Define store user type (frontend-optimized, string IDs)
interface StoreUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'finance_manager' | 'accountant' | 'employee';
  department?: string;
  isActive: boolean;
  createdAt?: string;
  managerId?: string;
}

// Map API User to StoreUser
const mapToStoreUser = (apiUser: ApiUser): StoreUser => ({
  id: apiUser.id.toString(),
  name: apiUser.full_name,
  email: apiUser.email,
  role: apiUser.role,
  department: apiUser.department,
  isActive: apiUser.is_active,
  createdAt: apiUser.created_at,
  managerId: apiUser.manager_id?.toString(),
});

// Map back if needed (for API calls)
const mapToApiUser = (storeUser: StoreUser): Partial<ApiUser> => ({
  full_name: storeUser.name,
  email: storeUser.email,
  role: storeUser.role,
  department: storeUser.department,
  is_active: storeUser.isActive,
  manager_id: storeUser.managerId ? parseInt(storeUser.managerId) : undefined,
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
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          await apiClient.login(email, password);
          await get().getCurrentUser();
        } catch (error: any) {
          set({ error: error.response?.data?.error || 'Login failed' });
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
          set({ error: error.response?.data?.error || 'Registration failed' });
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
            isAuthenticated: true 
          });
        } catch (error: any) {
          set({ 
            user: null, 
            isAuthenticated: false,
            error: error.response?.data?.error || 'Failed to get user data'
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
          const response = await apiClient.getSubordinates(parseInt(user.id));
          const mappedSubs = response.data.map(mapToStoreUser);
          set({ subordinates: mappedSubs });
        } catch (error: any) {
          set({ error: error.response?.data?.error || 'Failed to fetch subordinates' });
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
          set({ error: error.response?.data?.error || 'Failed to fetch users' });
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
          set({ error: error.response?.data?.error || 'Failed to create user' });
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
          const response = await apiClient.updateUser(parseInt(userId), apiUserData);
          const mappedUser = mapToStoreUser(response.data);
          set(state => ({
            allUsers: state.allUsers.map(u => u.id === userId ? mappedUser : u),
            subordinates: state.subordinates.map(u => u.id === userId ? mappedUser : u),
            user: state.user?.id === userId ? mappedUser : state.user
          }));
        } catch (error: any) {
          set({ error: error.response?.data?.error || 'Failed to update user' });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      deleteUser: async (userId: string) => {
        set({ isLoading: true, error: null });
        try {
          await apiClient.deleteUser(parseInt(userId));
          set(state => ({
            allUsers: state.allUsers.filter(u => u.id !== userId),
            subordinates: state.subordinates.filter(u => u.id !== userId)
          }));
        } catch (error: any) {
          set({ error: error.response?.data?.error || 'Failed to delete user' });
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