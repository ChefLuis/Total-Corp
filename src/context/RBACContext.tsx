import React, { createContext, useContext, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { AppRole, Permission, Resource, Action, DEFAULT_ROLE_PERMISSIONS } from '../types/rbac';

interface RBACContextType {
  role: AppRole;
  permissions: Permission[];
  hasPermission: (permission: Permission) => boolean;
  canAccess: (resource: Resource, action?: Action) => boolean;
}

const RBACContext = createContext<RBACContextType | undefined>(undefined);

export const RBACProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const role = currentUser.role;

  const permissions = useMemo(() => {
    return DEFAULT_ROLE_PERMISSIONS[role] || [];
  }, [role]);

  const hasPermission = (permission: Permission): boolean => {
    if (permissions.includes('*' as Permission) || permissions.includes('super_admin:*')) {
      return true;
    }
    if (permissions.includes(permission)) {
      return true;
    }
    const [res] = permission.split(':') as [Resource, Action];
    if (permissions.includes(`${res}:*` as Permission)) {
      return true;
    }
    return false;
  };

  const canAccess = (resource: Resource, action: Action = 'read'): boolean => {
    if (hasPermission(`${resource}:*` as Permission)) return true;
    if (hasPermission(`${resource}:${action}` as Permission)) return true;
    if (action === 'read' && hasPermission(`${resource}:view_own` as Permission)) return true;
    return false;
  };

  return (
    <RBACContext.Provider value={{ role, permissions, hasPermission, canAccess }}>
      {children}
    </RBACContext.Provider>
  );
};

export const useRBAC = () => {
  const context = useContext(RBACContext);
  if (!context) {
    throw new Error('useRBAC must be used within an RBACProvider');
  }
  return context;
};

export const RequirePermission: React.FC<{
  resource: Resource;
  action?: Action;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ resource, action = 'read', children, fallback = null }) => {
  const { canAccess } = useRBAC();
  if (!canAccess(resource, action)) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
};
