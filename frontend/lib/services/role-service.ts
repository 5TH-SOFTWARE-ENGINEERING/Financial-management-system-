// lib/services/role-service.ts

import { Role, Permission, DEFAULT_ROLES, DEFAULT_PERMISSIONS, User, UserType } from "../rbac/models";

interface RoleServiceInterface {
  getAllRoles(): Promise<Role[]>;
  getRoleById(roleType: UserType): Promise<Role | null>;
  assignRoleToUser(userId: string, role: UserType): Promise<User | null>;
  removeRoleFromUser(userId: string): Promise<User | null>;
  getRolePermissions(role: UserType): Promise<Permission[]>;
  getRolesByUserType(userType: UserType): Promise<Role[]>;
}

// Mock DB
let roles = [...DEFAULT_ROLES];
let permissions = [...DEFAULT_PERMISSIONS];
let users: User[] = [];

export class RoleService implements RoleServiceInterface {
  async getAllRoles(): Promise<Role[]> {
    return [...roles];
  }

  async getRoleById(roleType: UserType): Promise<Role | null> {
    const role = roles.find(r => r.name === roleType);
    return role ? { ...role } : null;
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

// Assign a role to a user
async assignRoleToUser(userId: string, role: UserType): Promise<User | null> {
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) return null;

  users[userIndex].role = role;
  return { ...users[userIndex] };
}

// Remove a role from a user
async removeRoleFromUser(userId: string): Promise<User | null> {
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) return null;

  users[userIndex].role = UserType.EMPLOYEE; // default role
  return { ...users[userIndex] };
}

async getRolePermissions(role: UserType): Promise<Permission[]> {
  const roleObj = await this.getRoleById(role);
  return roleObj ? [...roleObj.permissions] : [];
}

  async getRolesByUserType(userType: UserType): Promise<Role[]> {
    switch (userType) {
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
