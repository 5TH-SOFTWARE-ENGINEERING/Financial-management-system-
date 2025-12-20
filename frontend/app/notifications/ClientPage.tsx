'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import {
  Bell,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Calendar,
  Trash2,
  CheckSquare,
  Settings,
  RefreshCw,
  FileText,
  Loader2
} from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { useAuth } from '@/lib/rbac/auth-context';
import { formatDate } from '@/lib/utils';
import apiClient from '@/lib/api';
import { toast } from 'sonner';
import Layout from '@/components/layout';
import { theme } from '@/components/common/theme';

const PRIMARY_COLOR = theme.colors.primary || '#00AA00';
const TEXT_COLOR_DARK = '#111827';
const TEXT_COLOR_MUTED = theme.colors.textSecondary || '#666';

// Type definitions for error handling
type ErrorWithDetails = {
  code?: string;
  message?: string;
  response?: {
    status: number;
    data?: {
      detail?: string;
    };
  };
};

const CardShadow = `
  0 2px 4px -1px rgba(0, 0, 0, 0.06),
  0 1px 2px -1px rgba(0, 0, 0, 0.03),
  inset 0 0 0 1px rgba(0, 0, 0, 0.02)
`;
const CardShadowHover = `
  0 8px 12px -2px rgba(0, 0, 0, 0.08),
  0 4px 6px -2px rgba(0, 0, 0, 0.04),
  inset 0 0 0 1px rgba(0, 0, 0, 0.03)
`;

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const ContentContainer = styled.div`
  flex: 1;
  width: 100%;
  max-width: 980px;
  margin-left: auto;
  margin-right: 0;
  padding: ${theme.spacing.sm} ${theme.spacing.sm} ${theme.spacing.sm};
`;

const HeaderContainer = styled.div`
  background: linear-gradient(135deg, ${PRIMARY_COLOR} 0%, #008800 100%);
  color: #ffffff;
  padding: ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.lg};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-radius: ${theme.borderRadius.md};
  border-bottom: 3px solid rgba(255, 255, 255, 0.1);
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: ${theme.spacing.md};
  
  h1 {
    font-size: clamp(24px, 3vw, 36px);
    font-weight: ${theme.typography.fontWeights.bold};
    margin: 0 0 ${theme.spacing.xs};
    color: #ffffff;
  }
  
  p {
    font-size: ${theme.typography.fontSizes.md};
    font-weight: ${theme.typography.fontWeights.medium};
    opacity: 0.9;
    margin: 0;
    color: rgba(255, 255, 255, 0.95);
  }
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  flex-wrap: wrap;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  font-size: ${theme.typography.fontSizes.md};
  font-weight: ${theme.typography.fontWeights.medium};
  border-radius: ${theme.borderRadius.md};
  border: none;
  cursor: pointer;
  transition: all ${theme.transitions.default};
  
  ${props => props.$variant === 'primary' ? `
    background: ${PRIMARY_COLOR};
    color: white;
    
    &:hover:not(:disabled) {
      background: #008800;
      transform: translateY(-1px);
      box-shadow: ${CardShadowHover};
    }
  ` : `
    background: ${theme.colors.backgroundSecondary};
    color: ${TEXT_COLOR_DARK};
    
    &:hover:not(:disabled) {
      background: ${theme.colors.border};
      transform: translateY(-1px);
      box-shadow: ${CardShadowHover};
    }
  `}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const ErrorBanner = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: ${theme.borderRadius.md};
  padding: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.lg};
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  color: #991b1b;
  font-size: ${theme.typography.fontSizes.sm};

  svg {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.lg};
`;

const StatCard = styled.div`
  background: ${theme.colors.background};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  padding: ${theme.spacing.lg};
  box-shadow: ${CardShadow};
  transition: all ${theme.transitions.default};
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${CardShadowHover};
    border-color: ${PRIMARY_COLOR};
  }
`;

const StatContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const StatInfo = styled.div`
  flex: 1;
`;

const StatLabel = styled.p`
  font-size: ${theme.typography.fontSizes.xs};
  font-weight: ${theme.typography.fontWeights.medium};
  color: ${TEXT_COLOR_MUTED};
  margin-bottom: ${theme.spacing.xs};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const StatValue = styled.p<{ $color?: string }>`
  font-size: ${theme.typography.fontSizes.xxl};
  font-weight: ${theme.typography.fontWeights.bold};
  color: ${props => props.$color || TEXT_COLOR_DARK};
