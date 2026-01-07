'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import { theme } from '@/components/common/theme';
import PermissionManager from '../../../permissions/PermissionManager';
import { Resource, Action, UserType } from '@/lib/rbac/models';
import { PermissionGate } from '@/lib/rbac/permission-gate';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/common/Tabs';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

// Styled components
const Container = styled.div`
  padding: 24px;
`;

const Title = styled.h1`
  font-size: 24px;
  margin-bottom: 24px;
  color: #333;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
`;

const Card = styled.div`
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.md};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 24px;
  margin-bottom: 24px;
`;

const Message = styled.div`
  padding: 16px;
  background-color: ${theme.colors.background};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  margin-bottom: 24px;
  color: ${theme.colors.textSecondary};
`;

const PermissionManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('admin');
  const router = useRouter();

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const navigateToRoles = () => {
    router.push('/settings/users-roles/roles');
  };

  const navigateToUserRoles = () => {
    router.push('/settings/users-roles/user-roles');
  };

  return (
    <Container>
      <Title>Permission Management</Title>

      <PermissionGate
        resource={Resource.SETTINGS}
        action={Action.UPDATE}
        fallback={
          <Message>
            You do not have permission to access the permission management settings.
          </Message>
        }
      >
        <Card>
          <ButtonGroup>
            <Button onClick={navigateToRoles}>
              Manage Roles
            </Button>
            <Button onClick={navigateToUserRoles}>
              Assign User Roles
            </Button>
          </ButtonGroup>

          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList>
              <TabsTrigger value="admin">Admin</TabsTrigger>
              <TabsTrigger value="finance">Finance Admin</TabsTrigger>
              <TabsTrigger value="accountant">Accountant</TabsTrigger>
              <TabsTrigger value="employee">Employee</TabsTrigger>
            </TabsList>

            <TabsContent value="admin">
              <PermissionManager
                title="Admin Permission Management"
                adminType={UserType.ADMIN}
                managedUserTypes={[
                  UserType.ADMIN,
                  UserType.FINANCE_ADMIN,
                  UserType.ACCOUNTANT,
                  UserType.EMPLOYEE
                ]}
              />
            </TabsContent>

            <TabsContent value="finance">
              <PermissionManager
                title="Finance Admin Permission Management"
                adminType={UserType.FINANCE_ADMIN}
                managedUserTypes={[
                  UserType.ACCOUNTANT,
                  UserType.EMPLOYEE
                ]}
              />
            </TabsContent>

            <TabsContent value="accountant">
              <PermissionManager
                title="Accountant Permission Management"
                adminType={UserType.FINANCE_ADMIN}
                managedUserTypes={[
                  UserType.ACCOUNTANT,
                  UserType.EMPLOYEE
                ]}
              />
            </TabsContent>

            <TabsContent value="employee">
              <div style={{ padding: '24px', textAlign: 'center', color: theme.colors.textSecondary }}>
                <p>Employees have limited permissions and cannot manage other users.</p>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </PermissionGate>
    </Container>
  );
};

export default PermissionManagementPage; 