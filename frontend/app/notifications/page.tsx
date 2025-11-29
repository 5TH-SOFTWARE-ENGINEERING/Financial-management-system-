'use client';

import { useEffect, useState } from 'react';
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
import { formatDate } from '@/lib/utils';
import apiClient from '@/lib/api';
import { toast } from 'sonner';
import Layout from '@/components/layout';
import { theme } from '@/components/common/theme';

const PRIMARY_COLOR = theme.colors.primary || '#00AA00';
const TEXT_COLOR_DARK = '#111827';
const TEXT_COLOR_MUTED = theme.colors.textSecondary || '#666';

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

const NotificationCard = styled.div<{ $isRead: boolean; $type: string }>`
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
    return colors[props.$type] || theme.colors.border;
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
      return colors[props.$type] || PRIMARY_COLOR;
    }};
  }
`;

const NotificationContent = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${theme.spacing.md};
`;

const NotificationIcon = styled.div<{ $type: string }>`
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
        color: ${colors[props.$type] || '#3b82f6'};
        width: 20px;
        height: 20px;
      }
    `;
  }}
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
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  action_url?: string | null;
  notification_type?: string;
  priority?: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useUserStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchNotifications();
      // Set up real-time updates every 15 seconds
      const interval = setInterval(fetchNotifications, 15000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user]);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.getNotifications();
      const apiNotifications = (response.data || []).map((notif: any) => ({
        id: notif.id,
        type: mapNotificationType(notif.notification_type || notif.type || 'info'),
        title: notif.title || 'Notification',
        message: notif.message || notif.content || '',
        is_read: notif.is_read || notif.read || false,
        created_at: notif.created_at || notif.createdAt || new Date().toISOString(),
        action_url: notif.action_url || notif.actionUrl || null,
        notification_type: notif.notification_type,
        priority: notif.priority,
      }));
      
      // Sort by created_at (newest first)
      apiNotifications.sort((a: Notification, b: Notification) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      setNotifications(apiNotifications);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to load notifications';
      setError(errorMessage);
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const mapNotificationType = (type: string): 'success' | 'error' | 'warning' | 'info' => {
    const normalized = type?.toLowerCase() || 'info';
    if (normalized.includes('approval_decision') || normalized.includes('approved') || normalized.includes('success')) {
      return 'success';
    }
    if (normalized.includes('rejected') || normalized.includes('error') || normalized.includes('failed') || normalized.includes('budget_exceeded')) {
      return 'error';
    }
    if (normalized.includes('approval_request') || normalized.includes('pending') || normalized.includes('warning') || normalized.includes('deadline')) {
      return 'warning';
    }
    return 'info';
  };

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
      
      toast.success('Notification marked as read');
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to mark notification as read';
      toast.error(errorMessage);
      fetchNotifications();
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
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to mark all notifications as read';
      toast.error(errorMessage);
      fetchNotifications();
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
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to delete notification';
      toast.error(errorMessage);
      fetchNotifications();
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
    return notification.type === filterType;
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

  const getNotificationIcon = (type: string) => {
    switch (type) {
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
                  onClick={fetchNotifications}
                  disabled={loading}
                >
                  <RefreshCw />
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
                <ActionButton
                  $variant="secondary"
                  onClick={() => router.push('/settings/notifications')}
                >
                  <Settings />
                  Settings
                </ActionButton>
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
                      $type={notification.type}
                      onClick={() => {
                        if (notification.action_url) {
                          router.push(notification.action_url);
                        }
                      }}
                    >
                      <NotificationContent>
                        <NotificationIcon $type={notification.type}>
                          {getNotificationIcon(notification.type)}
                        </NotificationIcon>
                        <NotificationDetails>
                          <NotificationHeader>
                            <NotificationTitle $isRead={notification.is_read}>
                              {notification.title}
                            </NotificationTitle>
                            {!notification.is_read && <NewBadge>New</NewBadge>}
                          </NotificationHeader>
                          <NotificationMessage>{notification.message}</NotificationMessage>
                          <NotificationMeta>
                            <NotificationTime>{formatDate(notification.created_at)}</NotificationTime>
                            {notification.action_url && (
                              <ViewDetailsLink
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(notification.action_url!);
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
