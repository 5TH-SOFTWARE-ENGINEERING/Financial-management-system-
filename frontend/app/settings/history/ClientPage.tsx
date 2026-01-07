'use client';

import { useEffect, useState, useCallback } from 'react';
import styled from 'styled-components';
import {
  History,
  LogIn,
  Activity,
  Shield,
  Calendar,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  DollarSign,
  CreditCard,
  FileText,
  MapPin,
  Monitor,
} from 'lucide-react';
import Layout from '@/components/layout';
import apiClient from '@/lib/api';
import { useAuth } from '@/lib/rbac/auth-context';
import { toast } from 'sonner';

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  background: ${props => props.theme.colors.background};
`;

const ContentContainer = styled.div`
  flex: 1;
  width: 100%;
  max-width: 1200px;
  margin-left: auto;
  margin-right: 0;
  padding: ${props => props.theme.spacing.sm};
`;

const HeaderContainer = styled.div`
  background: linear-gradient(135deg, ${props => props.theme.colors.primary} 0%, ${props => `color-mix(in srgb, ${props.theme.colors.primary}, black 20%)`} 100%);
  color: ${props => props.theme.colors.primaryForeground};
  padding: ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.lg};
  box-shadow: ${props => props.theme.shadows.md};
  border-radius: ${props => props.theme.borderRadius.md};
  border-bottom: 3px solid rgba(255, 255, 255, 0.1);
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: ${props => props.theme.spacing.md};
  
  h1 {
    font-size: clamp(24px, 3vw, 36px);
    font-weight: ${props => props.theme.typography.fontWeights.bold};
    margin: 0;
    color: ${props => props.theme.colors.primaryForeground};
    display: flex;
    align-items: center;
    gap: ${props => props.theme.spacing.md};
  }
  
  p {
    font-size: ${props => props.theme.typography.fontSizes.sm};
    font-weight: ${props => props.theme.typography.fontWeights.medium};
    opacity: 0.9;
    margin: ${props => props.theme.spacing.xs} 0 0;
    color: ${props => props.theme.colors.primaryForeground};
  }
`;

const RefreshButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.lg};
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: ${props => props.theme.borderRadius.md};
  color: ${props => props.theme.colors.primaryForeground};
  font-size: ${props => props.theme.typography.fontSizes.sm};
  font-weight: ${props => props.theme.typography.fontWeights.medium};
  cursor: pointer;
  transition: all ${props => props.theme.transitions.default};
  backdrop-filter: blur(8px);

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.25);
    border-color: rgba(255, 255, 255, 0.5);
    transform: translateY(-1px);
    box-shadow: ${props => props.theme.shadows.sm};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    
    svg {
      animation: spin 0.8s linear infinite;
    }
  }

  svg {
    width: 16px;
    height: 16px;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const TabsContainer = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.lg};
  border-bottom: 2px solid ${props => props.theme.colors.border};
`;

const Tab = styled.button<{ $active: boolean }>`
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  border: none;
  background: transparent;
  color: ${props => props.$active ? props.theme.colors.primary : props.theme.colors.mutedForeground};
  font-size: ${props => props.theme.typography.fontSizes.sm};
  font-weight: ${props => props.$active ? props.theme.typography.fontWeights.bold : props.theme.typography.fontWeights.medium};
  cursor: pointer;
  border-bottom: 2px solid ${props => props.$active ? props.theme.colors.primary : 'transparent'};
  transition: all ${props => props.theme.transitions.default};
  margin-bottom: -2px;

  &:hover {
    color: ${props => props.theme.colors.primary};
  }
`;

const HistoryList = styled.div`
  background: ${props => props.theme.colors.card};
  border-radius: ${props => props.theme.borderRadius.md};
  border: 1px solid ${props => props.theme.colors.border};
  box-shadow: ${props => props.theme.shadows.md};
  overflow: hidden;
`;

const HistoryItem = styled.div`
  padding: ${props => props.theme.spacing.lg};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  transition: all ${props => props.theme.transitions.default};
  
  &:hover {
    background-color: ${props => props.theme.colors.backgroundSecondary};
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const HistoryItemHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const IconWrapper = styled.div<{ $type: string; $success?: boolean }>`
  width: 40px;
  height: 40px;
  border-radius: ${props => props.theme.borderRadius.md};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: ${props => {
    if (props.$type === 'login') {
      return props.$success
        ? `color-mix(in srgb, ${props.theme.colors.primary}, transparent 90%)`
        : `color-mix(in srgb, ${props.theme.colors.error}, transparent 90%)`;
    }
    if (props.$type === 'activity') {
      return `color-mix(in srgb, ${props.theme.colors.primary}, transparent 90%)`;
    }
    return `color-mix(in srgb, ${props.theme.colors.muted}, transparent 90%)`;
  }};
  color: ${props => {
    if (props.$type === 'login') {
      return props.$success ? props.theme.colors.primary : props.theme.colors.error;
    }
    if (props.$type === 'activity') {
      return props.theme.colors.primary;
    }
    return props.theme.colors.textSecondary;
  }};
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const HistoryItemContent = styled.div`
  flex: 1;
`;

