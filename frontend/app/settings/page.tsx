'use client';
import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Layout from '@/components/layout';
import { ComponentGate, ComponentId } from '@/lib/rbac';
import { useAuth } from '@/lib/rbac/auth-context';
import { UserType } from '@/lib/rbac/models';
import { Settings, Users, Globe, Lock, Bell, Database, List, History, RefreshCw, Loader2, Activity, ShieldCheck, AlertTriangle } from 'lucide-react';
import { theme } from '@/components/common/theme';
import apiClient from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

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
  
  h1 {
    font-size: clamp(24px, 3vw, 36px);
    font-weight: ${theme.typography.fontWeights.bold};
    margin: 0;
    color: #ffffff;
    display: flex;
    align-items: center;
    gap: ${theme.spacing.md};
  }

  svg {
    width: 32px;
    height: 32px;
  }
`;

const SettingsGrid = styled.div`
  display: grid;
  grid-template-columns: 250px 1fr;
  gap: ${theme.spacing.xl};
  max-width: 1200px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: ${theme.spacing.lg};
  }
`;

const Nav = styled.nav`
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  box-shadow: ${CardShadow};
  padding: ${theme.spacing.md};
  height: fit-content;
  transition: box-shadow ${theme.transitions.default};

  &:hover {
    box-shadow: ${CardShadowHover};
  }
`;

const NavItem = styled(Link)<{ $active: boolean }>`
  display: flex;
  align-items: center;
  padding: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.xs};
  border-radius: ${theme.borderRadius.md};
  font-weight: ${props => props.$active ? theme.typography.fontWeights.bold : theme.typography.fontWeights.medium};
  color: ${props => props.$active ? PRIMARY_COLOR : TEXT_COLOR_MUTED};
  background: ${props => props.$active ? 'rgba(0, 170, 0, 0.1)' : 'transparent'};
  cursor: pointer;
  text-decoration: none;
  transition: all ${theme.transitions.default};
  border-left: 3px solid ${props => props.$active ? PRIMARY_COLOR : 'transparent'};

  &:hover {
    background: rgba(0, 170, 0, 0.05);
    color: ${PRIMARY_COLOR};
    transform: translateX(3px);
  }

  svg {
    margin-right: ${theme.spacing.sm};
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }
`;

const SettingContent = styled.div`
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  box-shadow: ${CardShadow};
  padding: ${theme.spacing.xl};
  transition: box-shadow ${theme.transitions.default};

  &:hover {
    box-shadow: ${CardShadowHover};
  }
`;

const ContentHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.spacing.md};
  border-bottom: 2px solid ${theme.colors.border};
  padding-bottom: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.lg};

  h2 {
    font-size: ${theme.typography.fontSizes.lg};
    font-weight: ${theme.typography.fontWeights.bold};
    color: ${TEXT_COLOR_DARK};
    margin: 0;
  }
`;

const ErrorBanner = styled.div`
  background: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: ${theme.borderRadius.md};
  padding: ${theme.spacing.md};
  color: #b91c1c;
  margin-bottom: ${theme.spacing.lg};
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
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
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  padding: ${theme.spacing.lg};
  box-shadow: ${CardShadow};
  background: ${theme.colors.background};
`;

const StatLabel = styled.p`
  margin: 0;
  font-size: ${theme.typography.fontSizes.sm};
  color: ${TEXT_COLOR_MUTED};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const StatValue = styled.p`
  margin: ${theme.spacing.xs} 0 0 0;
  font-size: clamp(1.8rem, 2.5vw, 2.4rem);
  font-weight: ${theme.typography.fontWeights.bold};
  color: ${TEXT_COLOR_DARK};
`;

const StatSubtext = styled.p`
  margin: ${theme.spacing.xs} 0 0 0;
  font-size: ${theme.typography.fontSizes.sm};
  color: ${TEXT_COLOR_MUTED};
`;

const SectionHeader = styled.h3`
  font-size: ${theme.typography.fontSizes.md};
  font-weight: ${theme.typography.fontWeights.bold};
  color: ${TEXT_COLOR_DARK};
  margin: ${theme.spacing.xl} 0 ${theme.spacing.md};
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
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
`;

const StatusPill = styled.span<{ $healthy: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: ${theme.spacing.xs};
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  border-radius: 999px;
  font-size: ${theme.typography.fontSizes.xs};
  font-weight: ${theme.typography.fontWeights.medium};
  background: ${props => props.$healthy ? '#d1fae5' : '#fee2e2'};
  color: ${props => props.$healthy ? '#166534' : '#b91c1c'};
`;

const QuickActionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: ${theme.spacing.md};
  margin-top: ${theme.spacing.md};
`;

const QuickActionCard = styled(Link)`
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  padding: ${theme.spacing.lg};
  display: flex;
  gap: ${theme.spacing.md};
  align-items: flex-start;
  text-decoration: none;
  color: ${TEXT_COLOR_DARK};
  background: ${theme.colors.background};
  transition: transform ${theme.transitions.default}, box-shadow ${theme.transitions.default};

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${CardShadowHover};
  }
`;

const QuickActionIcon = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(0, 170, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${PRIMARY_COLOR};
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
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  padding: ${theme.spacing.md};
  background: ${theme.colors.background};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const SettingsPage: React.FC = () => {
  const pathname = usePathname();
  const { user } = useAuth();
  // Allow access for both admin and super_admin roles
  const isAdmin = user?.role?.toLowerCase() === 'admin' || 
                  user?.role?.toLowerCase() === 'super_admin' ||
                  user?.userType === UserType.ADMIN;

  const [systemStats, setSystemStats] = useState<any>(null);
  const [systemSettings, setSystemSettings] = useState<any>(null);
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Determine active tab based on pathname
  const getActiveTab = () => {
    if (!pathname) return 'general';
    if (pathname.includes('/history')) return 'history';
    if (pathname.includes('/logs')) return 'logs';
    if (pathname.includes('/backup')) return 'backup';
    if (pathname.includes('/users-roles')) return 'users-roles';
    if (pathname.includes('/security')) return 'security';
    if (pathname.includes('/notifications')) return 'notifications';
    if (pathname.includes('/general')) return 'general';
    return 'general';
  };
  
  const activeTab = getActiveTab();

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
    } catch (err: any) {
      let message = 'Failed to load system data';
      
      // Handle specific error types
      if (err?.code === 'ERR_NETWORK' || err?.message?.includes('Failed to fetch') || err?.message?.includes('ERR_FAILED')) {
        message = 'Unable to connect to backend server. Please ensure the backend is running on http://localhost:8000';
      } else if (err?.message?.includes('CORS')) {
        message = 'CORS error: Backend may not be configured to allow requests from this origin. Check backend CORS settings.';
      } else if (err?.response?.status === 403) {
        message = 'Access denied. You do not have permission to view system statistics.';
      } else if (err?.response?.data?.detail) {
        message = err.response.data.detail;
      } else if (err?.message) {
        message = err.message;
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
      icon: <Globe size={16} />,
    },
    {
      title: 'Notification Preferences',
      description: 'Choose how and when you get notified.',
      href: '/settings/notifications',
      icon: <Bell size={16} />,
    },
    {
      title: 'Security Controls',
      description: 'Manage 2FA, passwords, and IP restrictions.',
      href: '/settings/security',
      icon: <Lock size={16} />,
    },
    {
      title: 'Backup Center',
      description: 'Create and restore system backups.',
      href: '/settings/backup',
      icon: <Database size={16} />,
    },
    {
      title: 'Audit Logs',
      description: 'Review recent activity and changes.',
      href: '/settings/logs',
      icon: <List size={16} />,
    },
    {
      title: 'User & Role Management',
      description: 'Assign roles and permissions.',
      href: '/settings/users-roles/user-roles',
      icon: <Users size={16} />,
    },
  ];

  return (
    <ComponentGate componentId={ComponentId.SETTINGS_VIEW}>
      <Layout>
        <PageContainer>
          <ContentContainer>
            <HeaderContainer>
              <h1>
                <Settings />
                Settings
              </h1>
            </HeaderContainer>
            <SettingsGrid>
              <Nav>
                <NavItem href="/settings/general" $active={activeTab === 'general'}>
                  <Globe />
                  General
                </NavItem>
                <NavItem href="/settings/notifications" $active={activeTab === 'notifications'}>
                  <Bell />
                  Notifications
                </NavItem>
                <NavItem href="/settings/security" $active={activeTab === 'security'}>
                  <Lock />
                  Security
                </NavItem>
                <NavItem href="/settings/users-roles/user-roles" $active={activeTab === 'users-roles'}>
                  <Users />
                  Users & Roles
                </NavItem>
                <NavItem href="/settings/backup" $active={activeTab === 'backup'}>
                  <Database />
                  Backup
                </NavItem>
                <NavItem href="/settings/logs" $active={activeTab === 'logs'}>
                  <List />
                  Logs
                </NavItem>
                <NavItem href="/settings/history" $active={activeTab === 'history'}>
                  <History />
                  History
                </NavItem>
              </Nav>

              <SettingContent>
                <ContentHeader>
                  <h2>System Overview</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchSystemData}
                    disabled={loading}
                  >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    {loading ? 'Refreshing' : 'Refresh'}
                  </Button>
                </ContentHeader>

                {error && (
                  <ErrorBanner>
                    <AlertTriangle size={18} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', marginBottom: theme.spacing.xs }}>{error}</div>
                      {error.includes('Unable to connect to backend server') && (
                        <div style={{ fontSize: theme.typography.fontSizes.sm, marginTop: theme.spacing.xs, opacity: 0.9 }}>
                          To start the backend server, navigate to the backend directory and run:
                          <code style={{ 
                            display: 'block', 
                            marginTop: theme.spacing.xs, 
                            padding: theme.spacing.sm, 
                            background: 'rgba(0, 0, 0, 0.1)', 
                            borderRadius: theme.borderRadius.sm,
                            fontFamily: 'monospace',
                            fontSize: theme.typography.fontSizes.xs
                          }}>
                            uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
                          </code>
                        </div>
                      )}
                    </div>
                  </ErrorBanner>
                )}

                {loading && isAdmin && !systemStats ? (
                  <LoadingState>
                    <Loader2 size={28} className="animate-spin" />
                    <p>Loading settings data...</p>
                  </LoadingState>
                ) : (
                  <>
                    {isAdmin ? (
                      <>
                        <StatGrid>
                          <StatCard>
                            <StatLabel>Total Users</StatLabel>
                            <StatValue>{formatNumber(systemStats?.users?.total)}</StatValue>
                            <StatSubtext>{formatNumber(systemStats?.users?.active)} active users</StatSubtext>
                          </StatCard>
                          <StatCard>
                            <StatLabel>Pending Approvals</StatLabel>
                            <StatValue>{formatNumber(systemStats?.pending_approvals)}</StatValue>
                            <StatSubtext>Awaiting review</StatSubtext>
                          </StatCard>
                          <StatCard>
                            <StatLabel>Revenue (30d)</StatLabel>
                            <StatValue>{formatCurrency(systemStats?.financials?.total_revenue)}</StatValue>
                            <StatSubtext>Net {formatCurrency(systemStats?.financials?.net_profit)}</StatSubtext>
                          </StatCard>
                          <StatCard>
                            <StatLabel>Expenses (30d)</StatLabel>
                            <StatValue>{formatCurrency(systemStats?.financials?.total_expenses)}</StatValue>
                            <StatSubtext>Updated daily</StatSubtext>
                          </StatCard>
                        </StatGrid>

                        <SectionHeader>Service Status</SectionHeader>
                        <ServiceList>
                          {serviceStatuses.map((service) => (
                            <ServiceRow key={service.label}>
                              <span>{service.label}</span>
                              <StatusPill $healthy={service.healthy}>
                                {service.healthy ? <ShieldCheck size={14} /> : <AlertTriangle size={14} />}
                                {service.status}
                              </StatusPill>
                            </ServiceRow>
                          ))}
                        </ServiceList>
                        {settingsError && (
                          <StatSubtext style={{ marginTop: theme.spacing.sm }}>
                            {settingsError}
                          </StatSubtext>
                        )}

                        <SectionHeader>Role Distribution</SectionHeader>
                        <RoleList>
                          {roleDistribution.map(([role, count]) => (
                            <RoleCard key={role}>
                              <div>
                                <strong style={{ textTransform: 'capitalize' }}>{role.replace('_', ' ')}</strong>
                              </div>
                              <StatValue style={{ fontSize: '1.5rem', margin: 0 }}>{formatNumber(count as number)}</StatValue>
                            </RoleCard>
                          ))}
                        </RoleList>
                      </>
                    ) : (
                      <ErrorBanner>
                        <AlertTriangle size={18} />
                        System-level metrics are visible only to administrators. Use the quick links below to manage your settings directly.
                      </ErrorBanner>
                    )}

                    <SectionHeader>Quick Actions</SectionHeader>
                    <QuickActionsGrid>
                      {quickLinks.map((link) => (
                        <QuickActionCard key={link.href} href={link.href}>
                          <QuickActionIcon>{link.icon}</QuickActionIcon>
                          <QuickActionContent>
                            <h4>{link.title}</h4>
                            <p>{link.description}</p>
                          </QuickActionContent>
                        </QuickActionCard>
                      ))}
                    </QuickActionsGrid>
                  </>
                )}
              </SettingContent>
            </SettingsGrid>
          </ContentContainer>
        </PageContainer>
      </Layout>
    </ComponentGate>
  );
};

export default SettingsPage;
