// lib/services/role-service.ts

import { Role, Permission, DEFAULT_ROLES, DEFAULT_PERMISSIONS, UserType } from "../rbac/models";
import apiClient from "../api";

interface RoleServiceInterface {
  getAllRoles(): Promise<Role[]>;
  getRoleById(roleType: UserType): Promise<Role | null>;
  assignRoleToUser(userId: string, role: string): Promise<any>;
  removeRoleFromUser(userId: string): Promise<any>;
  getRolePermissions(role: UserType): Promise<Permission[]>;
  getRolesByUserType(userType: UserType): Promise<Role[]>;
  createRole(role: Omit<Role, "id">): Promise<Role>;
  updateRole(id: string, roleUpdate: Partial<Role>): Promise<Role | null>;
  deleteRole(id: string): Promise<boolean>;
}

// In-memory cache for roles (since backend doesn't have role endpoints)
let rolesCache: Role[] | null = null;

export class RoleService implements RoleServiceInterface {
  /**
   * Get all available roles
   * Uses DEFAULT_ROLES since backend doesn't have role endpoints
   */
  async getAllRoles(): Promise<Role[]> {
    if (rolesCache) {
      return [...rolesCache];
    }
    rolesCache = [...DEFAULT_ROLES];
    return [...rolesCache];
  }

  /**
   * Get role by UserType
   */
  async getRoleById(roleType: UserType): Promise<Role | null> {
    const roles = await this.getAllRoles();
    const role = roles.find(r => r.name === roleType);
    return role ? { ...role } : null;
  }

  /**
   * Create a new role (in-memory only, since backend doesn't support this)
   */
  async createRole(role: Omit<Role, "id">): Promise<Role> {
    const roles = await this.getAllRoles();
    const newRole: Role = { ...role, id: `role-${Date.now()}` };
    roles.push(newRole);
    rolesCache = roles;
    return newRole;
  }

  /**
   * Update a role (in-memory only)
   */
  async updateRole(id: string, roleUpdate: Partial<Role>): Promise<Role | null> {
    const roles = await this.getAllRoles();
    const index = roles.findIndex(r => r.id === id);
    if (index === -1) return null;

    roles[index] = { ...roles[index], ...roleUpdate, id };
    rolesCache = roles;
    return roles[index];
  }

  /**
   * Delete a role (in-memory only)
   */
  async deleteRole(id: string): Promise<boolean> {
    const roles = await this.getAllRoles();
    const before = roles.length;
    const filtered = roles.filter(r => r.id !== id);
    if (filtered.length < before) {
      rolesCache = filtered;
      return true;
    }
    return false;
  }

  /**
   * Assign a role to a user by updating the user's role
   * Maps UserType to backend role string
   */
  async assignRoleToUser(userId: string, role: string): Promise<any> {
    try {
      // Map UserType to backend role string
      const roleMap: Record<string, string> = {
        [UserType.ADMIN]: 'admin',
        [UserType.FINANCE_ADMIN]: 'manager',
        [UserType.ACCOUNTANT]: 'accountant',
        [UserType.EMPLOYEE]: 'employee',
      };

      const backendRole = roleMap[role] || role.toLowerCase();

      // Update user via API
      const response = await apiClient.updateUser(Number(userId), { role: backendRole });
      return response.data;
    } catch (error) {
      console.error('Error assigning role to user:', error);
      throw error;
    }
  }

  /**
   * Remove a role from a user (sets to default employee role)
   */
  async removeRoleFromUser(userId: string): Promise<any> {
    try {
      const response = await apiClient.updateUser(Number(userId), { role: 'employee' });
      return response.data;
    } catch (error) {
      console.error('Error removing role from user:', error);
      throw error;
    }
  }

  /**
   * Get permissions for a specific role
   */
  async getRolePermissions(role: UserType): Promise<Permission[]> {
    const roleObj = await this.getRoleById(role);
    return roleObj ? [...roleObj.permissions] : [];
  }

  /**
   * Get roles available for a specific user type
   */
  async getRolesByUserType(userType: UserType): Promise<Role[]> {
    const roles = await this.getAllRoles();
    switch (userType) {
      case UserType.ADMIN:
        return roles.filter(r => r.name === UserType.ADMIN);
      case UserType.FINANCE_ADMIN:
        return roles.filter(r => [UserType.ADMIN, UserType.FINANCE_ADMIN].includes(r.name as UserType));
      case UserType.ACCOUNTANT:
        return roles.filter(r => r.name === UserType.ACCOUNTANT);
      case UserType.EMPLOYEE:
        return roles.filter(r => r.name === UserType.EMPLOYEE);
      default:
        return [];
    }
  }
}

export const roleService = new RoleService();
