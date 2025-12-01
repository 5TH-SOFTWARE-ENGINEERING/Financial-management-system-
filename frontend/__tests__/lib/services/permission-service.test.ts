import { PermissionService } from '@/lib/services/permission-service'
import { Resource, Action, DEFAULT_PERMISSIONS } from '@/lib/rbac/models'

describe('PermissionService', () => {
  let service: PermissionService

  beforeEach(() => {
    service = new PermissionService()
  })

  it('getAllPermissions returns default permissions', async () => {
    const permissions = await service.getAllPermissions()
    expect(permissions.length).toBeGreaterThan(0)
    expect(permissions).toEqual(DEFAULT_PERMISSIONS)
  })

  it('getPermissionById returns permission when found', async () => {
    const permissions = await service.getAllPermissions()
    const firstPermission = permissions[0]
    const found = await service.getPermissionById(firstPermission.id)
    expect(found).toEqual(firstPermission)
  })

  it('getPermissionById returns null when not found', async () => {
    const found = await service.getPermissionById('non-existent-id')
    expect(found).toBeNull()
  })

  it('getPermissionsByResource returns filtered permissions', async () => {
    const permissions = await service.getPermissionsByResource(Resource.USERS)
    expect(permissions.every(p => p.resource === Resource.USERS)).toBe(true)
  })

  it('getPermissionsByAction returns filtered permissions', async () => {
    const permissions = await service.getPermissionsByAction(Action.READ)
    expect(permissions.every(p => p.action === Action.READ)).toBe(true)
  })

  it('getPermissionByResourceAndAction returns matching permission', async () => {
    const permission = await service.getPermissionByResourceAndAction(Resource.USERS, Action.READ)
    expect(permission).not.toBeNull()
    expect(permission?.resource).toBe(Resource.USERS)
    expect(permission?.action).toBe(Action.READ)
  })

  it('hasPermission returns true when permission exists', async () => {
    const hasPermission = await service.hasPermission(Resource.USERS, Action.READ)
    expect(hasPermission).toBe(true)
  })
})

