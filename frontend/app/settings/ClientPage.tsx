'use client';
import React, { useEffect, useMemo, useState } from 'react';
import styled, { css } from 'styled-components';
import Link from 'next/link';
import { ComponentGate, ComponentId } from '@/lib/rbac';
import { useAuth } from '@/lib/rbac/auth-context';
import { UserType } from '@/lib/rbac/models';
import { Settings, Users, Globe, Lock, Bell, Database, List, History, RefreshCw, Loader2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { theme } from '@/components/common/theme';
import apiClient from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Type definitions for system data and error handling
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
interface SystemStats {
  users?: {
    total?: number;
    active?: number;
    by_role?: Record<string, number>;
  };
  pending_approvals?: number;
  financials?: {
    total_revenue?: number;
    net_profit?: number;
    total_expenses?: number;
  };
  system_health?: string;
}

interface SystemSettings {
  email_configured?: boolean;
  redis_configured?: boolean;
  s3_configured?: boolean;
}

interface SystemHealth {
  database?: 'healthy' | 'unhealthy' | string;
  status?: string;
}


// Icon color mapping for different icon types
const getIconColor = (iconType: string, active: boolean = false): string => {
  if (active) {
    // Active state colors (brighter)
    const activeColors: Record<string, string> = {
      'settings': '#3b82f6',           // Blue
      'users': '#8b5cf6',             // Purple
      'globe': '#06b6d4',             // Cyan
      'lock': '#3b82f6',              // Blue
      'bell': '#f59e0b',              // Amber
      'database': '#3b82f6',           // Blue
      'list': '#6366f1',              // Indigo
      'history': '#8b5cf6',           // Purple
      'refresh-cw': '#06b6d4',        // Cyan
      'loader2': '#3b82f6',           // Blue
      'activity': '#22c55e',          // Green
      'shield-check': '#22c55e',      // Green
      'alert-triangle': '#f59e0b',     // Amber
    };
    return activeColors[iconType] || '#6b7280';
  } else {
    // Inactive state colors (muted but colorful)
    const inactiveColors: Record<string, string> = {
      'settings': '#60a5fa',           // Light Blue
      'users': '#a78bfa',             // Light Purple
      'globe': '#22d3ee',             // Light Cyan
      'lock': '#60a5fa',              // Light Blue
      'bell': '#fbbf24',              // Light Amber
      'database': '#60a5fa',           // Light Blue
      'list': '#818cf8',              // Light Indigo
      'history': '#a78bfa',           // Light Purple
      'refresh-cw': '#22d3ee',         // Light Cyan
      'loader2': '#60a5fa',           // Light Blue
      'activity': '#4ade80',          // Light Green
      'shield-check': '#4ade80',       // Light Green
      'alert-triangle': '#fbbf24',     // Light Amber
    };
    return inactiveColors[iconType] || '#9ca3af';
  }
};

// Icon styled components
const IconWrapper = styled.div<{ $iconType?: string; $active?: boolean; $size?: number }>`
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${props => props.$iconType ? getIconColor(props.$iconType, props.$active || false) : '#6b7280'};
    opacity: ${props => props.$active ? 1 : 0.8};
    transition: all 0.2s ease;
    
    svg {
        width: ${props => props.$size ? `${props.$size}px` : '20px'};
        height: ${props => props.$size ? `${props.$size}px` : '20px'};
        transition: all 0.2s ease;
    }

    &:hover {
        opacity: 1;
        transform: scale(1.1);
    }
`;

const QuickActionIconWrapper = styled(IconWrapper)`
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: rgba(0, 170, 0, 0.1);
    color: ${props => props.$iconType ? getIconColor(props.$iconType, true) : '#10b981'};
`;

const MessageIcon = styled(IconWrapper)`
    margin-right: ${theme.spacing.sm};
`;

const PRIMARY_COLOR = '#10b981'; // Modern emerald green
const ACCENT_BLUE = '#3b82f6';
const TEXT_COLOR_DARK = '#0f172a';
const TEXT_COLOR_MUTED = '#64748b';

const glassBackground = css`
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.3);
`;

const CardShadow = `
  0 4px 6px -1px rgba(0, 0, 0, 0.05),
  0 2px 4px -1px rgba(0, 0, 0, 0.03),
  inset 0 0 0 1px rgba(255, 255, 255, 0.1)
`;

const DashboardHeader = styled.div`
  margin-bottom: ${theme.spacing.xl};
  
  h1 {
    font-size: 28px;
    font-weight: 800;
    color: ${TEXT_COLOR_DARK};
    margin: 0 auto;
    letter-spacing: -0.02em;
  }
  
  p {
    color: ${TEXT_COLOR_MUTED};
    margin-top: 80px auto;
  }
`;

const SettingContent = styled.div`
  ${glassBackground};
  border-radius: 24px;
  box-shadow: ${CardShadow};
  padding: 40px;
  min-height: 400px;
`;

const ContentHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 40px;

  h2 {
    font-size: 24px;
    font-weight: 800;
    color: ${TEXT_COLOR_DARK};
    margin: 0;
    letter-spacing: -0.01em;
  }
`;

const ErrorBanner = styled.div`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: ${theme.borderRadius.md};
  padding: ${theme.spacing.md};
  color: #dc2626;
  margin-bottom: ${theme.spacing.lg};
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  font-size: ${theme.typography.fontSizes.sm};
`;

const LoadingState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${theme.spacing.md};
  min-height: 200px;
  color: ${TEXT_COLOR_MUTED};
`;

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.xl};
`;

const StatCard = styled.div`
  border-radius: 20px;
  padding: 24px;
  background: ${props => props.theme.colors.background};
  border: 1px solid #e2e8f0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05);
    border-color: ${PRIMARY_COLOR}30;
  }
