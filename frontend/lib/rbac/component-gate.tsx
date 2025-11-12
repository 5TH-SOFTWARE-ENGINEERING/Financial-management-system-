'use client';

import React, { ReactNode, useEffect } from 'react';
import { useAuth } from './auth-context';
import { ComponentId, canAccessComponent } from './component-access';

interface ComponentGateProps {
  children: ReactNode;
  componentId: ComponentId;
  fallback?: ReactNode;
  debug?: boolean;
}

/**
 * A component that conditionally renders its children based on
 * whether the user has access to the specified component ID
 */
export const ComponentGate: React.FC<ComponentGateProps> = ({
  children,
  componentId,
  fallback,
  debug = false
}) => {
  const { user } = useAuth();
  
  useEffect(() => {
    if (debug) {
      console.log('ComponentGate Debug:', {
        componentId,
        userType: user?.userType,
        adminType: user?.adminType,
        hasAccess: user ? canAccessComponent(user.userType, componentId, user.adminType) : false
      });
    }
  }, [componentId, user, debug]);
  
  if (!user || !user.userType) {
    if (debug) {
      console.warn('ComponentGate: No user or userType found', { componentId });
    }
    return fallback ? <>{fallback}</> : null;
  }
  
  const hasAccess = canAccessComponent(
    user.userType,
    componentId,
    user.adminType
  );
  
  if (!hasAccess) {
    if (debug) {
      console.warn('ComponentGate: Access denied', {
        componentId,
        userType: user.userType,
        adminType: user.adminType
      });
    }
    return fallback ? <>{fallback}</> : null;
  }
  
  return <>{children}</>;
};

/**
 * HOC that wraps a component with role-based access control
 * @param Component The component to wrap
 * @param componentId The component ID for access control
 * @param fallback Optional fallback component to render when access is denied
 * @param debug Optional flag to enable debug logging
 */
export function withComponentAccess<P extends object>(
  Component: React.ComponentType<P>,
  componentId: ComponentId,
  fallback?: React.ReactNode,
  debug?: boolean
): React.FC<P> {
  return (props: P) => (
    <ComponentGate componentId={componentId} fallback={fallback} debug={debug}>
      <Component {...props} />
    </ComponentGate>
  );
} 