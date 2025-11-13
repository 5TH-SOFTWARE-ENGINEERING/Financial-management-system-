import { Role, Permission, DEFAULT_ROLES, DEFAULT_PERMISSIONS, User, Resource, Action, UserType } from '../rbac/models';

interface RoleServiceInterface {
  getAllRoles(): Promise<Role[]>;
  getRoleById(id: string): Promise<Role | null>;
  createRole(role: Omit<Role, 'id'>): Promise<Role>;
  updateRole(id: string, role: Partial<Role>): Promise<Role | null>;
  deleteRole(id: string): Promise<boolean>;
  assignRoleToUser(userId: string, roleId: string): Promise<User | null>;
  removeRoleFromUser(userId: string, roleId: string): Promise<User | null>;
  getRolePermissions(roleId: string): Promise<Permission[]>;
  assignPermissionToRole(roleId: string, permissionId: string): Promise<Role | null>;
  removePermissionFromRole(roleId: string, permissionId: string): Promise<Role | null>;
  getRolesByUserType(userType: UserType): Promise<Role[]>;
}

// Mock storage
let roles = [...DEFAULT_ROLES];
let permissions = [...DEFAULT_PERMISSIONS];
let users: User[] = [];

export class RoleService implements RoleServiceInterface {
  /**
   * Get all roles
   */
  async getAllRoles(): Promise<Role[]> {
    return [...roles];
  }

  /**
   * Get role by ID
   */
  async getRoleById(id: string): Promise<Role | null> {
    const role = roles.find(r => r.id === id);
    return role ? { ...role } : null;
  }

  /**
   * Create a new role
   */
  async createRole(role: Omit<Role, 'id'>): Promise<Role> {
    const newRole: Role = {
      ...role,
      id: `role-${Date.now()}`
    };
    roles.push(newRole);
    return { ...newRole };
  }

  /**
   * Update an existing role
   */
  async updateRole(id: string, roleUpdate: Partial<Role>): Promise<Role | null> {
    const index = roles.findIndex(r => r.id === id);
    if (index === -1) return null;

    const updatedRole = {
      ...roles[index],
      ...roleUpdate,
      id // Ensure ID doesn't change
    };
    
    roles[index] = updatedRole;
    return { ...updatedRole };
  }

  /**
   * Delete a role by ID
   */
  async deleteRole(id: string): Promise<boolean> {
    const initialLength = roles.length;
    roles = roles.filter(r => r.id !== id);
    return roles.length < initialLength;
  }

  /**
   * Assign a role to a user
   */
  async assignRoleToUser(userId: string, roleId: string): Promise<User | null> {
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) return null;

    const role = await this.getRoleById(roleId);
    if (!role) return null;

    // Don't add the role if the user already has it
    if (!users[userIndex].roles.some(r => r.id === roleId)) {
      users[userIndex].roles.push(role);
    }

    return { ...users[userIndex] };
  }

  /**
   * Remove a role from a user
   */
  async removeRoleFromUser(userId: string, roleId: string): Promise<User | null> {
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) return null;

    users[userIndex].roles = users[userIndex].roles.filter(r => r.id !== roleId);
    return { ...users[userIndex] };
  }

  /**
   * Get permissions for a role
   */
  async getRolePermissions(roleId: string): Promise<Permission[]> {
    const role = await this.getRoleById(roleId);
    return role ? [...role.permissions] : [];
  }

  /**
   * Assign a permission to a role
   */
  async assignPermissionToRole(roleId: string, permissionId: string): Promise<Role | null> {
    const roleIndex = roles.findIndex(r => r.id === roleId);
    if (roleIndex === -1) return null;

    const permission = permissions.find(p => p.id === permissionId);
    if (!permission) return null;

    // Don't add the permission if the role already has it
    if (!roles[roleIndex].permissions.some(p => p.id === permissionId)) {
      roles[roleIndex].permissions.push(permission);
    }

    return { ...roles[roleIndex] };
  }

  /**
   * Remove a permission from a role
   */
  async removePermissionFromRole(roleId: string, permissionId: string): Promise<Role | null> {
    const roleIndex = roles.findIndex(r => r.id === roleId);
    if (roleIndex === -1) return null;

    roles[roleIndex].permissions = roles[roleIndex].permissions.filter(p => p.id !== permissionId);
    return { ...roles[roleIndex] };
  }

  /**
   * Get roles by user type
   */
  async getRolesByUserType(userType: UserType): Promise<Role[]> {
    switch (userType) {
      case UserType.ADMIN:
        return roles.filter(r => r.name === 'ADMIN');
      case UserType.FINANCE_ADMIN:
        return roles.filter(r => r.name === 'ADMIN' || r.name.includes('FINANCE'));
      case UserType.FINANCE_ADMIN:
        return roles.filter(r => r.name === 'ADMIN' || r.name.includes('FINANCE'));
      case UserType.ACCOUNTANT_ADMIN:
        return roles.filter(r => r.name === 'ACCOUNTANT');
      case UserType.EMPLOYEE:
        return roles.filter(r => r.name === 'EMPLOYEE');
      default:
        return [];
    }
  }
}

// Export a singleton instance
export const roleService = new RoleService(); 