const HistoryItemTitle = styled.h3`
  font-size: ${props => props.theme.typography.fontSizes.md};
  font-weight: ${props => props.theme.typography.fontWeights.bold};
  color: ${props => props.theme.colors.text};
  margin: 0 0 ${props => props.theme.spacing.xs};
`;

const HistoryItemMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${props => props.theme.spacing.md};
  font-size: ${props => props.theme.typography.fontSizes.xs};
  color: ${props => props.theme.colors.mutedForeground};
  margin-top: ${props => props.theme.spacing.xs};
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  
  svg {
    width: 14px;
    height: 14px;
    color: ${props => props.theme.colors.mutedForeground};
  }
`;

const EmptyState = styled.div`
  padding: ${props => props.theme.spacing.xxl};
  text-align: center;
  color: ${props => props.theme.colors.mutedForeground};
  
  svg {
    width: 48px;
    height: 48px;
    margin: 0 auto ${props => props.theme.spacing.md};
    opacity: 0.5;
  }
  
  p {
    font-size: ${props => props.theme.typography.fontSizes.md};
    margin: 0;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: ${props => props.theme.spacing.md};
  
  p {
    color: ${props => props.theme.colors.mutedForeground};
    font-size: ${props => props.theme.typography.fontSizes.md};
  }
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid ${props => props.theme.colors.border};
  border-top-color: ${props => props.theme.colors.primary};
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const ErrorBanner = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.lg};
  background-color: ${props => `color-mix(in srgb, ${props.theme.colors.error}, transparent 90%)`};
  border: 1px solid ${props => `color-mix(in srgb, ${props.theme.colors.error}, transparent 70%)`};
  border-radius: ${props => props.theme.borderRadius.md};
  color: ${props => props.theme.colors.error};
  font-size: ${props => props.theme.typography.fontSizes.sm};

  svg {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
  }
`;

// Helper component for styled icons in metadata
const StatusIcon = styled.span<{ $status?: string }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  
  color: ${props => {
    if (props.$status === 'approved' || props.$status === 'success') return props.theme.colors.primary;
    if (props.$status === 'rejected' || props.$status === 'error') return props.theme.colors.error;
    if (props.$status === 'pending' || props.$status === 'warning') return props.theme.colors.warning;
    return props.theme.colors.mutedForeground;
  }};
  
  svg {
    color: currentColor;
  }
`;


interface LoginHistoryItem {
  id: string;
  device: string;
  location: string;
  ip: string;
  date: string;
  success: boolean;
}

interface ActivityItem {
  type: string;
  id: string | number;
  title: string;
  amount?: number;
  date: string;
  status: string;
}

interface AuditLogItem {
  id: number;
  user_id: number;
  action: string;
  resource_type: string;
  resource_id?: number;
  created_at: string;
  ip_address?: string;
  user?: {
    username: string;
    email: string;
  };
}

type TabType = 'login' | 'activity' | 'audit';

