import { Permission, DEFAULT_PERMISSIONS, Resource, Action } from '../rbac/models';

interface PermissionServiceInterface {
  getAllPermissions(): Promise<Permission[]>;
  getPermissionById(id: string): Promise<Permission | null>;
  createPermission(permission: Omit<Permission, 'id'>): Promise<Permission>;
  updatePermission(id: string, permission: Partial<Permission>): Promise<Permission | null>;
  deletePermission(id: string): Promise<boolean>;
  getPermissionsByResource(resource: Resource): Promise<Permission[]>;
  getPermissionsByAction(action: Action): Promise<Permission[]>;
}

// Mock storage
let permissions = [...DEFAULT_PERMISSIONS];

export class PermissionService implements PermissionServiceInterface {

  // get all permissions
  async getAllPermissions(): Promise<Permission[]> {
    return [...permissions];
  }

  // get permission by ID 
  async getPermissionById(id: string): Promise<Permission | null> {
    const permission = permissions.find(p => p.id === id);
    return permission ? { ...permission } : null;
  }

  // create a new permission
  async createPermission(permission: Omit<Permission, 'id'>): Promise<Permission> {
    const newPermission: Permission = {
      ...permission,
      id: `permission-${Date.now()}`
    };
    permissions.push(newPermission);
    return { ...newPermission };
  }

  //update an existing permission
  async updatePermission(id: string, permissionUpdate: Partial<Permission>): Promise<Permission | null> {
    const index = permissions.findIndex(p => p.id === id);
    if (index === -1) return null;

    const updatedPermission = {
      ...permissions[index],
      ...permissionUpdate,
      id // Ensure ID doesn't change
    };
    
    permissions[index] = updatedPermission;
    return { ...updatedPermission };
  }

  // delete a permission by id
  async deletePermission(id: string): Promise<boolean> {
    const initialLength = permissions.length;
    permissions = permissions.filter(p => p.id !== id);
    return permissions.length < initialLength;
  }

  //get permissions by resource
  async getPermissionsByResource(resource: Resource): Promise<Permission[]> {
    return permissions.filter(p => p.resource === resource);
  }

  //get permissions by actions
  async getPermissionsByAction(action: Action): Promise<Permission[]> {
    return permissions.filter(p => p.action === action);
  }

  //get permissions by resource and actions 
  async getPermissionByResourceAndAction(resource: Resource, action: Action): Promise<Permission | null> {
    const permission = permissions.find(p => p.resource === resource && p.action === action);
    return permission ? { ...permission } : null;
  }
 
  //check if a permission exists
  async hasPermission(resource: Resource, action: Action): Promise<boolean> {
    return permissions.some(p => p.resource === resource && p.action === action);
  }
}

// Export a singleton instance
export const permissionService = new PermissionService(); 