export type AppRole =
  | 'super_admin'
  | 'owner'
  | 'manager'
  | 'receptionist'
  | 'professional'
  | 'financial';

export type Resource =
  | 'dashboard'
  | 'appointments'
  | 'clients'
  | 'services'
  | 'team'
  | 'financial'
  | 'commissions'
  | 'inventory'
  | 'marketing'
  | 'subscriptions'
  | 'settings'
  | 'super_admin';

export type Action =
  | 'read'
  | 'write'
  | 'delete'
  | 'view_all'
  | 'view_own'
  | 'export'
  | 'cash_close';

export type Permission = `${Resource}:${Action}` | `${Resource}:*`;

export interface RoleDefinition {
  id: AppRole;
  labelKey: string;
  descriptionKey: string;
  badgeColor: string;
  permissions: Permission[];
}

export const DEFAULT_ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  super_admin: [
    'super_admin:*',
    'dashboard:*',
    'appointments:*',
    'clients:*',
    'services:*',
    'team:*',
    'financial:*',
    'commissions:*',
    'inventory:*',
    'marketing:*',
    'subscriptions:*',
    'settings:*',
  ],
  owner: [
    'dashboard:*',
    'appointments:*',
    'clients:*',
    'services:*',
    'team:*',
    'financial:*',
    'commissions:*',
    'inventory:*',
    'marketing:*',
    'subscriptions:*',
    'settings:*',
  ],
  manager: [
    'dashboard:read',
    'appointments:*',
    'clients:*',
    'services:*',
    'team:read',
    'team:write',
    'financial:read',
    'financial:cash_close',
    'commissions:read',
    'inventory:*',
    'marketing:*',
    'settings:read',
  ],
  receptionist: [
    'dashboard:read',
    'appointments:*',
    'clients:*',
    'services:read',
    'team:read',
    'financial:read',
    'financial:cash_close',
    'inventory:read',
    'marketing:read',
  ],
  professional: [
    'dashboard:read',
    'appointments:read',
    'appointments:view_own',
    'appointments:write',
    'clients:read',
    'services:read',
    'commissions:view_own',
  ],
  financial: [
    'dashboard:read',
    'financial:*',
    'commissions:*',
    'subscriptions:read',
    'inventory:read',
    'clients:read',
  ],
};