export default function HistoryPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('login');
  const [loginHistory, setLoginHistory] = useState<LoginHistoryItem[]>([]);
  const [activityHistory, setActivityHistory] = useState<ActivityItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'super_admin';

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (activeTab === 'login') {
        const response = await apiClient.getVerificationHistory();
        const data = Array.isArray(response.data) ? (response.data as LoginHistoryItem[]) : [];
        setLoginHistory(data);
      } else if (activeTab === 'activity') {
        const response = await apiClient.getDashboardRecentActivity(50);
        const data = Array.isArray(response.data) ? (response.data as ActivityItem[]) : [];
        setActivityHistory(data);
      } else if (activeTab === 'audit' && isAdmin) {
        const response = await apiClient.getAuditLogs({ limit: 100 });
        const data = Array.isArray(response.data)
          ? (response.data as unknown[]).filter((item): item is AuditLogItem => {
            const log = item as Partial<AuditLogItem>;
            return typeof log.id === 'number' && typeof log.user_id === 'number' && typeof log.created_at === 'string' && typeof log.action === 'string' && typeof log.resource_type === 'string';
          })
          : [];
        setAuditLogs(data);
      }
    } catch (err: unknown) {
      const errorMessage =
        typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Failed to load history'
          : err instanceof Error
            ? err.message
            : 'Failed to load history';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [activeTab, isAdmin]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
    toast.success('History refreshed');
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'revenue':
        return <DollarSign />;
      case 'expense':
        return <CreditCard />;
      case 'approval':
        return <FileText />;
      default:
        return <Activity />;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading && !refreshing) {
    return (
      <Layout>
        <PageContainer>
          <ContentContainer>
            <LoadingContainer>
              <Spinner />
              <p>Loading history...</p>
            </LoadingContainer>
          </ContentContainer>
        </PageContainer>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageContainer>
        <ContentContainer>
          <HeaderContainer>
            <HeaderContent>
              <div>
                <h1>
                  <History />
                  History
                </h1>
                <p>View login history, activity logs, and audit trails</p>
              </div>
              <RefreshButton onClick={handleRefresh} disabled={refreshing}>
                <RefreshCw />
                Refresh
              </RefreshButton>
            </HeaderContent>
          </HeaderContainer>

          {error && (
            <ErrorBanner>
              <AlertCircle />
              <span>{error}</span>
            </ErrorBanner>
          )}

          <TabsContainer>
            <Tab $active={activeTab === 'login'} onClick={() => setActiveTab('login')}>
              <LogIn size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              Login History
            </Tab>
            <Tab $active={activeTab === 'activity'} onClick={() => setActiveTab('activity')}>
              <Activity size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              Recent Activity
            </Tab>
            {isAdmin && (
              <Tab $active={activeTab === 'audit'} onClick={() => setActiveTab('audit')}>
                <Shield size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                Audit Logs
              </Tab>
            )}
          </TabsContainer>

          <HistoryList>
            {activeTab === 'login' && (
              <>
                {loginHistory.length === 0 ? (
                  <EmptyState>
                    <LogIn />
                    <p>No login history found</p>
                  </EmptyState>
                ) : (
                  loginHistory.map((item) => (
                    <HistoryItem key={item.id}>
                      <HistoryItemHeader>
                        <IconWrapper $type="login" $success={item.success}>
                          {item.success ? <CheckCircle /> : <XCircle />}
                        </IconWrapper>
                        <HistoryItemContent>
                          <HistoryItemTitle>
                            {item.success ? 'Successful Login' : 'Failed Login Attempt'}
                          </HistoryItemTitle>
                          <HistoryItemMeta>
                            <MetaItem>
                              <Monitor />
                              {item.device || 'Unknown Device'}
                            </MetaItem>
                            <MetaItem>
                              <MapPin />
                              {item.location || 'Unknown Location'}
                            </MetaItem>
                            <MetaItem>
                              <Calendar />
                              {formatDate(item.date)}
                            </MetaItem>
                            <MetaItem>
                              IP: {item.ip || 'N/A'}
                            </MetaItem>
                          </HistoryItemMeta>
                        </HistoryItemContent>
                      </HistoryItemHeader>
                    </HistoryItem>
                  ))
                )}
              </>
            )}

            {activeTab === 'activity' && (
              <>
                {activityHistory.length === 0 ? (
                  <EmptyState>
                    <Activity />
                    <p>No recent activity found</p>
                  </EmptyState>
                ) : (
                  activityHistory.map((item, index) => (
                    <HistoryItem key={`${item.type}-${item.id}-${index}`}>
                      <HistoryItemHeader>
                        <IconWrapper $type="activity">
                          {getActivityIcon(item.type)}
                        </IconWrapper>
                        <HistoryItemContent>
                          <HistoryItemTitle>
                            {item.title || `${item.type.charAt(0).toUpperCase() + item.type.slice(1)} Entry #${item.id}`}
                          </HistoryItemTitle>
                          <HistoryItemMeta>
                            <MetaItem>
                              <Calendar />
                              {formatDate(item.date)}
                            </MetaItem>
                            {item.amount !== undefined && item.amount !== null && (
                              <MetaItem>
                                <DollarSign />
                                ${Math.abs(item.amount).toLocaleString()}
                              </MetaItem>
                            )}
                            <MetaItem>
                              <StatusIcon $status={item.status as any}>
                                {item.status === 'approved' ? (
                                  <CheckCircle size={14} />
                                ) : item.status === 'rejected' ? (
                                  <XCircle size={14} />
                                ) : (
                                  <AlertCircle size={14} />
                                )}
                              </StatusIcon>
                              {item.status?.charAt(0).toUpperCase() + item.status?.slice(1) || 'Pending'}
                            </MetaItem>
                          </HistoryItemMeta>
                        </HistoryItemContent>
                      </HistoryItemHeader>
                    </HistoryItem>
                  ))
                )}
              </>
            )}

            {activeTab === 'audit' && isAdmin && (
              <>
                {auditLogs.length === 0 ? (
                  <EmptyState>
                    <Shield />
                    <p>No audit logs found</p>
                  </EmptyState>
                ) : (
                  auditLogs.map((log) => (
                    <HistoryItem key={log.id}>
                      <HistoryItemHeader>
                        <IconWrapper $type="audit">
                          <Shield />
                        </IconWrapper>
                        <HistoryItemContent>
                          <HistoryItemTitle>
                            {log.action.charAt(0).toUpperCase() + log.action.slice(1)} {log.resource_type}
                            {log.resource_id && ` #${log.resource_id}`}
                          </HistoryItemTitle>
                          <HistoryItemMeta>
                            <MetaItem>
                              <Calendar />
                              {formatDate(log.created_at)}
                            </MetaItem>
                            {log.user && (
                              <MetaItem>
                                User: {log.user.username || log.user.email}
                              </MetaItem>
                            )}
                            {log.ip_address && (
                              <MetaItem>
                                IP: {log.ip_address}
                              </MetaItem>
                            )}
                          </HistoryItemMeta>
                        </HistoryItemContent>
                      </HistoryItemHeader>
                    </HistoryItem>
                  ))
                )}
              </>
            )}
          </HistoryList>
        </ContentContainer>
      </PageContainer>
    </Layout>
  );
}
