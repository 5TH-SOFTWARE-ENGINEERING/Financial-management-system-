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

export enum AdminType {
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
  INSURANCE_ADMIN = 'INSURANCE_ADMIN',
  CORPORATE_ADMIN = 'CORPORATE_ADMIN',
  PROVIDER_ADMIN = 'PROVIDER_ADMIN'
} 