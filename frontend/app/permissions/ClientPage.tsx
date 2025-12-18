'use client';

import React from 'react';
import PermissionManager from './PermissionManager';
import { UserType } from '@/lib/rbac/models';
import { ComponentGate, ComponentId } from '@/lib/rbac';
import { useAuth } from '@/lib/rbac/auth-context';

export default function PermissionsPage() {
  const { user } = useAuth();
  
  // Determine which user types this admin can manage
  const getManagedUserTypes = (): UserType[] => {
    if (!user) return [];
    
    const userRole = user.role?.toLowerCase();
    
    if (userRole === 'admin') {
      // Admin can manage all user types
      return [UserType.ADMIN, UserType.FINANCE_ADMIN, UserType.ACCOUNTANT, UserType.EMPLOYEE];
    } else if (userRole === 'manager' || userRole === 'finance_manager') {
      // Finance Manager can manage accountants and employees
      return [UserType.ACCOUNTANT, UserType.EMPLOYEE];
    }
    
    return [];
  };

  const managedUserTypes = getManagedUserTypes();
  const adminType = user?.role?.toLowerCase() === 'admin' 
    ? UserType.ADMIN 
    : UserType.FINANCE_ADMIN;

  if (!user || managedUserTypes.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <p>You don&apos;t have permission to manage user permissions.</p>
      </div>
    );
  }

  return (
    <ComponentGate componentId={ComponentId.PERMISSION_VIEW}>
      <PermissionManager
        title="Permission Management"
        adminType={adminType}
        managedUserTypes={managedUserTypes}
      />
    </ComponentGate>
  );
}