`;

const StatIcon = styled.div<{ $bgColor: string; $iconColor: string }>`
  width: 48px;
  height: 48px;
  border-radius: ${theme.borderRadius.md};
  background: ${props => props.$bgColor};
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    color: ${props => props.$iconColor};
    width: 24px;
    height: 24px;
  }
`;

const FiltersContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  flex-wrap: wrap;
  margin-bottom: ${theme.spacing.lg};
`;

const FilterSelect = styled.select`
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  background: ${theme.colors.background};
  font-size: ${theme.typography.fontSizes.md};
  color: ${TEXT_COLOR_DARK};
  cursor: pointer;
  transition: all ${theme.transitions.default};
  
  &:focus {
    outline: none;
    border-color: ${PRIMARY_COLOR};
    box-shadow: 0 0 0 3px rgba(0, 170, 0, 0.1);
  }
`;

const FilterCount = styled.span`
  font-size: ${theme.typography.fontSizes.md};
  color: ${TEXT_COLOR_MUTED};
`;

const NotificationsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
`;

const NotificationCard = styled.div<{ $isRead: boolean; $displayType: string }>`
  background: ${props => props.$isRead ? theme.colors.background : theme.colors.backgroundSecondary};
  border: 1px solid ${theme.colors.border};
  border-left: 4px solid ${props => {
    if (!props.$isRead) return PRIMARY_COLOR;
    const colors: Record<string, string> = {
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6'
    };
    return colors[props.$displayType] || theme.colors.border;
  }};
  border-radius: ${theme.borderRadius.md};
  padding: ${theme.spacing.lg};
  box-shadow: ${CardShadow};
  transition: all ${theme.transitions.default};
  cursor: pointer;
  
  &:hover {
    transform: translateX(4px);
    box-shadow: ${CardShadowHover};
    border-color: ${props => {
      const colors: Record<string, string> = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
      };
      return colors[props.$displayType] || PRIMARY_COLOR;
    }};
  }
`;

const NotificationContent = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${theme.spacing.md};
`;

const NotificationIcon = styled.div<{ $displayType: string }>`
  flex-shrink: 0;
  margin-top: 2px;
  
  ${props => {
    const colors: Record<string, string> = {
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6'
    };
    return `
      svg {
        color: ${colors[props.$displayType] || '#3b82f6'};
        width: 20px;
        height: 20px;
      }
    `;
  }}
`;

const PriorityBadge = styled.span<{ $color: string }>`
  display: inline-flex;
  align-items: center;
  padding: 2px ${theme.spacing.sm};
  font-size: ${theme.typography.fontSizes.xs};
  font-weight: ${theme.typography.fontWeights.bold};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-radius: 12px;
  background: ${props => props.$color}20;
  color: ${props => props.$color};
  border: 1px solid ${props => props.$color}40;
`;

const NotificationDetails = styled.div`
  flex: 1;
  min-width: 0;
`;

const NotificationHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  margin-bottom: ${theme.spacing.sm};
  flex-wrap: wrap;
`;

const NotificationTitle = styled.h3<{ $isRead: boolean }>`
  font-size: ${theme.typography.fontSizes.lg};
  font-weight: ${props => props.$isRead ? theme.typography.fontWeights.medium : theme.typography.fontWeights.bold};
  color: ${TEXT_COLOR_DARK};
  margin: 0;
`;

const NewBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px ${theme.spacing.sm};
  font-size: ${theme.typography.fontSizes.xs};
  font-weight: ${theme.typography.fontWeights.bold};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-radius: 12px;
  background: ${PRIMARY_COLOR};
  color: white;
`;

const NotificationMessage = styled.p`
  font-size: ${theme.typography.fontSizes.md};
  color: ${TEXT_COLOR_MUTED};
  margin-bottom: ${theme.spacing.md};
  line-height: 1.5;
`;

const NotificationMeta = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  flex-wrap: wrap;
`;

const NotificationTime = styled.span`
  font-size: ${theme.typography.fontSizes.sm};
  color: ${TEXT_COLOR_MUTED};
`;

const ViewDetailsLink = styled.button`
  font-size: ${theme.typography.fontSizes.sm};
  font-weight: ${theme.typography.fontWeights.medium};
  color: ${PRIMARY_COLOR};
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  transition: color ${theme.transitions.default};
  
  &:hover {
    color: #008800;
    text-decoration: underline;
  }
