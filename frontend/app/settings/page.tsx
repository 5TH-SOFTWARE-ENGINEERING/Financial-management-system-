// app/settings/page.tsx
'use client';
import React from 'react';
import styled from 'styled-components';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ComponentGate, ComponentId } from '@/lib/rbac';
import { Settings, Users, Globe, Lock, Bell } from 'lucide-react';

const PageContainer = styled.div`
  background: #f8fafc;
  padding: 32px;
  min-height: 100%;
`;

const Title = styled.h1`
  font-size: 32px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 30px;
  display: flex;
  align-items: center;
  gap: 10px;

  svg {
    color: #10B981;
  }
`;

const SettingsGrid = styled.div`
  display: grid;
  grid-template-columns: 250px 1fr;
  gap: 30px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Nav = styled.nav`
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);
  padding: 15px;
  height: fit-content;
`;

const NavItem = styled.a<{ active: boolean }>`
  display: flex;
  align-items: center;
  padding: 12px 15px;
  margin-bottom: 5px;
  border-radius: 8px;
  font-weight: ${props => props.active ? 700 : 500};
  color: ${props => props.active ? '#10B981' : '#4b5563'};
  background: ${props => props.active ? '#f0fdf4' : 'transparent'};
  cursor: pointer;
  text-decoration: none;
  transition: background 0.2s;

  &:hover {
    background: #f0fdf4;
  }

  svg {
    margin-right: 10px;
    width: 20px;
    height: 20px;
  }
`;

const SettingContent = styled.div`
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);
  padding: 30px;
`;

const ContentHeader = styled.h2`
  font-size: 24px;
  color: #0f172a;
  margin-bottom: 20px;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 15px;
`;

const SettingsPage: React.FC = () => {
  const pathname = usePathname();
  const activeTab = pathname?.split('/').pop() || 'general';

  return (
    <ComponentGate componentId={ComponentId.SETTINGS_VIEW}>
        <PageContainer>
          <Title>
            <Settings /> Settings
          </Title>
          <SettingsGrid>
            <Nav>
              <Link href="/settings/general" passHref legacyBehavior>
                <NavItem active={activeTab === 'general'}>
                  <Globe /> General
                </NavItem>
              </Link>
              <Link href="/settings/notifications" passHref legacyBehavior>
                <NavItem active={activeTab === 'notifications'}>
                  <Bell /> Notifications
                </NavItem>
              </Link>
              <Link href="/settings/security" passHref legacyBehavior>
                <NavItem active={activeTab === 'security'}>
                  <Lock /> Security
                </NavItem>
              </Link>
              <Link href="/settings/users-roles/user-roles" passHref legacyBehavior>
                <NavItem active={activeTab === 'users-roles'}>
                  <Users /> Users & Roles
                </NavItem>
              </Link>
            </Nav>

            <SettingContent>
              <ContentHeader>
                {activeTab === 'general' && 'General Settings'}
                {activeTab === 'notifications' && 'Notification Settings'}
                {activeTab === 'security' && 'Security Settings'}
                {activeTab === 'users-roles' && 'Users & Roles Management'}
              </ContentHeader>
              
              {activeTab === 'general' && (
                <div>
                  <p style={{ marginBottom: '1rem', color: '#6b7280' }}>
                    Configure your personal preferences including language, timezone, theme, and display options.
                  </p>
                  <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                    Navigate to the General page to manage these settings.
                  </p>
                </div>
              )}
              {activeTab === 'notifications' && (
                <div>
                  <p style={{ marginBottom: '1rem', color: '#6b7280' }}>
                    Manage your notification preferences for different types of alerts and communications.
                  </p>
                  <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                    Navigate to the Notifications page to configure these settings.
                  </p>
                </div>
              )}
              {activeTab === 'security' && (
                <div>
                  <p style={{ marginBottom: '1rem', color: '#6b7280' }}>
                    Configure security settings including password change, two-factor authentication, and login activity.
                  </p>
                  <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                    Navigate to the Security page to manage these settings.
                  </p>
                </div>
              )}
              {activeTab === 'users-roles' && (
                <div>
                  <p style={{ marginBottom: '1rem', color: '#6b7280' }}>
                    Manage user roles and component access (requires ADMIN). This uses the RBAC logic.
                  </p>
                  <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                    Navigate to the Users & Roles page to manage these settings.
                  </p>
                </div>
              )}
            </SettingContent>
          </SettingsGrid>
        </PageContainer>
      </ComponentGate>
  );
};

export default SettingsPage;