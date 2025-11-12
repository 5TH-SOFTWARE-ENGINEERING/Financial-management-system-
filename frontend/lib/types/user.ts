import { UserType, AdminType } from './enums';

export interface BaseUser {
  id: string;
  username: string;
  email: string | null;
  userType: UserType;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  isActive: boolean;
  lastLoginAt: Date | null;
  insuranceCompanyId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Admin extends BaseUser {
  adminType: AdminType;
  corporateClientId: string | null;
  roles?: any[];
  permissions?: any;
}