`;

const NotificationActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  flex-shrink: 0;
`;

const IconButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: ${theme.borderRadius.md};
  cursor: pointer;
  color: ${TEXT_COLOR_MUTED};
  transition: all ${theme.transitions.default};
  
  &:hover:not(:disabled) {
    background: ${theme.colors.backgroundSecondary};
    color: ${TEXT_COLOR_DARK};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const EmptyState = styled.div`
  background: ${theme.colors.background};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  padding: ${theme.spacing.xxl} ${theme.spacing.xl};
  text-align: center;
  box-shadow: ${CardShadow};
  
  svg {
    color: ${TEXT_COLOR_MUTED};
    width: 48px;
    height: 48px;
    margin: 0 auto ${theme.spacing.md};
    opacity: 0.5;
  }
  
  h3 {
    font-size: ${theme.typography.fontSizes.lg};
    font-weight: ${theme.typography.fontWeights.bold};
    color: ${TEXT_COLOR_DARK};
    margin-bottom: ${theme.spacing.sm};
  }
  
  p {
    color: ${TEXT_COLOR_MUTED};
    font-size: ${theme.typography.fontSizes.md};
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  width: 100%;
  
  p {
    margin-top: ${theme.spacing.md};
    color: ${TEXT_COLOR_MUTED};
    font-size: ${theme.typography.fontSizes.md};
  }
`;

const Spinner = styled(Loader2)`
  width: 40px;
  height: 40px;
  color: ${PRIMARY_COLOR};
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: string; // Backend notification type (approval_request, expense_created, etc.)
  priority: string; // low, medium, high, urgent
  is_read: boolean;
  is_email_sent?: boolean;
  action_url?: string | null;
  created_at: string;
  read_at?: string | null;
  expires_at?: string | null;
  // Computed display type for UI
  display_type?: 'success' | 'error' | 'warning' | 'info';
}

export default function NotificationsPage() {
  const router = useRouter();
  const { user: storeUser, isAuthenticated, isLoading } = useUserStore();
  const { user: authUser } = useAuth();
  const user = storeUser || authUser;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());

  // Role-based access control - all authenticated users can access notifications
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || !user) {
        router.push('/auth/login');
        return;
      }
      
      // Check if user has a valid role
      const userRole = user.role?.toLowerCase();
      const allowedRoles = [
        'admin',
        'super_admin',
        'finance_admin',
        'finance_manager',
        'manager',
        'accountant',
        'employee'
      ];
      
      if (!userRole || !allowedRoles.includes(userRole)) {
        toast.error('Access denied: Insufficient permissions');
        router.push('/dashboard');
        return;
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

  const fetchNotifications = useCallback(async (showLoading: boolean = true) => {
    if (showLoading) {
      setLoading(true);
    }
    setError(null);
    
    try {
      const response = await apiClient.getNotifications();
      // Handle both direct array response and wrapped response
      const notificationsData = Array.isArray(response?.data)
        ? response.data
        : (response?.data && typeof response.data === 'object' && response.data !== null && 'data' in response.data ? (response.data as { data: unknown[] }).data : []);
      
      const apiNotifications = (notificationsData || []).map((notif: unknown) => {
        const notification = notif as { 
          id?: number; 
          user_id?: number;
          message?: string; 
          type?: string; 
          priority?: string;
          created_at?: string; 
          read_at?: string | null;
          expires_at?: string | null;
          is_read?: boolean; 
          is_email_sent?: boolean;
          title?: string; 
          action_url?: string | null;
        };
        const notificationType = notification.type || 'system_alert';
        return {
          id: notification.id || 0,
          user_id: notification.user_id || 0,
          type: notificationType,
          priority: notification.priority || 'medium',
          title: notification.title || 'Notification',
          message: notification.message || '',
          is_read: notification.is_read || false,
          is_email_sent: notification.is_email_sent || false,
          created_at: notification.created_at || new Date().toISOString(),
          read_at: notification.read_at || null,
          expires_at: notification.expires_at || null,
          action_url: notification.action_url || null,
          display_type: mapNotificationType(notificationType),
        };
      });
      
      // Sort by created_at (newest first)
      apiNotifications.sort((a: Notification, b: Notification) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      setNotifications(apiNotifications);
    } catch (err: unknown) {
      const error = err as ErrorWithDetails;
      const errorMessage = error.response?.data?.detail || (error as { message?: string }).message || 'Failed to load notifications';
      setError(errorMessage);
      console.error('Failed to fetch notifications:', err);
      
      // Only show toast on initial load or manual refresh, not on background updates
      if (showLoading) {
        toast.error(errorMessage);
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []);

  const mapNotificationType = (type: string): 'success' | 'error' | 'warning' | 'info' => {
    const normalized = type?.toLowerCase() || 'system_alert';
    
    // Success types - positive outcomes
    if (
      normalized === 'approval_decision' ||
      normalized === 'expense_approved' ||
      normalized === 'revenue_approved' ||
      normalized === 'sale_posted' ||
      normalized === 'forecast_created' ||
      normalized === 'ml_training_complete' ||
      normalized.includes('approved') ||
      normalized.includes('completed') ||
      normalized.includes('confirmed') ||
      normalized.includes('created') && (normalized.includes('user') || normalized.includes('welcome'))
    ) {
      return 'success';
    }
    
    // Error types - negative outcomes that need attention
    if (
      normalized === 'budget_exceeded' ||
      normalized === 'expense_rejected' ||
      normalized === 'revenue_rejected' ||
      normalized.includes('rejected') ||
      normalized.includes('error') ||
      normalized.includes('failed') ||
      normalized.includes('cancelled') ||
      normalized.includes('denied')
    ) {
      return 'error';
    }
    
    // Warning types - high priority items that need attention
    if (
      normalized === 'approval_request' ||
      normalized === 'deadline_reminder' ||
      normalized === 'inventory_low' ||
      normalized === 'expense_created' ||
      normalized === 'revenue_created' ||
      normalized === 'sale_created' ||
      normalized.includes('pending') ||
      normalized.includes('reminder') ||
      normalized.includes('alert') ||
      normalized.includes('required')
    ) {
      return 'warning';
    }
    
    // Info types - general system updates and informational messages
    if (
      normalized === 'system_alert' ||
      normalized === 'expense_updated' ||
      normalized === 'revenue_updated' ||
      normalized === 'inventory_updated' ||
      normalized === 'report_ready' ||
      normalized.includes('updated') ||
      normalized.includes('profile')
    ) {
      return 'info';
    }
    
    // Default to info for unknown types
    return 'info';
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchNotifications(true);
      // Set up real-time updates every 30 seconds (reduced frequency to avoid excessive requests)
      const interval = setInterval(() => {
        fetchNotifications(false); // Don't show loading on background refresh
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user, fetchNotifications]);

  // Auto-refresh when window regains focus (user returns to tab)
  useEffect(() => {
    const handleFocus = () => {
      if (isAuthenticated && user) {
        fetchNotifications(false);
      }
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isAuthenticated, user, fetchNotifications]);

  const markAsRead = async (notificationId: number) => {
    if (processingIds.has(notificationId)) return;
    
    setProcessingIds(prev => new Set(prev).add(notificationId));
    
    try {
      await apiClient.markNotificationAsRead(notificationId);
      
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true }
            : notification
        )
      );
      
      // Don't show toast for individual mark as read to avoid spam
      // toast.success('Notification marked as read');
    } catch (err: unknown) {
      const error = err as ErrorWithDetails;
      const errorMessage = error.response?.data?.detail || (error as { message?: string }).message || 'Failed to mark notification as read';
      toast.error(errorMessage);
      // Refresh on error to ensure consistency
      await fetchNotifications();
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
    }
  };

  const markAllAsRead = async () => {
    if (processingIds.has(-1)) return;
    
    setProcessingIds(prev => new Set(prev).add(-1));
    
    try {
      await apiClient.markAllNotificationsAsRead();
      
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, is_read: true }))
      );
      
      toast.success('All notifications marked as read');
    } catch (err: unknown) {
      const error = err as ErrorWithDetails;
      const errorMessage = error.response?.data?.detail || (error as { message?: string }).message || 'Failed to mark all notifications as read';
      toast.error(errorMessage);
      await fetchNotifications();
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(-1);
        return newSet;
      });
    }
  };

  const deleteNotification = async (notificationId: number) => {
    if (processingIds.has(notificationId)) return;
    
    if (!confirm('Are you sure you want to delete this notification?')) {
      return;
    }
    
    setProcessingIds(prev => new Set(prev).add(notificationId));
    
    try {
      await apiClient.deleteNotification(notificationId);
      
      setNotifications(prev => 
        prev.filter(notification => notification.id !== notificationId)
      );
      
      toast.success('Notification deleted');
    } catch (err: unknown) {
      const error = err as ErrorWithDetails;
      const errorMessage = error.response?.data?.detail || (error as { message?: string }).message || 'Failed to delete notification';
      toast.error(errorMessage);
      await fetchNotifications();
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filterType === 'all') return true;
    if (filterType === 'unread') return !notification.is_read;
    return notification.display_type === filterType;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;
  
  // Calculate stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayCount = notifications.filter(n => {
    const notifDate = new Date(n.created_at);
    notifDate.setHours(0, 0, 0, 0);
    return notifDate.getTime() === today.getTime();
  }).length;
  
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekCount = notifications.filter(n => {
    const notifDate = new Date(n.created_at);
    return notifDate >= weekAgo;
  }).length;

  if (isLoading || !isAuthenticated || !user) {
    return (
      <LoadingContainer>
        <Spinner />
        <p>Loading...</p>
      </LoadingContainer>
    );
  }

  const getNotificationIcon = (displayType?: string, notificationType?: string) => {
    // Use notification type for more specific icons
    const type = notificationType?.toLowerCase() || '';
    
    // Specific icons for certain notification types
    if (type.includes('user') || type.includes('welcome')) {
      return <CheckCircle />;
    }
    if (type.includes('approval') && type.includes('request')) {
      return <AlertCircle />;
    }
    if (type.includes('expense') || type.includes('revenue')) {
      return <FileText />;
    }
    if (type.includes('inventory')) {
      return <AlertCircle />;
    }
    
    // Fallback to display type
    switch (displayType) {
      case 'success':
        return <CheckCircle />;
      case 'error':
        return <XCircle />;
      case 'warning':
        return <AlertCircle />;
      case 'info':
        return <Info />;
      default:
        return <Bell />;
    }
  };
  
  const getPriorityBadge = (priority: string) => {
    const normalized = priority?.toLowerCase() || 'medium';
    switch (normalized) {
      case 'urgent':
        return { text: 'Urgent', color: '#ef4444' };
      case 'high':
        return { text: 'High', color: '#f59e0b' };
      case 'medium':
        return { text: 'Medium', color: '#3b82f6' };
      case 'low':
        return { text: 'Low', color: '#6b7280' };
      default:
        return null;
    }
  };

  return (
    <Layout>
      <PageContainer>
        <ContentContainer>
          <HeaderContainer>
            <HeaderContent>
              <div>
                <h1>Notifications</h1>
                <p>Stay updated with important alerts and updates</p>
              </div>
              <HeaderActions>
                <ActionButton
                  $variant="secondary"
                  onClick={async () => {
                    await fetchNotifications(true);
                    toast.success('Notifications refreshed');
                  }}
                  disabled={loading}
                >
                  <RefreshCw style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
                  Refresh
                </ActionButton>
                {unreadCount > 0 && (
                  <ActionButton
                    $variant="primary"
                    onClick={markAllAsRead}
                    disabled={processingIds.has(-1)}
                  >
                    <CheckSquare />
                    Mark All as Read
                  </ActionButton>
                )}
                {user && (
                  user.role?.toLowerCase() !== 'accountant' && 
                  user.role?.toLowerCase() !== 'employee'
                ) && (
                  <ActionButton
                    $variant="secondary"
                    onClick={() => router.push('/settings/notifications')}
                  >
                    <Settings />
                    Settings
                  </ActionButton>
                )}
              </HeaderActions>
            </HeaderContent>
          </HeaderContainer>

          {error && (
            <ErrorBanner>
              <AlertCircle />
              <span>{error}</span>
            </ErrorBanner>
          )}

          {loading ? (
            <LoadingContainer>
              <Spinner />
              <p>Loading notifications...</p>
            </LoadingContainer>
          ) : (
            <>
              <StatsGrid>
                <StatCard>
                  <StatContent>
                    <StatInfo>
                      <StatLabel>Total</StatLabel>
                      <StatValue>{notifications.length}</StatValue>
                    </StatInfo>
                    <StatIcon $bgColor="#dbeafe" $iconColor="#3b82f6">
                      <Bell />
                    </StatIcon>
                  </StatContent>
                </StatCard>

                <StatCard>
                  <StatContent>
                    <StatInfo>
                      <StatLabel>Unread</StatLabel>
                      <StatValue $color="#f59e0b">{unreadCount}</StatValue>
                    </StatInfo>
                    <StatIcon $bgColor="#fef3c7" $iconColor="#f59e0b">
                      <AlertCircle />
                    </StatIcon>
                  </StatContent>
                </StatCard>

                <StatCard>
                  <StatContent>
                    <StatInfo>
                      <StatLabel>Today</StatLabel>
                      <StatValue $color="#10b981">{todayCount}</StatValue>
                    </StatInfo>
                    <StatIcon $bgColor="#d1fae5" $iconColor="#10b981">
                      <Calendar />
                    </StatIcon>
                  </StatContent>
                </StatCard>

                <StatCard>
                  <StatContent>
                    <StatInfo>
                      <StatLabel>This Week</StatLabel>
                      <StatValue $color="#8b5cf6">{weekCount}</StatValue>
                    </StatInfo>
                    <StatIcon $bgColor="#ede9fe" $iconColor="#8b5cf6">
                      <FileText />
                    </StatIcon>
                  </StatContent>
                </StatCard>
              </StatsGrid>

              <FiltersContainer>
                <FilterSelect
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="all">All Notifications</option>
                  <option value="unread">Unread</option>
                  <option value="success">Success</option>
                  <option value="error">Errors</option>
                  <option value="warning">Warnings</option>
                  <option value="info">Info</option>
                </FilterSelect>
                
                <FilterCount>
                  {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}
                </FilterCount>
              </FiltersContainer>

              <NotificationsList>
                {filteredNotifications.length > 0 ? (
                  filteredNotifications.map((notification) => (
                    <NotificationCard
                      key={notification.id}
                      $isRead={notification.is_read}
                      $displayType={notification.display_type || 'info'}
                      onClick={() => {
                        // Mark as read when clicked
                        if (!notification.is_read) {
                          markAsRead(notification.id);
                        }
                        
                        // Navigate to action URL if available
                        if (notification.action_url) {
                          // Handle both relative and absolute URLs
                          const url = notification.action_url.startsWith('/') 
                            ? notification.action_url 
                            : `/${notification.action_url}`;
                          router.push(url);
                        }
                      }}
                    >
                      <NotificationContent>
                        <NotificationIcon $displayType={notification.display_type || 'info'}>
                          {getNotificationIcon(notification.display_type, notification.type)}
                        </NotificationIcon>
                        <NotificationDetails>
                          <NotificationHeader>
                            <NotificationTitle $isRead={notification.is_read}>
                              {notification.title}
                            </NotificationTitle>
                            {!notification.is_read && <NewBadge>New</NewBadge>}
                            {getPriorityBadge(notification.priority) && (
                              <PriorityBadge $color={getPriorityBadge(notification.priority)!.color}>
                                {getPriorityBadge(notification.priority)!.text}
                              </PriorityBadge>
                            )}
                          </NotificationHeader>
                          <NotificationMessage>{notification.message}</NotificationMessage>
                          <NotificationMeta>
                            <NotificationTime>{formatDate(notification.created_at)}</NotificationTime>
                            {notification.action_url && (
                              <ViewDetailsLink
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Mark as read when viewing details
                                  if (!notification.is_read) {
                                    markAsRead(notification.id);
                                  }
                                  // Handle both relative and absolute URLs
                                  const url = notification.action_url!.startsWith('/') 
                                    ? notification.action_url! 
                                    : `/${notification.action_url!}`;
                                  router.push(url);
                                }}
                              >
                                View Details
                              </ViewDetailsLink>
                            )}
                          </NotificationMeta>
                        </NotificationDetails>
                        <NotificationActions>
                          {!notification.is_read && (
                            <IconButton
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              disabled={processingIds.has(notification.id)}
                              title="Mark as read"
                            >
                              <CheckSquare />
                            </IconButton>
                          )}
                          <IconButton
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            disabled={processingIds.has(notification.id)}
                            title="Delete"
                          >
                            <Trash2 />
                          </IconButton>
                        </NotificationActions>
                      </NotificationContent>
                    </NotificationCard>
                  ))
                ) : (
                  <EmptyState>
                    <Bell />
                    <h3>No notifications</h3>
                    <p>
                      {filterType === 'unread' 
                        ? 'No unread notifications'
                        : 'No notifications match your filter'
                      }
                    </p>
                  </EmptyState>
                )}
              </NotificationsList>
            </>
          )}
        </ContentContainer>
      </PageContainer>
    </Layout>
  );
}
