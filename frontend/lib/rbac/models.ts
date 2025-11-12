export type Permission = {
  id: string;
  name: string;
  description: string;
  resource: Resource;
  action: Action;
};

export type Role = {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
};

export type User = {
  id: string;
  username: string;
  email: string;
  name: string;
  roles: Role[];
  password: string;
  userType: UserType;
};

export enum UserType {
  ADMIN = 'ADMIN',
  INSURANCE_ADMIN = 'INSURANCE_ADMIN',
  INSURANCE_STAFF = 'INSURANCE_STAFF',
  CORPORATE_ADMIN = 'CORPORATE_ADMIN',
  PROVIDER_ADMIN = 'PROVIDER_ADMIN',
  STAFF = 'STAFF',
  MEMBER = 'MEMBER',
  PROVIDER = 'PROVIDER'
}

export enum Resource {
  USERS = 'users',
  ROLES = 'roles',
  INSURANCE_COMPANIES = 'insurance_companies',
  POLICIES = 'policies',
  CLAIMS = 'claims',
  SETTINGS = 'settings',
  DASHBOARD = 'dashboard',
  PROFILE = 'profile',
  CORPORATE_CLIENTS = 'corporate_clients',
  COVERAGE_PLANS = 'coverage_plans'
}

export enum Action {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  MANAGE = 'manage', // Includes all actions
}

// Default roles with their permissions
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
  
  // Insurance company permissions
  { id: '9', name: 'Read Companies', description: 'Can view insurance companies', resource: Resource.INSURANCE_COMPANIES, action: Action.READ },
  { id: '10', name: 'Create Companies', description: 'Can create insurance companies', resource: Resource.INSURANCE_COMPANIES, action: Action.CREATE },
  { id: '11', name: 'Update Companies', description: 'Can update insurance companies', resource: Resource.INSURANCE_COMPANIES, action: Action.UPDATE },
  { id: '12', name: 'Delete Companies', description: 'Can delete insurance companies', resource: Resource.INSURANCE_COMPANIES, action: Action.DELETE },
  
  // Dashboard permissions
  { id: '13', name: 'Access Dashboard', description: 'Can access dashboard', resource: Resource.DASHBOARD, action: Action.READ },
  
  // Settings permissions
  { id: '14', name: 'Read Settings', description: 'Can view settings', resource: Resource.SETTINGS, action: Action.READ },
  { id: '15', name: 'Update Settings', description: 'Can update settings', resource: Resource.SETTINGS, action: Action.UPDATE },
  
  // Profile permissions
  { id: '16', name: 'Read Profile', description: 'Can view own profile', resource: Resource.PROFILE, action: Action.READ },
  { id: '17', name: 'Update Profile', description: 'Can update own profile', resource: Resource.PROFILE, action: Action.UPDATE },
  
  // Corporate Client permissions
  { id: '18', name: 'Create Corporate Clients', description: 'Can create corporate clients', resource: Resource.CORPORATE_CLIENTS, action: Action.CREATE },
  { id: '19', name: 'Read Corporate Clients', description: 'Can view corporate clients', resource: Resource.CORPORATE_CLIENTS, action: Action.READ },
  { id: '20', name: 'Update Corporate Clients', description: 'Can update corporate clients', resource: Resource.CORPORATE_CLIENTS, action: Action.UPDATE },
  { id: '21', name: 'Delete Corporate Clients', description: 'Can delete corporate clients', resource: Resource.CORPORATE_CLIENTS, action: Action.DELETE },
  
  // Coverage Plan permissions
  { id: '22', name: 'Create Coverage Plans', description: 'Can create coverage plans', resource: Resource.COVERAGE_PLANS, action: Action.CREATE },
  { id: '23', name: 'Read Coverage Plans', description: 'Can view coverage plans', resource: Resource.COVERAGE_PLANS, action: Action.READ },
  { id: '24', name: 'Update Coverage Plans', description: 'Can update coverage plans', resource: Resource.COVERAGE_PLANS, action: Action.UPDATE },
  { id: '25', name: 'Delete Coverage Plans', description: 'Can delete coverage plans', resource: Resource.COVERAGE_PLANS, action: Action.DELETE },
];