`;

const StatLabel = styled.p`
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  color: ${TEXT_COLOR_MUTED};
  text-transform: uppercase;
  letter-spacing: 0.08em;
`;

const StatValue = styled.p`
  margin: 8px 0 4px 0;
  font-size: 32px;
  font-weight: 800;
  color: ${TEXT_COLOR_DARK};
  letter-spacing: -0.02em;
`;

const StatSubtext = styled.p`
  margin: 0;
  font-size: 13px;
  font-weight: 500;
  color: ${TEXT_COLOR_MUTED};
`;

const SectionHeader = styled.h3`
  font-size: 18px;
  font-weight: 800;
  color: ${TEXT_COLOR_DARK};
  margin: 48px 0 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  letter-spacing: -0.01em;

  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(to right, #e2e8f0, transparent);
  }
`;

const ServiceList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.sm};
`;

const ServiceRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: ${props => props.theme.colors.background};
  border: 1px solid #f1f5f9;
  border-radius: 16px;
  transition: all 0.2s;

  &:hover {
    border-color: ${PRIMARY_COLOR}20;
    background: ${PRIMARY_COLOR}05;
  }

  span {
    font-weight: 600;
    color: ${TEXT_COLOR_DARK};
  }
`;

const StatusPill = styled.span<{ $healthy: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 100px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: ${props => props.$healthy ? '#ecfdf5' : '#fef2f2'};
  color: ${props => props.$healthy ? '#059669' : '#dc2626'};
  border: 1px solid ${props => props.$healthy ? '#10b98130' : '#ef444430'};
`;

const QuickActionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: ${theme.spacing.md};
  margin-top: ${theme.spacing.md};
`;

const QuickActionCard = styled(Link)`
  ${glassBackground};
  border-radius: 18px;
  padding: 24px;
  display: flex;
  gap: 20px;
  align-items: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);

  &:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow: 0 20px 25px -5px rgba(16, 185, 129, 0.1);
    background: ${props => props.theme.colors.background};
    border-color: ${PRIMARY_COLOR}40;
  }
`;


const QuickActionContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.xs};

  h4 {
    margin: 0;
    font-size: ${theme.typography.fontSizes.sm};
    font-weight: ${theme.typography.fontWeights.bold};
  }

  p {
    margin: 0;
    font-size: ${theme.typography.fontSizes.xs};
    color: ${TEXT_COLOR_MUTED};
  }
`;

const RoleList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: ${theme.spacing.md};
`;

const RoleCard = styled.div`
  background: ${props => props.theme.colors.background};
  border: 1px solid #f1f5f9;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s;

  &:hover {
    border-color: ${ACCENT_BLUE}30;
    transform: translateY(-2px);
  }

  strong {
    font-size: 15px;
    font-weight: 700;
    color: ${TEXT_COLOR_DARK};
  }
