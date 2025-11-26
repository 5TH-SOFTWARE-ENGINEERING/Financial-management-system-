// lib/services/permission-service.ts

import { Permission, DEFAULT_PERMISSIONS, Resource, Action } from '../rbac/models';

interface PermissionServiceInterface {
  getAllPermissions(): Promise<Permission[]>;
  getPermissionById(id: string): Promise<Permission | null>;
  createPermission(permission: Omit<Permission, 'id'>): Promise<Permission>;
  updatePermission(id: string, permission: Partial<Permission>): Promise<Permission | null>;
  deletePermission(id: string): Promise<boolean>;
  getPermissionsByResource(resource: Resource): Promise<Permission[]>;
  getPermissionsByAction(action: Action): Promise<Permission[]>;
  getPermissionByResourceAndAction(resource: Resource, action: Action): Promise<Permission | null>;
  hasPermission(resource: Resource, action: Action): Promise<boolean>;
}

// In-memory cache for permissions (since backend doesn't have permission endpoints)
let permissionsCache: Permission[] | null = null;

export class PermissionService implements PermissionServiceInterface {
  /**
   * Get all available permissions
   * Uses DEFAULT_PERMISSIONS since backend doesn't have permission endpoints
   */
  async getAllPermissions(): Promise<Permission[]> {
    if (permissionsCache) {
      return [...permissionsCache];
    }
    permissionsCache = [...DEFAULT_PERMISSIONS];
    return [...permissionsCache];
  }

  /**
   * Get permission by ID
   */
  async getPermissionById(id: string): Promise<Permission | null> {
    const permissions = await this.getAllPermissions();
    const permission = permissions.find(p => p.id === id);
    return permission ? { ...permission } : null;
  }

  /**
   * Create a new permission (in-memory only, since backend doesn't support this)
   */
  async createPermission(permission: Omit<Permission, 'id'>): Promise<Permission> {
    const permissions = await this.getAllPermissions();
    const newPermission: Permission = {
      ...permission,
      id: `permission-${Date.now()}`
    };
    permissions.push(newPermission);
    permissionsCache = permissions;
    return { ...newPermission };
  }

  /**
   * Update an existing permission (in-memory only)
   */
  async updatePermission(id: string, permissionUpdate: Partial<Permission>): Promise<Permission | null> {
    const permissions = await this.getAllPermissions();
    const index = permissions.findIndex(p => p.id === id);
    if (index === -1) return null;

    const updatedPermission = {
      ...permissions[index],
      ...permissionUpdate,
      id // Ensure ID doesn't change
    };
    
    permissions[index] = updatedPermission;
    permissionsCache = permissions;
    return { ...updatedPermission };
  }

  /**
   * Delete a permission by id (in-memory only)
   */
  async deletePermission(id: string): Promise<boolean> {
    const permissions = await this.getAllPermissions();
    const initialLength = permissions.length;
    const filtered = permissions.filter(p => p.id !== id);
    if (filtered.length < initialLength) {
      permissionsCache = filtered;
      return true;
    }
    return false;
  }

  /**
   * Get permissions by resource
   */
  async getPermissionsByResource(resource: Resource): Promise<Permission[]> {
    const permissions = await this.getAllPermissions();
    return permissions.filter(p => p.resource === resource);
  }

  /**
   * Get permissions by action
   */
  async getPermissionsByAction(action: Action): Promise<Permission[]> {
    const permissions = await this.getAllPermissions();
    return permissions.filter(p => p.action === action);
  }

  /**
   * Get permission by resource and action
   */
  async getPermissionByResourceAndAction(resource: Resource, action: Action): Promise<Permission | null> {
    const permissions = await this.getAllPermissions();
    const permission = permissions.find(p => p.resource === resource && p.action === action);
    return permission ? { ...permission } : null;
  }

  /**
   * Check if a permission exists
   */
  async hasPermission(resource: Resource, action: Action): Promise<boolean> {
    const permissions = await this.getAllPermissions();
    return permissions.some(p => p.resource === resource && p.action === action);
  }
}

// Export a singleton instance
export const permissionService = new PermissionService(); 