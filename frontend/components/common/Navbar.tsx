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

  &:hover {
    background: ${DANGER_COLOR}10;
    color: #b91c1c; 
    
    svg {
        color: #b91c1c;
    }
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
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Load unread notification count
  useEffect(() => {
    const loadUnreadCount = async () => {
      try {
        const response = await apiClient.getUnreadCount();
        setUnreadCount(response.data?.unread_count || 0);
      } catch (err) {
        console.error('Failed to load unread count:', err);
      }
    };

    if (user) {
      loadUnreadCount();
      // Refresh every 30 seconds
      const interval = setInterval(loadUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Load language preference from localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'EN';
    setLanguage(savedLanguage);
  }, []);

  const handleAddClick = () => {
    // Context-aware routing based on current path
    if (pathname?.includes('/app/expenses')) {
      router.push('/app/expenses/create');
    } else if (pathname?.includes('/app/revenue')) {
      router.push('/app/revenue/create');
    } else if (pathname?.includes('/app/project')) {
      router.push('/app/project/create');
    } else if (pathname?.includes('/app/employees')) {
      router.push('/app/employees/create');
    } else if (pathname?.includes('/app/finance')) {
      router.push('/app/finance/create');
    } else if (pathname?.includes('/app/accountants')) {
      router.push('/app/accountants/create');
    } else if (pathname?.includes('/app/department')) {
      router.push('/app/department/create');
    } else {
      // Default to expenses create
      router.push('/app/expenses/create');
    }
  };

  const handleReportsClick = () => {
    router.push('/app/report');
  };

  const handleNotificationsClick = () => {
    router.push('/app/notifications');
  };

  const handleLanguageClick = () => {
    const newLanguage = language === 'EN' ? 'AR' : 'EN';
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
    // Could trigger a language change event here
  };

  const handleProfileClick = () => {
    router.push('/app/profile');
    setIsDropdownOpen(false);
  };

  const handleSettingsClick = () => {
    router.push('/app/settings');
    setIsDropdownOpen(false);
  };

  const handleRolesClick = () => {
    router.push('/app/permissions');
    setIsDropdownOpen(false);
  };
  
  const handleSignOut = () => {
    logout();
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
        <DropdownMenu $isOpen={isDropdownOpen}>
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
          <SignOutItem onClick={handleSignOut}>
            <LogOut size={16} />
            <span>Sign Out</span>
          </SignOutItem>
        </DropdownMenu>
      </ActionsContainer>
    </HeaderContainer>
  );
}