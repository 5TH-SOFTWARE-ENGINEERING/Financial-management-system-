// lib/services/permission-service.ts

import { Permission, DEFAULT_PERMISSIONS, Resource, Action } from '../rbac/models';
import apiClient from '../api';

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

// Helper to parse permission string (duplicated logic to avoid circular deps if moved to RoleService)
const parsePermission = (permString: string): Permission => {
  const [resource, action] = permString.split(':');
  const found = DEFAULT_PERMISSIONS.find(p => p.resource === resource && p.action === action);
  if (found) return found;
  return {
    id: permString,
    name: `${action} ${resource}`.replace(/^\w/, c => c.toUpperCase()),
    description: `Can ${action} ${resource}`,
    resource: resource as Resource,
    action: action as Action
  };
};

// In-memory cache for permissions
let permissionsCache: Permission[] | null = null;

export class PermissionService implements PermissionServiceInterface {
  /**
   * Get all available permissions from backend
   */
  async getAllPermissions(): Promise<Permission[]> {
    if (permissionsCache) {
      return [...permissionsCache];
    }

    try {
      const response = await apiClient.getPermissions();
      // Backend returns string[], map to Permission objects
      // Merge with DEFAULT_PERMISSIONS to ensure we have all static definitions
      // (Backend might return a subset or superset)
      const backendPerms = (response.data || []).map(parsePermission);
      
      // Combine and deduplicate by ID (which is the perm string for parsed ones, or '1' etc for defaults)
      // Actually, parsed IDs are 'resource:action'. Default IDs are numbers.
      // This is a bit messy. Let's rely on backend permissions as truth if available.
      // If backend returns nothing (e.g. error), use defaults.
      
      if (backendPerms.length > 0) {
        permissionsCache = backendPerms;
      } else {
        permissionsCache = [...DEFAULT_PERMISSIONS];
      }
    } catch (err) {
      console.warn('Failed to fetch permissions from backend, using defaults:', err);
      permissionsCache = [...DEFAULT_PERMISSIONS];
    }
    
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
   * Create a new permission
   * Not supported by backend as permissions are static code definitions.
   */
  async createPermission(permission: Omit<Permission, 'id'>): Promise<Permission> {
    console.warn("createPermission: Backend does not support dynamic permission creation.");
    // Return a dummy to satisfy interface/UI but don't persist
    return { ...permission, id: `temp-${Date.now()}` };
  }

  /**
   * Update an existing permission
   * Not supported by backend.
   */
  async updatePermission(id: string, permissionUpdate: Partial<Permission>): Promise<Permission | null> {
    console.warn("updatePermission: Backend does not support dynamic permission updates.");
    const permissions = await this.getAllPermissions();
    const existing = permissions.find(p => p.id === id);
    if (!existing) return null;
    return { ...existing, ...permissionUpdate };
  }

  /**
   * Delete a permission
   * Not supported by backend.
   */
  async deletePermission(id: string): Promise<boolean> {
    console.warn("deletePermission: Backend does not support permission deletion.");
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
