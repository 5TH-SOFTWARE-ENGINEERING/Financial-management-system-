// lib/rbac/models.ts
export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: Resource;
  action: Action;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
}

export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  phone?: string | null;
  role: UserType;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  last_login?: Date | null;
}

export enum UserType {
  ADMIN = 'ADMIN',
  FINANCE_ADMIN = 'FINANCE_ADMIN',
  ACCOUNTANT = 'ACCOUNTANT',
  EMPLOYEE = 'EMPLOYEE'
}

export enum Resource {
  USERS = 'users',
  ROLES = 'roles',
  REVENUES = 'revenues',
  EXPENSES = 'expenses',
  TRANSACTIONS = 'transactions',
  REPORTS = 'reports',
  DASHBOARD = 'dashboard',
  PROFILE = 'profile',
  DEPARTMENTS = 'departments',
  PROJECTS = 'projects',
  FINANCIAL_PLANS = 'financial_plans',
  SETTINGS = 'settings'
}

export enum Action {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  MANAGE = 'manage', // Includes all actions
}

export enum AdminType {
  ADMIN = 'ADMIN',
  FINANCE_ADMIN = 'FINANCE_ADMIN'
}

// Default permissions with finance-specific resources
export const DEFAULT_PERMISSIONS: Permission[] = [
  // User permissions
  { id: '1', name: 'Read Users', description: 'Can view users', resource: Resource.USERS, action: Action.READ },
  { id: '2', name: 'Create Users', description: 'Can create users', resource: Resource.USERS, action: Action.CREATE },
  { id: '3', name: 'Update Users', description: 'Can update users', resource: Resource.USERS, action: Action.UPDATE },
  { id: '4', name: 'Delete Users', description: 'Can delete users', resource: Resource.USERS, action: Action.DELETE },
 
  // Role permissions
  { id: '5', name: 'Read Roles', description: 'Can view roles', resource: Resource.ROLES, action: Action.READ },
  { id: '6', name: 'Create Roles', description: 'Can create roles', resource: Resource.ROLES, action: Action.CREATE },
  { id: '7', name: 'Update Roles', description: 'Can update roles', resource: Resource.ROLES, action: Action.UPDATE },
  { id: '8', name: 'Delete Roles', description: 'Can delete roles', resource: Resource.ROLES, action: Action.DELETE },
 
  // Revenue permissions
  { id: '9', name: 'Create Revenues', description: 'Can create revenue entries', resource: Resource.REVENUES, action: Action.CREATE },
  { id: '10', name: 'Read Revenues', description: 'Can view revenue entries', resource: Resource.REVENUES, action: Action.READ },
  { id: '11', name: 'Update Revenues', description: 'Can update revenue entries', resource: Resource.REVENUES, action: Action.UPDATE },
  { id: '12', name: 'Delete Revenues', description: 'Can delete revenue entries', resource: Resource.REVENUES, action: Action.DELETE },
 
  // Expense permissions
  { id: '13', name: 'Create Expenses', description: 'Can create expense entries', resource: Resource.EXPENSES, action: Action.CREATE },
  { id: '14', name: 'Read Expenses', description: 'Can view expense entries', resource: Resource.EXPENSES, action: Action.READ },
  { id: '15', name: 'Update Expenses', description: 'Can update expense entries', resource: Resource.EXPENSES, action: Action.UPDATE },
  { id: '16', name: 'Delete Expenses', description: 'Can delete expense entries', resource: Resource.EXPENSES, action: Action.DELETE },
 
  // Transaction permissions
  { id: '17', name: 'Read Transactions', description: 'Can view transactions', resource: Resource.TRANSACTIONS, action: Action.READ },
  { id: '18', name: 'Update Transactions', description: 'Can update transactions', resource: Resource.TRANSACTIONS, action: Action.UPDATE },
  { id: '19', name: 'Approve Transactions', description: 'Can approve transactions', resource: Resource.TRANSACTIONS, action: Action.MANAGE },
 
  // Report permissions
  { id: '20', name: 'Create Reports', description: 'Can create reports', resource: Resource.REPORTS, action: Action.CREATE },
  { id: '21', name: 'Read Reports', description: 'Can view reports', resource: Resource.REPORTS, action: Action.READ },
  { id: '22', name: 'Update Reports', description: 'Can update reports', resource: Resource.REPORTS, action: Action.UPDATE },
  { id: '23', name: 'Delete Reports', description: 'Can delete reports', resource: Resource.REPORTS, action: Action.DELETE },
 
  // Dashboard permissions
  { id: '24', name: 'Access Dashboard', description: 'Can access dashboard', resource: Resource.DASHBOARD, action: Action.READ },
 
  // Settings permissions
  { id: '25', name: 'Read Settings', description: 'Can view settings', resource: Resource.SETTINGS, action: Action.READ },
  { id: '26', name: 'Update Settings', description: 'Can update settings', resource: Resource.SETTINGS, action: Action.UPDATE },
 
  // Profile permissions
  { id: '27', name: 'Read Profile', description: 'Can view own profile', resource: Resource.PROFILE, action: Action.READ },
  { id: '28', name: 'Update Profile', description: 'Can update own profile', resource: Resource.PROFILE, action: Action.UPDATE },
 
  
  // Department permissions
  { id: '29', name: 'Create Departments', description: 'Can create departments', resource: Resource.DEPARTMENTS, action: Action.CREATE },
  { id: '30', name: 'Read Departments', description: 'Can view departments', resource: Resource.DEPARTMENTS, action: Action.READ },
  { id: '31', name: 'Update Departments', description: 'Can update departments', resource: Resource.DEPARTMENTS, action: Action.UPDATE },
  { id: '32', name: 'Delete Departments', description: 'Can delete departments', resource: Resource.DEPARTMENTS, action: Action.DELETE },
  
    // Project permissions
    { id: '33', name: 'Create Projects', description: 'Can create projects', resource: Resource.PROJECTS, action: Action.CREATE },
    { id: '34', name: 'Read Projects',   description: 'Can view projects',   resource: Resource.PROJECTS, action: Action.READ },
    { id: '35', name: 'Update Projects', description: 'Can update projects', resource: Resource.PROJECTS, action: Action.UPDATE },
    { id: '36', name: 'Delete Projects', description: 'Can delete projects', resource: Resource.PROJECTS, action: Action.DELETE },
    
    // Financial plans (example)
    { id: '37', name: 'Read Financial Plans', description: 'Can view financial plans', resource: Resource.FINANCIAL_PLANS, action: Action.READ },
    { id: '38', name: 'Manage Settings',      description: 'Can manage settings',       resource: Resource.SETTINGS, action: Action.MANAGE },
];
export const DEFAULT_ROLES: Role[] = [
  {
    id: 'role-admin',
    name: UserType.ADMIN,
    permissions: [...DEFAULT_PERMISSIONS],
    description: "Administrator"
  },

  {
    id: 'role-finance-admin',
    name: UserType.FINANCE_ADMIN,
    permissions: DEFAULT_PERMISSIONS.filter(p =>
      [Resource.REVENUES, Resource.EXPENSES, Resource.REPORTS, Resource.TRANSACTIONS].includes(p.resource)
    ),
    description: "Finance Manager role"
  },

  {
    id: 'role-accountant',
    name: UserType.ACCOUNTANT,
    permissions: DEFAULT_PERMISSIONS.filter(p =>
      [Resource.REVENUES, Resource.EXPENSES, Resource.REPORTS].includes(p.resource)
    ),
    description: "Accountant"
  },

  {
    id: 'role-employee',
    name: UserType.EMPLOYEE,
    permissions: DEFAULT_PERMISSIONS.filter(p =>
      [Resource.REVENUES, Resource.EXPENSES, Resource.PROFILE].includes(p.resource)
    ),
    description: "Employee"
  }
]