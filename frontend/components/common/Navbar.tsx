//components/common/Navbar.tsx
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styled from 'styled-components';
import {
  Search,
  Plus,
  Bell,
  FileSpreadsheet,
  Globe,
  User, 
  Users,
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
import { debounce } from '@/lib/utils';

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
  padding: ${theme.spacing.sm} ${theme.spacing.lg};
  background: ${theme.colors.background};
  border-bottom: 1px solid ${theme.colors.border};
  height: 64px;
  width: calc(100% - 280px);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: width ${theme.transitions.default};
`;

const SearchContainer = styled.div`
  position: relative;
  flex: 1;
  max-width: 480px;
  margin: 0 ${theme.spacing.md};
`;

const SearchInput = styled.input`
  width: 100%;
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  padding-left: 40px;
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  background: ${theme.colors.backgroundSecondary};
  font-size: ${theme.typography.fontSizes.sm};
  color: ${theme.colors.textSecondary};
  transition: all ${theme.transitions.default};

  &:focus {
    outline: none;
    border-color: ${PRIMARY_ACCENT};
    background: ${theme.colors.background};
    box-shadow: 0 0 0 3px ${PRIMARY_ACCENT}15;
  }

  &::placeholder {
    color: ${theme.colors.textSecondary};
    opacity: 0.6;
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: ${theme.colors.textSecondary};
  opacity: 0.6;
  pointer-events: none;
  transition: opacity ${theme.transitions.default};
  
  ${SearchInput}:focus ~ & {
    opacity: 0.8;
    color: ${PRIMARY_ACCENT};
  }
`;

const ActionsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: ${theme.borderRadius.md};
  background: ${PRIMARY_ACCENT};
  color: white;
  cursor: pointer;
  transition: all ${theme.transitions.default};
  box-shadow: 0 2px 4px rgba(6, 182, 212, 0.2);

  &:hover {
    background: ${PRIMARY_HOVER};
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(6, 182, 212, 0.3);
  }

  &:active {
    transform: translateY(0);
  }

  svg {
    width: 18px;
    height: 18px;
    stroke-width: 2.5;
  }
`;

const IconButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: ${theme.borderRadius.md};
  background: transparent;
  color: ${theme.colors.textSecondary};
  cursor: pointer;
  transition: all ${theme.transitions.default};
  position: relative;

  &:hover {
    background: ${theme.colors.backgroundSecondary};
    color: ${PRIMARY_ACCENT};
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  svg {
    width: 18px;
    height: 18px;
    stroke-width: 2;
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
    transition: color ${theme.transitions.default};
  }
`;

const NotificationBadge = styled.div`
  position: relative;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover ${IconWrapper} {
    color: ${PRIMARY_ACCENT};
  }

  span {
    position: absolute;
    top: -6px;
    right: -6px;
    background: ${DANGER_COLOR};
    color: white;
    font-size: 10px;
    font-weight: ${theme.typography.fontWeights.bold};
    min-width: 18px;
    height: 18px;
    padding: 0 4px;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid ${theme.colors.background};
    box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
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
  border-radius: ${theme.borderRadius.sm};
  transition: all ${theme.transitions.default};

  &:hover {
    background: ${theme.colors.backgroundSecondary};
    color: ${theme.colors.textSecondary};
  }

  svg {
    width: 24px;
    height: 24px;
  }
`;

const LanguageSelector = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  cursor: pointer;
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border-radius: ${theme.borderRadius.md};
  transition: all ${theme.transitions.default};
  border: 1px solid transparent;

  &:hover {
    background: ${theme.colors.backgroundSecondary};
    border-color: ${theme.colors.border};
    transform: translateY(-1px);
    
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
    font-weight: ${theme.typography.fontWeights.medium};
    color: ${theme.colors.textSecondary};
    transition: color ${theme.transitions.default};
  }
`;

const UserProfileContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  cursor: pointer;
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border-radius: ${theme.borderRadius.md};
  transition: all ${theme.transitions.default};
  border: 1px solid transparent;

  &:hover {
    background: ${theme.colors.backgroundSecondary};
    border-color: ${theme.colors.border};
  }
`;

const UserAvatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, ${PRIMARY_ACCENT} 0%, ${PRIMARY_HOVER} 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: ${theme.typography.fontWeights.bold};
  font-size: ${theme.typography.fontSizes.sm};
  box-shadow: 0 2px 4px rgba(6, 182, 212, 0.2);
  transition: transform ${theme.transitions.default};
  
  ${UserProfileContainer}:hover & {
    transform: scale(1.05);
  }
`;

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const UserName = styled.span`
  font-size: ${theme.typography.fontSizes.sm};
  font-weight: ${theme.typography.fontWeights.medium};
  color: ${theme.colors.textSecondary};
  line-height: 1.2;
`;

const UserRole = styled.span`
  font-size: ${theme.typography.fontSizes.xs};
  color: ${theme.colors.textSecondary};
  opacity: 0.7;
  line-height: 1.2;
`;
const DropdownMenu = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  top: calc(100% + ${theme.spacing.sm});
  right: 0;
  width: 240px;
  background: ${theme.colors.background};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  opacity: ${props => (props.$isOpen ? 1 : 0)};
  visibility: ${props => (props.$isOpen ? 'visible' : 'hidden')};
  transform: ${props => (props.$isOpen ? 'translateY(0)' : 'translateY(-8px)')};
  transition: all ${theme.transitions.default};
  overflow: hidden;
  
  ${props => props.$isOpen && `
    animation: slideDown 0.2s ease-out;
  `}
  
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const DropdownItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  color: ${theme.colors.textSecondary};
  transition: all ${theme.transitions.default};
  cursor: pointer;
  font-size: ${theme.typography.fontSizes.sm};
  position: relative;

  &:hover {
    background: ${PRIMARY_ACCENT}10;
    color: ${PRIMARY_ACCENT};
    padding-left: ${theme.spacing.xl};
    
    svg {
      color: ${PRIMARY_ACCENT};
      transform: scale(1.1);
    }
  }

  &:not(:last-child) {
    border-bottom: 1px solid ${theme.colors.border};
  }
  
  svg {
    width: 16px;
    height: 16px;
    color: ${theme.colors.textSecondary};
    transition: all ${theme.transitions.default};
    flex-shrink: 0;
  }
  
  span {
    flex: 1;
  }
`;

const SignOutItem = styled(DropdownItem)`
  color: ${DANGER_COLOR};
  border-top: 1px solid ${theme.colors.border};
  margin-top: ${theme.spacing.xs};
  
  &:hover {
    background: ${DANGER_COLOR}10;
    color: #dc2626;
    padding-left: ${theme.spacing.xl};
    
    svg {
      color: #dc2626;
      transform: scale(1.1);
    }
  }
  
  &:active {
    background: ${DANGER_COLOR}20;
  }
  
  svg {
    color: ${DANGER_COLOR};
  }
`;

const NotificationPanel = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  top: calc(100% + ${theme.spacing.sm});
  right: 0;
  width: 380px;
  max-height: 500px;
  background: ${theme.colors.background};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  opacity: ${props => (props.$isOpen ? 1 : 0)};
  visibility: ${props => (props.$isOpen ? 'visible' : 'hidden')};
  transform: ${props => (props.$isOpen ? 'translateY(0)' : 'translateY(-8px)')};
  transition: all ${theme.transitions.default};
  overflow: hidden;
  display: flex;
  flex-direction: column;
  
  ${props => props.$isOpen && `
    animation: slideDown 0.2s ease-out;
  `}
  
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const NotificationPanelHeader = styled.div`
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  border-bottom: 1px solid ${theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: ${theme.colors.backgroundSecondary};
  
  h3 {
    font-size: ${theme.typography.fontSizes.md};
    font-weight: ${theme.typography.fontWeights.bold};
    color: ${theme.colors.textSecondary};
    margin: 0;
  }
  
  span {
    font-size: ${theme.typography.fontSizes.sm};
    color: ${PRIMARY_ACCENT};
    font-weight: ${theme.typography.fontWeights.medium};
  }
`;

const NotificationPanelBody = styled.div`
  flex: 1;
  overflow-y: auto;
  max-height: 400px;
`;

const NotificationItem = styled.div<{ $isRead: boolean }>`
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  border-bottom: 1px solid ${theme.colors.border};
  cursor: pointer;
  transition: all ${theme.transitions.default};
  background: ${props => props.$isRead ? theme.colors.background : 'rgba(6, 182, 212, 0.05)'};
  position: relative;
  
  &:hover {
    background: ${theme.colors.backgroundSecondary};
    padding-left: ${theme.spacing.xl};
  }
  
  &:last-child {
    border-bottom: none;
  }
  
  ${props => !props.$isRead && `
    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 3px;
      background: ${PRIMARY_ACCENT};
    }
  `}
`;

const NotificationItemContent = styled.div`
  display: flex;
  gap: ${theme.spacing.sm};
`;

const NotificationText = styled.div<{ $isRead?: boolean }>`
  flex: 1;
  
  p {
    font-size: ${theme.typography.fontSizes.sm};
    color: ${theme.colors.textSecondary};
    margin: 0 0 ${theme.spacing.xs};
    line-height: 1.4;
    font-weight: ${props => props.$isRead ? theme.typography.fontWeights.medium : theme.typography.fontWeights.bold};
  }
  
  span {
    font-size: ${theme.typography.fontSizes.xs};
    color: ${theme.colors.textSecondary};
    opacity: 0.7;
  }
`;

const NotificationPanelFooter = styled.div`
  padding: ${theme.spacing.sm} ${theme.spacing.lg};
  border-top: 1px solid ${theme.colors.border};
  background: ${theme.colors.backgroundSecondary};
  display: flex;
  justify-content: center;
`;

const ViewAllButton = styled.button`
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  font-size: ${theme.typography.fontSizes.sm};
  font-weight: ${theme.typography.fontWeights.medium};
  color: ${PRIMARY_ACCENT};
  background: transparent;
  border: none;
  cursor: pointer;
  border-radius: ${theme.borderRadius.sm};
  transition: all ${theme.transitions.default};
  
  &:hover {
    background: ${PRIMARY_ACCENT}10;
    color: ${PRIMARY_HOVER};
  }
`;

const EmptyNotifications = styled.div`
  padding: ${theme.spacing.xl};
  text-align: center;
  color: ${theme.colors.textSecondary};
  
  p {
    font-size: ${theme.typography.fontSizes.sm};
    margin: 0;
    opacity: 0.7;
  }
`;

const LoadingNotifications = styled.div`
  padding: ${theme.spacing.xl};
  text-align: center;
  color: ${theme.colors.textSecondary};
  
  p {
    font-size: ${theme.typography.fontSizes.sm};
    margin: 0;
  }
`;
interface Notification {
  id: number;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  title?: string;
  action_url?: string;
}

export default function Navbar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [language, setLanguage] = useState('EN');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationPanelRef = useRef<HTMLDivElement>(null);
  const notificationBadgeRef = useRef<HTMLDivElement>(null);
  const previousUnreadCountRef = useRef<number>(0);
  const lastNotificationIdsRef = useRef<Set<number>>(new Set());
  const { user, logout } = useAuth();
  const { user: storeUser } = useUserStore();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      // Don't close if clicking on the dropdown menu itself or signout
      const target = e.target as HTMLElement;
      const isSignOutClick = target?.closest('[data-signout]');
      const isDropdownClick = target?.closest('[data-dropdown-menu]');
      const isNotificationClick = target?.closest('[data-notification-panel]');
      const isNotificationBadgeClick = target?.closest('[data-notification-badge]');
      
      if (dropdownRef.current && !dropdownRef.current.contains(target as Node) && !isSignOutClick && !isDropdownClick) {
        setIsDropdownOpen(false);
      }
      
      // Close notification panel if clicking outside
      const isNotificationArea = isNotificationClick || isNotificationBadgeClick || 
        (notificationPanelRef.current && notificationPanelRef.current.contains(target as Node)) ||
        (notificationBadgeRef.current && notificationBadgeRef.current.contains(target as Node));
      
      if (!isNotificationArea && isNotificationPanelOpen) {
        setIsNotificationPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isNotificationPanelOpen]);

  // Load unread notification count and detect new notifications
  useEffect(() => {
    let retryCount = 0;
    const MAX_RETRIES = 3;
    let intervalId: NodeJS.Timeout | null = null;
    
    const loadUnreadCount = async () => {
      try {
        const response = await apiClient.getUnreadCount();
        const newCount = response.data?.unread_count || 0;
        const oldCount = previousUnreadCountRef.current;
        
        // If count increased, fetch latest notifications to show popup
        if (newCount > oldCount) {
          try {
            // Fetch latest notifications to get the new one
            const notifResponse = await apiClient.getNotifications(true); // Get latest unread
            const latestNotifs = notifResponse.data || [];
            
            // Find new notifications (not in our last known set)
            const newNotifs = latestNotifs.filter((n: Notification) => !lastNotificationIdsRef.current.has(n.id));
            
            // Show toast for each new notification
            newNotifs.forEach((notification: Notification) => {
              // Add to known notifications set
              lastNotificationIdsRef.current.add(notification.id);
              
              // Show toast notification
              const toastId = toast.info(notification.title || notification.message, {
                description: notification.message,
                duration: 5000,
                action: {
                  label: 'View',
                  onClick: () => {
                    setIsNotificationPanelOpen(true);
                    if (notification.action_url) {
                      router.push(notification.action_url);
                    }
                    toast.dismiss(toastId);
                  }
                }
              });
            });
            
            // Update last known notification IDs
            if (latestNotifs.length > 0) {
              lastNotificationIdsRef.current = new Set(latestNotifs.map((n: Notification) => n.id));
            }
          } catch (notifErr) {
            // If fetching notifications fails, just show a generic toast
            if (newCount > oldCount) {
              const toastId = toast.info('You have new notifications', {
                description: `${newCount - oldCount} new notification${newCount - oldCount > 1 ? 's' : ''}`,
                duration: 4000,
                action: {
                  label: 'View',
                  onClick: () => {
                    setIsNotificationPanelOpen(true);
                    toast.dismiss(toastId);
                  }
                }
              });
            }
          }
        }
        
        previousUnreadCountRef.current = newCount;
        setUnreadCount(newCount);
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
      // Initial load - fetch notifications to populate lastNotificationIds
      const initializeNotifications = async () => {
        try {
          const notifResponse = await apiClient.getNotifications(true);
          const initialNotifs = notifResponse.data || [];
          if (initialNotifs.length > 0) {
            lastNotificationIdsRef.current = new Set(initialNotifs.map((n: Notification) => n.id));
          }
        } catch (err) {
          // Ignore errors on initialization
        }
      };
      
      initializeNotifications();
      loadUnreadCount();
      // Refresh every 30 seconds (or 60 seconds if backend is down)
      intervalId = setInterval(loadUnreadCount, 30000);
      return () => {
        if (intervalId) clearInterval(intervalId);
      };
    }
  }, [user, router]);

  // Load language preference from localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'EN';
    setLanguage(savedLanguage);
  }, []);

  // Extract query parameter value for stable dependency
  const queryParam = searchParams?.get('q') || '';

  // Sync search input with URL query parameter when on search page
  // Only sync when URL changes, not when local search state changes
  useEffect(() => {
    if (pathname === '/search') {
      // Only update if different to avoid unnecessary re-renders
      setSearch(prev => {
        if (prev !== queryParam) {
          return queryParam;
        }
        return prev;
      });
    } else {
      // Clear search when leaving search page (only if it's not already empty)
      setSearch(prev => prev ? '' : prev);
    }
  }, [pathname, queryParam]);

  // Create debounced search navigation function
  const navigateToSearch = useCallback((searchQuery: string) => {
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else if (pathname === '/search') {
      // If on search page and query is empty, stay on search page but clear query
      router.push('/search');
    }
  }, [router, pathname]);

  // Create debounced function with useRef to maintain stability
  const debouncedSearchRef = useRef<ReturnType<typeof debounce> | null>(null);
  
  useEffect(() => {
    debouncedSearchRef.current = debounce(navigateToSearch, 500);
    
    return () => {
      if (debouncedSearchRef.current) {
        debouncedSearchRef.current = null;
      }
    };
  }, [navigateToSearch]);

  // Load notifications when panel opens
  useEffect(() => {
    const loadNotifications = async () => {
      if (isNotificationPanelOpen && user) {
        setLoadingNotifications(true);
        try {
          const response = await apiClient.getNotifications(false); // Get all notifications, not just unread
          const notifs = response.data || [];
          setNotifications(notifs);
          
          // Update unread count based on loaded notifications
          const unreadCountFromList = notifs.filter((n: Notification) => !n.is_read).length;
          setUnreadCount(unreadCountFromList);
        } catch (err: any) {
          console.error('Failed to load notifications:', err);
          setNotifications([]);
        } finally {
          setLoadingNotifications(false);
        }
      }
    };

    loadNotifications();

    // Refresh notifications every 10 seconds when panel is open
    let intervalId: NodeJS.Timeout | null = null;
    if (isNotificationPanelOpen && user) {
      intervalId = setInterval(loadNotifications, 10000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isNotificationPanelOpen, user]);

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
    setIsNotificationPanelOpen(!isNotificationPanelOpen);
    setIsDropdownOpen(false); // Close user dropdown if open
  };

  const handleViewAllNotifications = () => {
    setIsNotificationPanelOpen(false);
    router.push('/notifications');
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      try {
        await apiClient.markNotificationAsRead(notification.id);
        // Update local state
        setNotifications(prev => prev.map(n => 
          n.id === notification.id ? { ...n, is_read: true } : n
        ));
        // Update unread count
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
      }
    }
    setIsNotificationPanelOpen(false);
    router.push('/notifications');
  };

  const formatNotificationDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
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

  const handleUsersClick = () => {
    router.push('/users');
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
    
    // Close dropdown immediately
    setIsDropdownOpen(false);
    
    // Show loading toast
    toast.loading('Signing out...', { id: 'signout' });
    
    try {
      // First, call backend logout API to invalidate session
      try {
        await apiClient.logout();
      } catch (apiErr: any) {
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
    // Immediately navigate on form submit (Enter key)
    if (search.trim()) {
      router.push(`/search?q=${encodeURIComponent(search.trim())}`);
    }
  };

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    
    // Trigger debounced navigation
    if (value.trim()) {
      if (debouncedSearchRef.current) {
        debouncedSearchRef.current(value);
      }
    } else {
      // Clear search immediately if input is empty
      if (pathname === '/search') {
        router.push('/search');
      }
    }
  }, [router, pathname]);

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
            onChange={handleSearchChange}
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
          <div ref={notificationBadgeRef} style={{ position: 'relative' }}>
            <NotificationBadge 
              data-notification-badge="true"
              onClick={handleNotificationsClick}
            >
              <IconWrapper>
                <Bell />
              </IconWrapper>
              {unreadCount > 0 && (
                <span>{unreadCount > 99 ? '99+' : unreadCount}</span>
              )}
            </NotificationBadge>
            <div ref={notificationPanelRef}>
              <NotificationPanel
                data-notification-panel="true"
                $isOpen={isNotificationPanelOpen}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
              <NotificationPanelHeader>
                <h3>Notifications</h3>
                {unreadCount > 0 && (
                  <span>{unreadCount} unread</span>
                )}
              </NotificationPanelHeader>
              <NotificationPanelBody>
                {loadingNotifications ? (
                  <LoadingNotifications>
                    <p>Loading notifications...</p>
                  </LoadingNotifications>
                ) : notifications.length === 0 ? (
                  <EmptyNotifications>
                    <p>No notifications</p>
                  </EmptyNotifications>
                ) : (
                  notifications.slice(0, 5).map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      $isRead={notification.is_read}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <NotificationItemContent>
                        <NotificationText $isRead={notification.is_read}>
                          <p>{notification.title || notification.message}</p>
                          <span>{formatNotificationDate(notification.created_at)}</span>
                        </NotificationText>
                      </NotificationItemContent>
                    </NotificationItem>
                  ))
                )}
              </NotificationPanelBody>
              {notifications.length > 0 && (
                <NotificationPanelFooter>
                  <ViewAllButton onClick={handleViewAllNotifications}>
                    View All Notifications
                  </ViewAllButton>
                </NotificationPanelFooter>
              )}
              </NotificationPanel>
            </div>
          </div>
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
          {currentUser && (
            (currentUser.role?.toLowerCase() === 'admin' || 
             currentUser.role?.toLowerCase() === 'super_admin' || 
             currentUser.role?.toLowerCase() === 'finance_admin' ||
             currentUser.role?.toLowerCase() === 'finance_manager'
            ) && (
              <DropdownItem onClick={handleUsersClick}>
                <Users size={16} />
                <span>Users</span>
              </DropdownItem>
            )
          )}
          {currentUser && (
            (currentUser.role?.toLowerCase() !== 'accountant' && 
             currentUser.role?.toLowerCase() !== 'employee'
            ) && (
              <DropdownItem onClick={handleSettingsClick}>
                <Settings size={16} />
                <span>Settings</span>
              </DropdownItem>
            )
          )}
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