`;

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  // Allow access for both admin and super_admin roles
  const isAdmin = user?.role?.toLowerCase() === 'admin' ||
    user?.role?.toLowerCase() === 'super_admin' ||
    user?.userType === UserType.ADMIN;

  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [healthStatus, setHealthStatus] = useState<SystemHealth | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSystemData = async () => {
    if (!isAdmin) {
      setSystemStats(null);
      setSystemSettings(null);
      setHealthStatus(null);
      setError(null);
      setSettingsError('System-level insights are limited to administrators.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSettingsError(null);

      const [statsResponse, settingsResponse, healthResponse] = await Promise.allSettled([
        apiClient.getAdminSystemStats(),
        apiClient.getSystemSettings(),
        apiClient.getSystemHealth(),
      ]);

      // Handle stats response
      if (statsResponse.status === 'fulfilled') {
        const stats = statsResponse.value;
        setSystemStats(stats?.data ?? stats);
      } else {
        const err = statsResponse.reason;
        // Check if it's a network/CORS error vs auth error
        if (err?.code === 'ERR_NETWORK' || err?.message?.includes('CORS') || err?.message?.includes('Failed to fetch') || !err?.response) {
          console.error('Backend connection error:', err);
          throw new Error('Unable to connect to backend server. Please ensure the backend is running on http://localhost:8000');
        } else if (err?.response?.status === 401) {
          throw new Error('Authentication required. Please log in again.');
        } else if (err?.response?.status === 403) {
          throw new Error('Access denied. You do not have permission to view system statistics.');
        } else {
          throw err;
        }
      }

      // Handle settings response
      if (settingsResponse.status === 'fulfilled') {
        const settings = settingsResponse.value;
        setSystemSettings(settings?.data ?? settings);
      } else {
        const err = settingsResponse.reason;
        if (err?.response?.status === 403) {
          setSettingsError('System settings are visible only to super administrators.');
        } else if (err?.response?.status === 401) {
          // Don't show error for settings if it's just auth - it's optional
          setSystemSettings(null);
        } else {
          // Only log other errors, don't block the page
          console.warn('Failed to load system settings:', err);
          setSystemSettings(null);
        }
      }

      // Handle health response
      if (healthResponse.status === 'fulfilled') {
        const health = healthResponse.value;
        setHealthStatus(health?.data ?? health);
      } else {
        // Health check is optional, just log and continue
        console.warn('Failed to load system health:', healthResponse.reason);
        setHealthStatus(null);
      }

      // Responses are already handled above in Promise.allSettled
    } catch (err: unknown) {
      let message = 'Failed to load system data';

      // Handle specific error types with type guards
      const error = err as ErrorWithDetails;
      if (error?.code === 'ERR_NETWORK' || error?.message?.includes('Failed to fetch') || error?.message?.includes('ERR_FAILED')) {
        message = 'Unable to connect to backend server. Please ensure the backend is running on http://localhost:8000';
      } else if (error?.message?.includes('CORS')) {
        message = 'CORS error: Backend may not be configured to allow requests from this origin. Check backend CORS settings.';
      } else if (error?.response?.status === 403) {
        message = 'Access denied. You do not have permission to view system statistics.';
      } else if (error?.response?.data?.detail) {
        message = error.response.data.detail;
      } else if (error?.message) {
        message = error.message;
      }

      setError(message);
      toast.error(message);
      console.error('Error loading system data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchSystemData();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const formatNumber = (value?: number) => {
    if (value === null || value === undefined) return '0';
    return value.toLocaleString();
  };

  const formatCurrency = (value?: number) => {
    if (value === null || value === undefined) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const roleDistribution = useMemo(() => {
    const roles = systemStats?.users?.by_role || {};
    return Object.entries(roles).sort((a, b) => (b[1] as number) - (a[1] as number));
  }, [systemStats]);

  const serviceStatuses = useMemo(() => {
    const emailConfigured = systemSettings?.email_configured;
    const redisConfigured = systemSettings?.redis_configured;
    const s3Configured = systemSettings?.s3_configured;

    return [
      {
        label: 'Database',
        status: healthStatus?.database || systemStats?.system_health || 'unknown',
        healthy: (healthStatus?.database || systemStats?.system_health) === 'healthy',
      },
      {
        label: 'Email (SMTP)',
        status: emailConfigured === undefined ? 'unknown' : emailConfigured ? 'configured' : 'missing',
        healthy: !!emailConfigured,
      },
      {
        label: 'Redis Cache',
        status: redisConfigured === undefined ? 'unknown' : redisConfigured ? 'configured' : 'missing',
        healthy: !!redisConfigured,
      },
      {
        label: 'S3 Storage',
        status: s3Configured === undefined ? 'unknown' : s3Configured ? 'configured' : 'missing',
        healthy: !!s3Configured,
      },
    ];
  }, [systemSettings, systemStats, healthStatus]);

  const quickLinks = [
    {
      title: 'General Settings',
      description: 'Update language, theme, and timezone.',
      href: '/settings/general',
      iconType: 'globe' as const,
    },
    {
      title: 'Notification Preferences',
      description: 'Choose how and when you get notified.',
      href: '/settings/notifications',
      iconType: 'bell' as const,
    },
    {
      title: 'Security Controls',
      description: 'Manage 2FA, passwords, and IP restrictions.',
      href: '/settings/security',
      iconType: 'lock' as const,
    },
    {
      title: 'Backup Center',
      description: 'Create and restore system backups.',
      href: '/settings/backup',
      iconType: 'database' as const,
    },
    {
      title: 'Audit Logs',
      description: 'Review recent activity and changes.',
      href: '/settings/logs',
      iconType: 'list' as const,
    },
    {
      title: 'User & Role Management',
      description: 'Assign roles and permissions.',
      href: '/settings/users-roles/user-roles',
      iconType: 'users' as const,
    },
  ];

  return (
    <ComponentGate componentId={ComponentId.SETTINGS_VIEW}>
      <div style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <DashboardHeader style={{ marginBottom: 0 }}>
            <h1>System Overview</h1>
            <p>Real-time metrics and system health indicators.</p>
          </DashboardHeader>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchSystemData}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.8rem',
              borderRadius: '12px',
              padding: '8px 16px',
              fontWeight: '600',
              height: '40px'
            }}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Updating...' : 'Refresh Data'}
          </Button>
        </div>

        {error && (
          <ErrorBanner>
            <MessageIcon $iconType="alert-triangle" $size={20} $active={true}>
              <AlertTriangle size={20} />
            </MessageIcon>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '700', marginBottom: '4px' }}>Connection Error</div>
              <div style={{ opacity: 0.9 }}>{error}</div>
            </div>
          </ErrorBanner>
        )}

        {loading && isAdmin && !systemStats ? (
          <LoadingState>
            <IconWrapper $iconType="loader2" $size={40} $active={true}>
              <Loader2 size={40} className="animate-spin" />
            </IconWrapper>
            <p style={{ fontWeight: '600', fontSize: '16px' }}>Synchronizing system metrics...</p>
          </LoadingState>
        ) : (
          <>
            {isAdmin ? (
              <>
                <StatGrid>
                  <StatCard>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <StatLabel>Total Users</StatLabel>
                        <StatValue>{formatNumber(systemStats?.users?.total)}</StatValue>
                      </div>
                      <IconWrapper $iconType="users" $size={24} $active={true}>
                        <Users size={24} />
                      </IconWrapper>
                    </div>
                    <StatSubtext>{formatNumber(systemStats?.users?.active)} active members</StatSubtext>
                  </StatCard>

                  <StatCard>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <StatLabel>Pending Actions</StatLabel>
                        <StatValue>{formatNumber(systemStats?.pending_approvals)}</StatValue>
                      </div>
                      <IconWrapper $iconType="history" $size={24} $active={true}>
                        <History size={24} />
                      </IconWrapper>
                    </div>
                    <StatSubtext>Awaiting administrative review</StatSubtext>
                  </StatCard>

                  <StatCard>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <StatLabel>Monthly Revenue</StatLabel>
                        <StatValue style={{ color: PRIMARY_COLOR }}>{formatCurrency(systemStats?.financials?.total_revenue)}</StatValue>
                      </div>
                      <IconWrapper $iconType="globe" $size={24} $active={true}>
                        <Globe size={24} />
                      </IconWrapper>
                    </div>
                    <StatSubtext>Net profit: {formatCurrency(systemStats?.financials?.net_profit)}</StatSubtext>
                  </StatCard>

                  <StatCard>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <StatLabel>Operational Costs</StatLabel>
                        <StatValue style={{ color: '#ef4444' }}>{formatCurrency(systemStats?.financials?.total_expenses)}</StatValue>
                      </div>
                      <IconWrapper $iconType="alert-triangle" $size={24} $active={true}>
                        <AlertTriangle size={24} />
                      </IconWrapper>
                    </div>
                    <StatSubtext>Expenditure tracking active</StatSubtext>
                  </StatCard>
                </StatGrid>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                  <div>
                    <SectionHeader>Service Infrastructure</SectionHeader>
                    <ServiceList>
                      {serviceStatuses.map((service) => (
                        <ServiceRow key={service.label}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <IconWrapper
                              $iconType={service.label.toLowerCase().includes('database') ? 'database' :
                                service.label.toLowerCase().includes('email') ? 'bell' :
                                  service.label.toLowerCase().includes('redis') ? 'refresh-cw' : 'globe'}
                              $size={18}
                              $active={true}
                            >
                              {service.label.toLowerCase().includes('database') && <Database size={18} />}
                              {service.label.toLowerCase().includes('email') && <Bell size={18} />}
                              {service.label.toLowerCase().includes('redis') && <RefreshCw size={18} />}
                              {service.label.toLowerCase().includes('s3') && <Globe size={18} />}
                            </IconWrapper>
                            <span>{service.label}</span>
                          </div>
                          <StatusPill $healthy={service.healthy}>
                            {service.healthy ? <ShieldCheck size={14} /> : <AlertTriangle size={14} />}
                            {service.status}
                          </StatusPill>
                        </ServiceRow>
                      ))}
                    </ServiceList>
                  </div>

                  <div>
                    <SectionHeader>Global Accessibility</SectionHeader>
                    <RoleList>
                      {roleDistribution.map(([role, count]) => (
                        <RoleCard key={role}>
                          <div>
                            <strong style={{ textTransform: 'capitalize' }}>{role.replace('_', ' ')}</strong>
                            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: TEXT_COLOR_MUTED }}>System Role</p>
                          </div>
                          <StatValue style={{ fontSize: '24px', margin: 0 }}>{formatNumber(count as number)}</StatValue>
                        </RoleCard>
                      ))}
                    </RoleList>
                  </div>
                </div>
              </>
            ) : (
              <div style={{
                padding: '60px',
                textAlign: 'center',
                background: '#ffffff',
                borderRadius: '24px',
                border: '1px dashed #e2e8f0',
                marginTop: '40px'
              }}>
                <IconWrapper $iconType="lock" $size={48} $active={true} style={{ margin: '0 auto 20px' }}>
                  <Lock size={48} />
                </IconWrapper>
                <h3 style={{ fontWeight: '800', marginBottom: '12px', fontSize: '20px', color: TEXT_COLOR_DARK }}>Administrator Access Only</h3>
                <p style={{ color: TEXT_COLOR_MUTED, maxWidth: '400px', margin: '0 auto', fontSize: '15px', lineHeight: '1.6' }}>
                  Detailed system metrics and infrastructure controls are reserved for administrators.
                  Please use the connection shortcuts below for your personal settings.
                </p>
              </div>
            )}

            <SectionHeader>Control Center Shortcuts</SectionHeader>
            <QuickActionsGrid>
              {quickLinks.map((link) => (
                <QuickActionCard key={link.href} href={link.href}>
                  <QuickActionIconWrapper $iconType={link.iconType} $size={20} $active={true}>
                    {link.iconType === 'globe' && <Globe size={20} />}
                    {link.iconType === 'bell' && <Bell size={20} />}
                    {link.iconType === 'lock' && <Lock size={20} />}
                    {link.iconType === 'database' && <Database size={20} />}
                    {link.iconType === 'list' && <List size={20} />}
                    {link.iconType === 'users' && <Users size={20} />}
                  </QuickActionIconWrapper>
                  <QuickActionContent>
                    <h4>{link.title}</h4>
                    <p>{link.description}</p>
                  </QuickActionContent>
                </QuickActionCard>
              ))}
            </QuickActionsGrid>
          </>
        )}
      </div>
    </ComponentGate>
  );
};

export default SettingsPage;
