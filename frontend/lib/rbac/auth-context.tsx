'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Resource, Action, UserType } from './models';
import { useRouter } from 'next/navigation';
import { authService } from '../services/auth-service';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (resource: Resource, action: Action) => boolean;
  hasUserPermission: (userId: string, resource: Resource, action: Action) => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check for existing auth in localStorage when component mounts
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
  
    try {
      const response = await authService.login(email, password);
  
      // Log auth context processing
      console.log('Auth Context Processing:', JSON.stringify({
        timestamp: new Date().toISOString(),
        authentication: {
          hasToken: !!response.access_token,
          tokenPreview: response.access_token ? `${response.access_token.substring(0, 15)}...` : '[MISSING]'
        },
        userData: {
          id: response.user?.id,
          username: response.user?.username,
          email: response.user?.email,
          role: response.user?.role,
          is_active: response.user?.is_active
        }
      }, null, 2));
  
      // Ensure response contains user data
      if (!response || !response.user) {
        throw new Error('Unexpected response from server: User data is missing');
      }
  
      // Store token
      if (response.access_token) {
        localStorage.setItem('token', response.access_token);
      }
  
      // Create user object with required fields
      const completeUser: User = {
        id: response.user.id,
        username: response.user.username,
        email: response.user.email,
        full_name: response.user.full_name || response.user.username,
        phone: response.user.phone || null,
        role: response.user.role || UserType.EMPLOYEE,
        is_active: response.user.is_active !== false,
        created_at: response.user.created_at || new Date(),
        updated_at: response.user.updated_at || new Date(),
        last_login: response.user.last_login || null,
      };
  
      // Log final processed user data
      console.log('Processed User Data:', JSON.stringify({
        timestamp: new Date().toISOString(),
        user: {
          ...completeUser,
          token: '[REDACTED]'
        },
        status: {
          isActive: completeUser.is_active,
          role: completeUser.role
        }
      }, null, 2));
  
      // Check if account is active
      if (completeUser.is_active === false) {
        const message = `Account is inactive. Please contact your system administrator. (User: ${completeUser.username}, Role: ${completeUser.role})`;
        setError(message);
        return false;
      }
  
      setUser(completeUser);
      localStorage.setItem('user', JSON.stringify(completeUser));
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
  
      // Log error in JSON format
      console.error('Auth Context Error:', JSON.stringify({
        timestamp: new Date().toISOString(),
        error: {
          message: errorMessage,
          type: err instanceof Error ? err.name : 'Unknown',
          details: err instanceof Error ? err.message : String(err)
        }
      }, null, 2));
  
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
        // First try to call the backend logout endpoint
        await fetch('http://localhost:8000/api/v1/auth/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            credentials: 'include'
        });
    } catch (error) {
        console.error('Logout error:', error);
        // Continue with local logout even if backend call fails
    } finally {
        // Clear all authentication data
    setUser(null);
        
        // Clear all localStorage items
    localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('authState');
        localStorage.removeItem('permissions');
        localStorage.removeItem('userRole');
        localStorage.removeItem('sessionData');
        
        // Clear any session storage
        sessionStorage.clear();
        
        // Clear any cookies
        document.cookie.split(";").forEach(function(c) { 
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
        });
        
        // Redirect to root path (where Login component is)
        router.push('/auth/login');
    }
  };
  
  const hasPermission = (resource: Resource, action: Action): boolean => {
    if (!user) return false;

    // Simplified permission check based on role
    // In a full RBAC system, this would query roles/permissions
    const rolePermissions: Record<UserType, Resource[]> = {
      // [UserType.SUPER_ADMIN]: [Resource.DASHBOARD, Resource.USERS, Resource.ROLES, Resource.REVENUES, Resource.EXPENSES, Resource.TRANSACTIONS, Resource.REPORTS, Resource.SETTINGS],
      [UserType.ADMIN]: [Resource.DASHBOARD, Resource.USERS, Resource.ROLES, Resource.REVENUES, Resource.EXPENSES, Resource.TRANSACTIONS, Resource.REPORTS, Resource.SETTINGS],
      [UserType.FINANCE_ADMIN]: [Resource.DASHBOARD, Resource.REVENUES, Resource.EXPENSES, Resource.TRANSACTIONS, Resource.REPORTS],
      [UserType.ACCOUNTANT]: [Resource.DASHBOARD, Resource.REVENUES, Resource.EXPENSES, Resource.REPORTS],
      [UserType.EMPLOYEE]: [Resource.DASHBOARD, Resource.PROFILE]
    };

    const allowedResources = rolePermissions[user.role] || [];
    return allowedResources.includes(resource);
  };
  
  const hasUserPermission = (userId: string, resource: Resource, action: Action): boolean => {
    // In a real app, you would make an API call to check permissions for any user
    // For demo purposes, we'll only check the current user
    if (!user || user.id.toString() !== userId) return false;
    
    return hasPermission(resource, action);
  };
  
  const refreshUser = async (): Promise<void> => {
    if (!user) return;
    
    try {
      // In a real app, this would be an API call to get the latest user data
      // Here we're just re-setting the user (no changes for demo)
      setUser(user);
    } catch (err) {
      console.error('Failed to refresh user data', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        logout,
        hasPermission,
        hasUserPermission,
        refreshUser
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