// lib/services/role-service.ts

import { Role, Permission, DEFAULT_PERMISSIONS, UserType, Resource, Action } from "../rbac/models";
import apiClient, { ApiRole, type ApiUser } from "../api";

interface RoleServiceInterface {
  getAllRoles(): Promise<Role[]>;
  getRoleById(roleId: string): Promise<Role | null>;
  assignRoleToUser(userId: string, role: string): Promise<ApiUser>;
  removeRoleFromUser(userId: string): Promise<ApiUser>;
  getRolePermissions(roleId: string): Promise<Permission[]>;
  getRolesByUserType(userType: UserType): Promise<Role[]>;
  createRole(role: Omit<Role, "id">): Promise<Role>;
  updateRole(id: string, roleUpdate: Partial<Role>): Promise<Role | null>;
  deleteRole(id: string): Promise<boolean>;
}

// Helper to convert backend permission string to frontend Permission object
const parsePermission = (permString: string): Permission => {
  const [resource, action] = permString.split(':');
  
  // Try to find matching default permission to get nice name/description
  const found = DEFAULT_PERMISSIONS.find(
    p => p.resource === resource && p.action === action
  );
  
  if (found) return found;

  // Fallback for custom permissions
  return {
    id: permString,
    name: `${action} ${resource}`.replace(/^\w/, c => c.toUpperCase()),
    description: `Can ${action} ${resource}`,
    resource: resource as Resource,
    action: action as Action
  };
};

// Helper to convert frontend Permission object to backend permission string
const formatPermission = (perm: Permission): string => {
  return `${perm.resource}:${perm.action}`;
};

export class RoleService implements RoleServiceInterface {
  /**
   * Get all available roles from backend
   */
  async getAllRoles(): Promise<Role[]> {
    try {
      const response = await apiClient.getRoles();
      const apiRoles: ApiRole[] = response.data || [];
      
      return apiRoles.map(apiRole => ({
        id: String(apiRole.id),
        name: apiRole.name,
        description: apiRole.description || "",
        permissions: (apiRole.permissions || []).map(parsePermission)
      }));
    } catch (error) {
      console.error("Failed to fetch roles:", error);
      // Fallback to empty array or throw, depending on preference.
      // Retaining empty array for now to avoid breaking UI completely.
      return []; 
    }
  }

  /**
   * Get role by ID (or name if passed as ID, though we prefer ID)
   * Note: The interface called this 'roleType' but implementation treated it as name/type.
   * We will support looking up by name to maintain compatibility with UserType usage.
   */
  async getRoleById(roleIdOrName: string): Promise<Role | null> {
    const roles = await this.getAllRoles();
    // Try to find by ID first, then by name (for UserType compatibility)
    return roles.find(r => r.id === roleIdOrName || r.name === roleIdOrName) || null;
  }

  /**
   * Create a new role
   */
  async createRole(role: Omit<Role, "id">): Promise<Role> {
    const payload = {
      name: role.name,
      description: role.description,
      permissions: role.permissions.map(formatPermission)
    };

    const response = await apiClient.createRole(payload);
    const apiRole = response.data;
    
    return {
      id: String(apiRole.id),
      name: apiRole.name,
      description: apiRole.description || "",
      permissions: (apiRole.permissions || []).map(parsePermission)
    };
  }

  /**
   * Update a role
   */
  async updateRole(id: string, roleUpdate: Partial<Role>): Promise<Role | null> {
    const payload: Partial<ApiRole> & { permissions?: string[] } = {};
    if (roleUpdate.name) payload.name = roleUpdate.name;
    if (roleUpdate.description) payload.description = roleUpdate.description;
    if (roleUpdate.permissions) {
      payload.permissions = roleUpdate.permissions.map(formatPermission);
    }

    const response = await apiClient.updateRole(Number(id), payload);
    const apiRole = response.data;

    return {
      id: String(apiRole.id),
      name: apiRole.name,
      description: apiRole.description || "",
      permissions: (apiRole.permissions || []).map(parsePermission)
    };
  }

  /**
   * Delete a role
   */
  async deleteRole(id: string): Promise<boolean> {
    try {
      await apiClient.deleteRole(Number(id));
      return true;
    } catch (error) {
      console.error("Failed to delete role:", error);
      return false;
    }
  }

  /**
   * Assign a role to a user by updating the user's role
   * Maps UserType to backend role string
   */
  async assignRoleToUser(userId: string, role: string): Promise<ApiUser> {
    try {
      // Map UserType to backend role string if necessary
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
  async removeRoleFromUser(userId: string): Promise<ApiUser> {
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
  async getRolePermissions(roleIdOrName: string): Promise<Permission[]> {
    const roleObj = await this.getRoleById(roleIdOrName);
    return roleObj ? [...roleObj.permissions] : [];
  }

  /**
   * Get roles available for a specific user type
   * This might need adjustment if logic changes, but for now filtering by name 
   * (assuming role names match UserTypes) is the closest equivalent.
   */
  async getRolesByUserType(userType: UserType): Promise<Role[]> {
    const roles = await this.getAllRoles();
    
    // Logic to determine which roles are "relevant" for a UserType
    // This is a bit arbitrary without a strict hierarchy in the role model itself,
    // but preserving the original logic:
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
        // Return all roles or empty? Original returned empty.
        // If the userType doesn't match a known role name, maybe return empty.
        return [];
    }
  }
}

export const roleService = new RoleService();
