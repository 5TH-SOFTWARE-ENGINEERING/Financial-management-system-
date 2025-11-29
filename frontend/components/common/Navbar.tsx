//components/common/Navbar.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import {
  Search,
  Plus,
  Bell,
  FileSpreadsheet,
  Globe,
  User, 
  LogOut,
  Settings,
  HelpCircle,
  Menu,
} from 'lucide-react';
import { ComponentGate, ComponentId } from '@/lib/rbac';
import { useAuth } from '@/lib/rbac/auth-context';
import { useUserStore } from '@/store/userStore';
import { theme } from './theme';
import apiClient from '@/lib/api';
import { usePathname } from 'next/navigation';
import { toast } from 'sonner';

const PRIMARY_ACCENT = '#06b6d4'; 
const PRIMARY_HOVER = '#0891b2';
const DANGER_COLOR = '#ef4444'; 

const HeaderContainer = styled.header`
  position: fixed;
  top: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${theme.spacing.xs} ${theme.spacing.xs};
  background: ${theme.colors.background};
  border-bottom: 1px solid ${theme.colors.border};
  height: 36px;
  width: calc(100% - 250px); // Adjust for sidebar width
`;

const SearchContainer = styled.div`
  position: relative;
  flex: 1;
  max-width: 480px;
  margin: 0 ${theme.spacing.xs};
`;

const SearchInput = styled.input`
  width: 100%;
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  padding-left: 40px;
  border: none;
  border-radius: ${theme.borderRadius.md};
  background: #f5f5f5;
  font-size: ${theme.typography.fontSizes.sm};
  color: #333;

  &:focus {
    outline: none;
    background: #eeeeee;
    box-shadow: 0 0 0 2px ${PRIMARY_ACCENT}40; 
  }

  &::placeholder {
    color: ${theme.colors.textSecondary};
    opacity: 0.5;
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: ${theme.colors.textSecondary};
  opacity: 0.5;
`;

const ActionsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: ${PRIMARY_ACCENT};
  color: white;
  cursor: pointer;
  transition: background-color ${theme.transitions.default};

  &:hover {
    background: ${PRIMARY_HOVER};
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const IconButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: ${theme.colors.textSecondary};
  cursor: pointer;
  transition: background-color ${theme.transitions.default};

  &:hover {
    background: ${theme.colors.backgroundSecondary};
    color: ${PRIMARY_ACCENT}; 
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const NotificationBadge = styled.div`
  position: relative;
  cursor: pointer;

  span {
    position: absolute;
    top: -8px;
    right: -8px;
    background: ${DANGER_COLOR}; 
    color: white;
    font-size: 8px;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;


const MenuButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  background: none;
  cursor: pointer;
  color: ${theme.colors.textSecondary};

  &:hover {
    color: #333;
  }

  svg {
    width: 24px;
    height: 24px;
  }
`;
const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    width: 20px;
    height: 20px;
    stroke-width: 1.5px;
  }
`;

const LanguageSelector = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  cursor: pointer;
  padding: ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.sm};
  transition: background-color ${theme.transitions.default};

  &:hover {
    background: ${theme.colors.backgroundSecondary};
    color: ${PRIMARY_ACCENT};
    
    span {
        color: ${PRIMARY_ACCENT};
    }
    ${IconWrapper} { 
        svg {
            color: ${PRIMARY_ACCENT};
        }
    }
  }
  span {
    font-size: ${theme.typography.fontSizes.sm};
    color: ${theme.colors.textSecondary};
  }
`;
const UserProfileContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  cursor: pointer;
  padding: ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.sm};
  transition: background-color ${theme.transitions.default};

  &:hover {
    background: ${theme.colors.backgroundSecondary};
  }
`;

const UserAvatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: ${PRIMARY_ACCENT}; 
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: ${theme.typography.fontWeights.bold};
  font-size: ${theme.typography.fontSizes.sm};
`;

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const UserName = styled.span`
  font-size: ${theme.typography.fontSizes.sm};
  font-weight: ${theme.typography.fontWeights.medium};
  color: #333;
`;

const UserRole = styled.span`
  font-size: ${theme.typography.fontSizes.xs};
  color: ${theme.colors.textSecondary};
`;
const DropdownMenu = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  top: 100%;
  right: 0;
  width: 200px;
  background: ${theme.colors.background};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  box-shadow: ${theme.shadows.md};
  z-index: 100;
  display: ${props => (props.$isOpen ? 'block' : 'none')}; 
  margin-top: ${theme.spacing.sm};
`;

const DropdownItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  padding: ${theme.spacing.md};
  color: ${theme.colors.textSecondary};
  transition: background-color ${theme.transitions.default};
  cursor: pointer;

  &:hover {
    background: ${PRIMARY_ACCENT}10; 
    color: ${PRIMARY_ACCENT}; 
    
    svg {
        color: ${PRIMARY_ACCENT};
    }
  }

  &:not(:last-child) {
    border-bottom: 1px solid ${theme.colors.border};
  }
  
  svg {
    color: ${theme.colors.textSecondary};
  }
`;

