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
  FileText
} from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { formatDate } from '@/lib/utils';
import apiClient from '@/lib/api';
import { toast } from 'sonner';
import Navbar from '@/components/common/Navbar';
import Sidebar from '@/components/common/Sidebar';

// ──────────────────────────────────────────
// Styled Components
// ──────────────────────────────────────────
const LayoutWrapper = styled.div`
  display: flex;
  background: #f5f6fa;
  min-height: 100vh;
`;

const SidebarWrapper = styled.div`
  width: 250px;
  background: var(--card);
  border-right: 1px solid var(--border);
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  overflow-y: auto;

  @media (max-width: 768px) {
    width: auto;
  }
`;

const ContentArea = styled.div`
  flex: 1;
  padding-left: 250px;
  display: flex;
  flex-direction: column;
`;

const InnerContent = styled.div`
  padding: 32px;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  padding: 24px 32px;
  margin-bottom: 24px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
`;

const HeaderText = styled.div`
  h1 {
    font-size: 28px;
    font-weight: 700;
    color: #111827;
    margin-bottom: 4px;
  }
  
  p {
    color: #6b7280;
    font-size: 14px;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  
  ${props => props.$variant === 'primary' ? `
    background: #4f46e5;
    color: white;
    
    &:hover:not(:disabled) {
      background: #4338ca;
    }
  ` : `
    background: #f3f4f6;
    color: #374151;
    
    &:hover:not(:disabled) {
      background: #e5e7eb;
    }
  `}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  padding: 12px 16px;
  margin: 0 32px 24px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #991b1b;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
  padding: 0 32px;
`;

const StatCard = styled.div`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
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
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const StatValue = styled.p<{ $color?: string }>`
  font-size: 24px;
  font-weight: 700;
  color: ${props => props.$color || '#111827'};
`;

const StatIcon = styled.div<{ $bgColor: string; $iconColor: string }>`
  width: 48px;
  height: 48px;
  border-radius: 12px;
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
  padding: 0 32px 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
`;

const FilterSelect = styled.select`
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #ffffff;
  font-size: 14px;
  color: #111827;
  cursor: pointer;
  transition: border-color 0.2s;
  
  &:focus {
    outline: none;
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
  }
`;

const FilterCount = styled.span`
  font-size: 14px;
  color: #6b7280;
`;

const NotificationsList = styled.div`
  padding: 0 32px 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const NotificationCard = styled.div<{ $isRead: boolean; $type: string }>`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
  cursor: pointer;
  
  ${props => !props.$isRead && `
    border-left: 4px solid #4f46e5;
    background: #f9fafb;
  `}
  
  ${props => {
    const colors: Record<string, string> = {
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6'
    };
    return `
      &:hover {
        border-color: ${colors[props.$type] || '#4f46e5'};
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }
    `;
  }}
`;

const NotificationContent = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 16px;
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
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
`;

const NotificationTitle = styled.h3<{ $isRead: boolean }>`
  font-size: 16px;
  font-weight: ${props => props.$isRead ? 500 : 600};
  color: #111827;
  margin: 0;
`;

const NewBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-radius: 12px;
  background: #4f46e5;
  color: white;
`;

const NotificationMessage = styled.p`
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 12px;
  line-height: 1.5;
`;

const NotificationMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
`;

const NotificationTime = styled.span`
  font-size: 12px;
  color: #9ca3af;
`;

const ViewDetailsLink = styled.button`
  font-size: 12px;
  font-weight: 500;
  color: #4f46e5;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  
  &:hover {
    color: #4338ca;
    text-decoration: underline;
  }
`;

const NotificationActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
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
  border-radius: 6px;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s;
  
  &:hover:not(:disabled) {
    background: #f3f4f6;
    color: #111827;
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
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 64px 32px;
  text-align: center;
  
  svg {
    color: #9ca3af;
    width: 48px;
    height: 48px;
    margin: 0 auto 16px;
  }
  
  h3 {
    font-size: 18px;
    font-weight: 600;
    color: #111827;
    margin-bottom: 8px;
  }
  
  p {
    color: #6b7280;
    font-size: 14px;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #f5f6fa;
  
  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #e5e7eb;
    border-top-color: #4f46e5;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  p {
    margin-top: 16px;
    color: #6b7280;
    font-size: 14px;
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
        <div className="spinner" />
        <p>Loading...</p>
      </LoadingContainer>
    );
  }

  if (loading) {
    return (
      <LayoutWrapper>
        <SidebarWrapper>
          <Sidebar />
        </SidebarWrapper>
        <ContentArea>
          <Navbar />
          <LoadingContainer>
            <div className="spinner" />
            <p>Loading notifications...</p>
          </LoadingContainer>
        </ContentArea>
      </LayoutWrapper>
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
    <LayoutWrapper>
      <SidebarWrapper>
        <Sidebar />
      </SidebarWrapper>
      <ContentArea>
        <Navbar />

        <InnerContent>
          <Header>
            <HeaderContent>
              <HeaderText>
                <h1>Notifications</h1>
                <p>Stay updated with important alerts and updates</p>
              </HeaderText>
              <HeaderActions>
                <ActionButton
                  $variant="secondary"
                  onClick={fetchNotifications}
                  disabled={loading}
                >
                  <RefreshCw style={{ width: 16, height: 16 }} />
                  Refresh
                </ActionButton>
                {unreadCount > 0 && (
                  <ActionButton
                    $variant="primary"
                    onClick={markAllAsRead}
                    disabled={processingIds.has(-1)}
                  >
                    <CheckSquare style={{ width: 16, height: 16 }} />
                    Mark All as Read
                  </ActionButton>
                )}
                <ActionButton
                  $variant="secondary"
                  onClick={() => router.push('/settings/notifications')}
                >
                  <Settings style={{ width: 16, height: 16 }} />
                  Settings
                </ActionButton>
              </HeaderActions>
            </HeaderContent>
          </Header>

          {error && (
            <ErrorMessage>
              <AlertCircle size={16} />
              <span>{error}</span>
            </ErrorMessage>
          )}

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
        </InnerContent>
      </ContentArea>
    </LayoutWrapper>
  );
}