export const DEFAULT_ROLES: Role[] = [
  {
    id: '1',
    name: 'ADMIN',
    description: 'System administrator with full access',
    permissions: DEFAULT_PERMISSIONS,
  },
  {
    id: '2',
    name: 'STAFF',
    description: 'General staff member with limited permissions',
    permissions: DEFAULT_PERMISSIONS.filter(p => 
      [Resource.DASHBOARD, Resource.PROFILE].includes(p.resource) || 
      (p.resource === Resource.INSURANCE_COMPANIES && p.action === Action.READ)
    ),
  },
  {
    id: '3',
    name: 'CORPORATE',
    description: 'Corporate client manager',
    permissions: DEFAULT_PERMISSIONS.filter(p => 
      [Resource.DASHBOARD, Resource.PROFILE].includes(p.resource) || 
      p.resource === Resource.CORPORATE_CLIENTS ||
      p.resource === Resource.COVERAGE_PLANS
    ),
  },
  {
    id: '4',
    name: 'MEMBER',
    description: 'Insurance member with access to own information',
    permissions: DEFAULT_PERMISSIONS.filter(p => 
      [Resource.PROFILE].includes(p.resource) || 
      (p.resource === Resource.COVERAGE_PLANS && p.action === Action.READ)
    ),
  },
  {
    id: '5',
    name: 'PROVIDER',
    description: 'Healthcare provider',
    permissions: DEFAULT_PERMISSIONS.filter(p => 
      [Resource.PROFILE, Resource.DASHBOARD].includes(p.resource) || 
      (p.resource === Resource.COVERAGE_PLANS && p.action === Action.READ)
    ),
  },
];

// Mock user data
export const MOCK_USERS: User[] = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@example.com',
    name: 'System Admin',
    roles: [DEFAULT_ROLES.find(r => r.name === 'ADMIN')!],
    password: 'password1',
    userType: UserType.ADMIN
  },
  {
    id: '2',
    username: 'staff',
    email: 'staff@example.com',
    name: 'John Smith',
    roles: [DEFAULT_ROLES.find(r => r.name === 'STAFF')!],
    password: 'password2',
    userType: UserType.STAFF
  },
  {
    id: '3',
    username: 'corporate',
    email: 'corporate@example.com',
    name: 'Corporate Manager',
    roles: [DEFAULT_ROLES.find(r => r.name === 'CORPORATE')!],
    password: 'password3',
    userType: UserType.CORPORATE_ADMIN
  },
  {
    id: '4',
    username: 'member',
    email: 'member@example.com',
    name: 'John Member',
    roles: [DEFAULT_ROLES.find(r => r.name === 'MEMBER')!],
    password: 'password4',
    userType: UserType.MEMBER
  },
  {
    id: '5',
    username: 'provider',
    email: 'provider@example.com',
    name: 'Dr. Jane Provider',
    roles: [DEFAULT_ROLES.find(r => r.name === 'PROVIDER')!],
    password: 'password5',
    userType: UserType.PROVIDER
  },
  {
    id: '6',
    username: 'insuranceadmin',
    email: 'insurance@example.com',
    name: 'Insurance Admin',
    roles: [DEFAULT_ROLES.find(r => r.name === 'ADMIN')!],
    password: 'password6',
    userType: UserType.INSURANCE_ADMIN
  },
  {
    id: '7',
    username: 'provideradmin',
    email: 'provider@example.com',
    name: 'Provider Admin',
    roles: [DEFAULT_ROLES.find(r => r.name === 'ADMIN')!],
    password: 'password7',
    userType: UserType.PROVIDER_ADMIN
  }
]; 