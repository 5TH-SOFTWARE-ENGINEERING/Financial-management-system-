// lib/rabc/persmission-gate.tsx
'use client';

import React, { ReactNode } from 'react';
import { useAuthorization } from './use-authorization';
import { Resource, Action, UserType } from './models';

interface PermissionGateProps {
  children: ReactNode;
  resource: Resource;
  action: Action;
  fallback?: ReactNode;
}

/**
 * A component that conditionally renders its children based on whether
 * the user has permission to perform an action on a resource
 */
export const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  resource,
  action,
  fallback
}) => {
  const { hasPermission } = useAuthorization();

  if (!hasPermission(resource, action)) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
};

interface RoleGateProps {
  children: ReactNode;
  roles: string[];
  fallback?: ReactNode;
  requireAll?: boolean;
}

/**
 * A component that conditionally renders its children based on whether
 * the user has one or all of the specified roles
 */
export const RoleGate: React.FC<RoleGateProps> = ({
  children,
  roles,
  fallback,
  requireAll = false
}) => {
  const { hasRole } = useAuthorization();

  const authorized = requireAll
    ? roles.every(role => hasRole(role))
    : roles.some(role => hasRole(role));

  if (!authorized) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
};

interface UserTypeGateProps {
  children: ReactNode;
  userTypes: UserType[];
  fallback?: ReactNode;
  requireAll?: boolean;
}

/**
 * A component that conditionally renders its children based on whether
 * the user has one or all of the specified user types
 */
export const UserTypeGate: React.FC<UserTypeGateProps> = ({
  children,
  userTypes,
  fallback,
  requireAll = false
}) => {
  const { hasUserType } = useAuthorization();

  const authorized = requireAll
    ? userTypes.every(type => hasUserType(type))
    : userTypes.some(type => hasUserType(type));

  if (!authorized) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}; 