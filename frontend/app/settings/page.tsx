// app/settings/page.tsx
'use client';
import React from 'react';
import styled from 'styled-components';
import Layout from '@/components/common/Layout';
import { ComponentGate } from '@/lib/rbac/use-authorization';
import { ComponentId } from '@/lib/rbac/models';
import { Settings, Users, Globe, Lock } from 'lucide-react';

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
  const [activeTab, setActiveTab] = React.useState('general');

  return (
    <Layout>
      <ComponentGate componentId={ComponentId.SETTINGS_PAGE}>
        <PageContainer>
          <SettingsGrid>
            <Nav>
              <NavItem active={activeTab === 'general'} onClick={() => setActiveTab('general')}>
                <Globe /> General
              </NavItem>
              <NavItem active={activeTab === 'users'} onClick={() => setActiveTab('users')}>
                <Users /> Permissions
              </NavItem>
              <NavItem active={activeTab === 'security'} onClick={() => setActiveTab('security')}>
                <Lock /> Security
              </NavItem>
            </Nav>

            <SettingContent>
              <ContentHeader>
                {activeTab === 'general' && 'General System Settings'}
                {activeTab === 'users' && 'User Permissions & Roles'}
                {activeTab === 'security' && 'Security Configuration'}
              </ContentHeader>
              
              {activeTab === 'general' && <p>System name, currency, and financial year setup.</p>}
              {activeTab === 'users' && <p>Manage user roles and component access (requires ADMIN). This uses the RBAC logic.</p>}
              {activeTab === 'security' && <p>Configure two-factor authentication and password policies.</p>}
            </SettingContent>
          </SettingsGrid>
        </PageContainer>
      </ComponentGate>
      <ComponentGate componentId={ComponentId.SETTINGS_PAGE} fallback={
        <PageContainer>
          <Title><Lock /> Access Denied</Title>
          <p>You do not have the necessary **ADMIN** permissions to view system settings.</p>
        </PageContainer>
      }>
        {/* Rendered only if permission is granted */}
      </ComponentGate>
    </Layout>
  );
};

export default SettingsPage;