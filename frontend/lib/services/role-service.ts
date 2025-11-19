// lib/services/role-service.ts

import { Role, Permission, DEFAULT_ROLES, DEFAULT_PERMISSIONS, User, UserType } from "../rbac/models";

// Mock DB
let roles = [...DEFAULT_ROLES];
let permissions = [...DEFAULT_PERMISSIONS];
let users: User[] = [];

export class RoleService {
  async getAllRoles(): Promise<Role[]> {
    return [...roles];
  }

  async getRoleById(id: string): Promise<Role | null> {
    return roles.find(r => r.id === id) || null;
  }

  async createRole(role: Omit<Role, "id">): Promise<Role> {
    const newRole: Role = { ...role, id: `role-${Date.now()}` };
    roles.push(newRole);
    return newRole;
  }

  async updateRole(id: string, roleUpdate: Partial<Role>): Promise<Role | null> {
    const index = roles.findIndex(r => r.id === id);
    if (index === -1) return null;

    roles[index] = { ...roles[index], ...roleUpdate, id };
    return roles[index];
  }

  async deleteRole(id: string): Promise<boolean> {
    const before = roles.length;
    roles = roles.filter(r => r.id !== id);
    return roles.length < before;
  }

  //  Assign single role
  async assignRoleToUser(userId: string, role: UserType): Promise<User | null> {
    const user = users.find(u => u.id === userId);
    if (!user) return null;

    user.role = role;
    return user;
  }

  async getRolePermissions(role: UserType): Promise<Permission[]> {
    const r = roles.find(r => r.name === role);
    return r ? [...r.permissions] : [];
  }

  async getRolesByUserType(userType: UserType): Promise<Role[]> {
    switch (userType) {
      case UserType.SUPER_ADMIN:
        return roles;
      case UserType.ADMIN:
        return roles.filter(r => r.name === "ADMIN");
      case UserType.FINANCE_ADMIN:
        return roles.filter(r => ["ADMIN", "FINANCE_ADMIN"].includes(r.name));
      case UserType.ACCOUNTANT:
        return roles.filter(r => r.name === "ACCOUNTANT");
      case UserType.EMPLOYEE:
        return roles.filter(r => r.name === "EMPLOYEE");
      default:
        return [];
    }
  }
}

export const roleService = new RoleService();