const SignOutItem = styled(DropdownItem)`
  color: ${DANGER_COLOR}; 
  cursor: pointer;
  user-select: none;

  &:hover {
    background: ${DANGER_COLOR}10;
    color: #b91c1c; 
    
    svg {
        color: #b91c1c;
    }
  }
  
  &:active {
    background: ${DANGER_COLOR}20;
  }
`;
export default function Navbar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [language, setLanguage] = useState('EN');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const { user: storeUser } = useUserStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      // Don't close if clicking on the dropdown menu itself or signout
      const target = e.target as HTMLElement;
      const isSignOutClick = target?.closest('[data-signout]');
      const isDropdownClick = target?.closest('[data-dropdown-menu]');
      
      if (dropdownRef.current && !dropdownRef.current.contains(target as Node) && !isSignOutClick && !isDropdownClick) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Load unread notification count
  useEffect(() => {
    let retryCount = 0;
    const MAX_RETRIES = 3;
    let intervalId: NodeJS.Timeout | null = null;
    
    const loadUnreadCount = async () => {
      try {
        const response = await apiClient.getUnreadCount();
        setUnreadCount(response.data?.unread_count || 0);
        retryCount = 0; // Reset retry count on success
      } catch (err: any) {
        // Only log errors if it's not a network/connection error
        // Network errors are expected when backend is down, so we suppress them
        const isNetworkError = err.code === 'ERR_NETWORK' || 
                               err.message === 'Network Error' ||
                               err.message?.includes('ERR_CONNECTION_REFUSED') ||
                               !err.response;
        
        if (!isNetworkError) {
          // Only log non-network errors (e.g., 401, 403, 500)
          console.error('Failed to load unread count:', err);
        }
        
        // If backend is down, set count to 0 and stop retrying aggressively
        if (isNetworkError && retryCount >= MAX_RETRIES) {
          setUnreadCount(0);
          // Increase interval to 60 seconds if backend is down
          if (intervalId) {
            clearInterval(intervalId);
            intervalId = setInterval(loadUnreadCount, 60000);
          }
        }
        retryCount++;
      }
    };

    if (user) {
      loadUnreadCount();
      // Refresh every 30 seconds (or 60 seconds if backend is down)
      intervalId = setInterval(loadUnreadCount, 30000);
      return () => {
        if (intervalId) clearInterval(intervalId);
      };
    }
  }, [user]);

  // Load language preference from localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'EN';
    setLanguage(savedLanguage);
  }, []);

  const handleAddClick = () => {
    // Context-aware routing based on current path
    if (pathname?.includes('/expenses')) {
      router.push('/expenses/items');
    } else if (pathname?.includes('/revenue')) {
      router.push('/revenue/list');
    } else if (pathname?.includes('/project')) {
      router.push('/project/create');
    } else if (pathname?.includes('/employees')) {
      router.push('/app/employees/create');
    } else if (pathname?.includes('/finance')) {
      router.push('/finance/create');
    } else if (pathname?.includes('/accountants')) {
      router.push('/accountants/create');
    } else if (pathname?.includes('/department')) {
      router.push('/department/create');
    } else {
      // Default to expenses items
      router.push('/expenses/items');
    }
  };

  const handleReportsClick = () => {
    router.push('/report');
  };

  const handleNotificationsClick = () => {
    router.push('/notifications');
  };

  const handleLanguageClick = () => {
    const newLanguage = language === 'EN' ? 'AR' : 'EN';
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
    // Could trigger a language change event here
  };

  const handleProfileClick = () => {
    router.push('/profile');
    setIsDropdownOpen(false);
  };

  const handleSettingsClick = () => {
    router.push('/settings');
    setIsDropdownOpen(false);
  };

  const handleRolesClick = () => {
    router.push('/permissions');
    setIsDropdownOpen(false);
  };
  
  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Sign out clicked'); // Debug log
    
    // Close dropdown immediately
    setIsDropdownOpen(false);
    
    // Show loading toast
    toast.loading('Signing out...', { id: 'signout' });
    
    try {
      // First, call backend logout API to invalidate session
      try {
        await apiClient.logout();
        console.log('Backend logout successful');
      } catch (apiErr: any) {
        console.error('Backend logout error (continuing anyway):', apiErr);
        // Continue with logout even if API call fails
      }
      
      // Then clear store state (which also calls logout but we already did it)
      try {
        const store = useUserStore.getState();
        if (store.logout) {
          // Call store logout to clear state (it will try API again but that's ok)
          await store.logout();
        }
      } catch (storeErr) {
        console.error('Store logout error:', storeErr);
        // Manually clear store state if logout fails - use the store's internal setter
        useUserStore.setState({
          user: null,
          isAuthenticated: false,
          subordinates: [],
          allUsers: [],
          isLoading: false,
          error: null,
        });
      }
      
      // Try auth context logout
      if (logout) {
        try {
          await logout();
        } catch (authErr) {
          console.error('Auth context logout error:', authErr);
        }
      }
      
      // Clear localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('language');
      }
      
      // Show success
      toast.success('Signed out successfully', { id: 'signout' });
      
      // Redirect after a short delay to show success message
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
      
    } catch (error) {
      console.error('Sign out error:', error);
      
      // Even if everything fails, clear local storage and redirect
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('language');
      }
      
      // Clear store state
      try {
        useUserStore.setState({
          user: null,
          isAuthenticated: false,
          subordinates: [],
          allUsers: [],
          isLoading: false,
          error: null,
        });
      } catch (err) {
        console.error('Error clearing store:', err);
      }
      
      toast.success('Signed out', { id: 'signout' });
      
      // Redirect to home page
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
    }
  };
  
  const handleSignOutMouseDown = (e: React.MouseEvent) => {
    // Prevent dropdown from closing when clicking sign out
    e.preventDefault();
    e.stopPropagation();
    // Execute signout immediately on mousedown
    handleSignOut(e);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      // Navigate to a search results page or filter current page
      // For now, we'll just clear and show a message
      // In a full implementation, this would route to a search page
      router.push(`/search?q=${encodeURIComponent(search)}`);
    }
  };

  // Get user data from either auth context or store
  const currentUser = storeUser || user;
  const userName = (currentUser as any)?.name || (currentUser as any)?.username || (currentUser as any)?.email || 'User';
  const initials = userName
    ? userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2)
    : '?';
  
  // Get role display name
  const getRoleDisplayName = (role?: string) => {
    const roleMap: Record<string, string> = {
      admin: 'Administrator',
      finance_manager: 'Finance Manager',
      manager: 'Manager',
      accountant: 'Accountant',
      employee: 'Employee',
    };
    const normalizedRole = (role || '').toLowerCase();
    return roleMap[normalizedRole] || role || 'User';
  };
  
  const displayRole = getRoleDisplayName(currentUser?.role);

  return (
    <HeaderContainer>
      <MenuButton
        onClick={() => {
          console.log('Toggle sidebar');
        }}
        style={{ display: 'none' }} 
      >
        <Menu />
      </MenuButton>
      <SearchContainer>
        <form onSubmit={handleSearch} style={{ width: '100%' }}>
          <SearchIcon>
            <Search size={16} />
          </SearchIcon>
          <SearchInput
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch(e);
              }
            }}
          />
        </form>
      </SearchContainer>

      <ActionsContainer>
        <ComponentGate componentId={ComponentId.EXPENSE_CREATE}>
          <AddButton onClick={handleAddClick} title="Add new item">
            <Plus />
          </AddButton>
        </ComponentGate>
        <ComponentGate componentId={ComponentId.DASHBOARD}>
          <NotificationBadge onClick={handleNotificationsClick}>
            <IconWrapper>
              <Bell />
            </IconWrapper>
            {unreadCount > 0 && (
              <span>{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
          </NotificationBadge>
        </ComponentGate>
        <ComponentGate componentId={ComponentId.REPORT_LIST}>
          <IconButton onClick={handleReportsClick} title="View reports">
            <FileSpreadsheet />
          </IconButton>
        </ComponentGate>
        <LanguageSelector onClick={handleLanguageClick} title="Toggle language">
          <IconWrapper>
            <Globe />
          </IconWrapper>
          <span>{language}</span>
        </LanguageSelector>
        <UserProfileContainer ref={dropdownRef} onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
          <UserAvatar>{initials}</UserAvatar>
          <UserInfo>
            <UserName>{userName}</UserName>
            <UserRole>{displayRole}</UserRole>
          </UserInfo>
        </UserProfileContainer>
        <DropdownMenu 
          data-dropdown-menu="true"
          $isOpen={isDropdownOpen}
          onClick={(e) => {
            // Prevent clicks inside dropdown from closing it
            e.stopPropagation();
          }}
          onMouseDown={(e) => {
            // Prevent mousedown from closing dropdown
            e.stopPropagation();
          }}
        >
          <DropdownItem onClick={handleProfileClick}>
            <User size={16} />
            <span>Profile</span>
          </DropdownItem>
          <DropdownItem onClick={handleSettingsClick}>
            <Settings size={16} />
            <span>Settings</span>
          </DropdownItem>
          <ComponentGate componentId={ComponentId.PERMISSION_EDIT}>
            <DropdownItem onClick={handleRolesClick}>
              <HelpCircle size={16} />
              <span>Role & Permission Management</span>
            </DropdownItem>
          </ComponentGate>
          <SignOutItem 
            data-signout="true"
            onMouseDown={handleSignOutMouseDown}
            onClick={(e) => {
              // Prevent default and stop propagation
              e.preventDefault();
              e.stopPropagation();
            }}
            style={{ cursor: 'pointer' }}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </SignOutItem>
        </DropdownMenu>
      </ActionsContainer>
    </HeaderContainer>
  );
}