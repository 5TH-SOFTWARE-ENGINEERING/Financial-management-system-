'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
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
  color: ${props => props.theme.colors.text};
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
`;

const Card = styled.div`
  background: ${props => props.theme.colors.card};
  border-radius: ${props => props.theme.borderRadius.md};
  box-shadow: ${props => props.theme.shadows.sm};
  border: 1px solid ${props => props.theme.colors.border};
  padding: 24px;
  margin-bottom: 24px;
`;

const Message = styled.div`
  padding: 16px;
  background-color: ${props => props.theme.colors.background};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  margin-bottom: 24px;
  color: ${props => props.theme.colors.mutedForeground};
`;

const EmployeeMessage = styled.div`
  padding: 24px;
  text-align: center;
  color: ${props => props.theme.colors.mutedForeground};
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
              <EmployeeMessage>
                <p>Employees have limited permissions and cannot manage other users.</p>
              </EmployeeMessage>
            </TabsContent>
          </Tabs>
        </Card>
      </PermissionGate>
    </Container>
  );
};

export default PermissionManagementPage; 