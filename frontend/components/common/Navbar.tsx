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
import { theme } from './theme';

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
  color: ${theme.colors.textPrimary};

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
  color: ${props => props.theme.colors.background};
  cursor: pointer;
  transition: background-color ${props => props.theme.transitions.default};

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
    background: ${theme.colors.inputBg};
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
    color: ${theme.colors.textPrimary};
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
    background: ${theme.colors.inputBg};
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
    background: ${theme.colors.inputBg};
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
  color: ${props => props.theme.colors.background}; /* White text on accent color */
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
  color: ${theme.colors.textPrimary};
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
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const router = useRouter();
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleAddClick = () => {
    router.push('/finance/entries/create');
  };

  const handleReportsClick = () => {
    router.push('/finance/reports');
  };

  const handleNotificationsClick = () => {
    console.log('Open notifications');
  };

  const handleLanguageClick = () => {
    console.log('Toggle language');
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
    router.push('/settings/roles');
    setIsDropdownOpen(false);
  };
  
  const handleSignOut = () => {
    logout();
  };
  const userName = user?.name || user?.username;
  const initials = userName
    ? userName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
    : '?';
  const displayRole = user?.role ?? user?.userType ?? 'User';

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
        <SearchIcon>
          <Search size={16} />
        </SearchIcon>
        <SearchInput
          placeholder="Search finance data..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </SearchContainer>

      <ActionsContainer>
        <ComponentGate componentId={ComponentId.FINANCE_CREATE}>
          <AddButton onClick={handleAddClick}>
            <Plus />
          </AddButton>
        </ComponentGate>
        <ComponentGate componentId={ComponentId.DASHBOARD}>
          <NotificationBadge onClick={handleNotificationsClick}>
            <IconWrapper>
              <Bell />
            </IconWrapper>
            <span>4</span>
          </NotificationBadge>
        </ComponentGate>
        <ComponentGate componentId={ComponentId.REPORT_VIEW}>
          <IconButton onClick={handleReportsClick}>
            <FileSpreadsheet />
          </IconButton>
        </ComponentGate>
        <LanguageSelector onClick={handleLanguageClick}>
          <IconWrapper>
            <Globe />
          </IconWrapper>
          <span>EN</span>
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
          <ComponentGate componentId={ComponentId.PERMISSIONS_MANAGE}>
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