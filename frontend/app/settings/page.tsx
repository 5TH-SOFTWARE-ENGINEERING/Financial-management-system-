'use client';
import React from 'react';
import styled from 'styled-components';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Layout from '@/components/layout';
import { ComponentGate, ComponentId } from '@/lib/rbac';
import { Settings, Users, Globe, Lock, Bell, Database, List, History } from 'lucide-react';
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

const ContentHeader = styled.h2`
  font-size: ${theme.typography.fontSizes.lg};
  font-weight: ${theme.typography.fontWeights.bold};
  color: ${TEXT_COLOR_DARK};
  margin: 0 0 ${theme.spacing.lg};
  padding-bottom: ${theme.spacing.md};
  border-bottom: 2px solid ${theme.colors.border};
`;

const ContentText = styled.p`
  margin: 0 0 ${theme.spacing.md};
  color: ${TEXT_COLOR_MUTED};
  font-size: ${theme.typography.fontSizes.md};
  line-height: 1.6;
`;

const ContentSubtext = styled.p`
  margin: 0;
  color: ${TEXT_COLOR_MUTED};
  font-size: ${theme.typography.fontSizes.sm};
  opacity: 0.8;
`;

const SettingsPage: React.FC = () => {
  const pathname = usePathname();
  
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
                  {activeTab === 'general' && 'General Settings'}
                  {activeTab === 'notifications' && 'Notification Settings'}
                  {activeTab === 'security' && 'Security Settings'}
                  {activeTab === 'users-roles' && 'Users & Roles Management'}
                  {activeTab === 'backup' && 'Backup Management'}
                  {activeTab === 'logs' && 'Audit Logs'}
                  {activeTab === 'history' && 'History'}
                </ContentHeader>
                
                {activeTab === 'general' && (
                  <div>
                    <ContentText>
                      Configure your personal preferences including language, timezone, theme, and display options.
                    </ContentText>
                    <ContentSubtext>
                      Navigate to the General page to manage these settings.
                    </ContentSubtext>
                  </div>
                )}
                {activeTab === 'notifications' && (
                  <div>
                    <ContentText>
                      Manage your notification preferences for different types of alerts and communications.
                    </ContentText>
                    <ContentSubtext>
                      Navigate to the Notifications page to configure these settings.
                    </ContentSubtext>
                  </div>
                )}
                {activeTab === 'security' && (
                  <div>
                    <ContentText>
                      Configure security settings including password change, two-factor authentication, and login activity.
                    </ContentText>
                    <ContentSubtext>
                      Navigate to the Security page to manage these settings.
                    </ContentSubtext>
                  </div>
                )}
                {activeTab === 'users-roles' && (
                  <div>
                    <ContentText>
                      Manage user roles and component access (requires ADMIN). This uses the RBAC logic.
                    </ContentText>
                    <ContentSubtext>
                      Navigate to the Users & Roles page to manage these settings.
                    </ContentSubtext>
                  </div>
                )}
                {activeTab === 'backup' && (
                  <div>
                    <ContentText>
                      Manage system backups, create new backups, restore from backups, and delete old backups.
                    </ContentText>
                    <ContentSubtext>
                      Navigate to the Backup page to manage these settings.
                    </ContentSubtext>
                  </div>
                )}
                {activeTab === 'logs' && (
                  <div>
                    <ContentText>
                      View audit logs of system activities, user actions, and administrative changes.
                    </ContentText>
                    <ContentSubtext>
                      Navigate to the Logs page to view detailed audit logs.
                    </ContentSubtext>
                  </div>
                )}
                {activeTab === 'history' && (
                  <div>
                    <ContentText>
                      View your login history, recent activity logs, and system audit trails. Track all account activities including login attempts, transactions, and administrative actions.
                    </ContentText>
                    <ContentSubtext>
                      Navigate to the History page to view detailed login history, activity logs, and audit trails.
                    </ContentSubtext>
                  </div>
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
