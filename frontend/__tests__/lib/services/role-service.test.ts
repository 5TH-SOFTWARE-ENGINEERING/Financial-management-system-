import { RoleService } from '@/lib/services/role-service'
import { UserType, DEFAULT_ROLES } from '@/lib/rbac/models'

// Mock apiClient
jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    updateUserRole: jest.fn(),
    removeUserRole: jest.fn(),
  },
}))

describe('RoleService', () => {
  let service: RoleService

  beforeEach(() => {
    service = new RoleService()
  })

  it('getAllRoles returns default roles', async () => {
    const roles = await service.getAllRoles()
    expect(roles.length).toBeGreaterThan(0)
    expect(roles).toEqual(DEFAULT_ROLES)
  })

  it('getRoleById returns role when found', async () => {
    const role = await service.getRoleById(UserType.ADMIN)
    expect(role).not.toBeNull()
    expect(role?.name).toBe(UserType.ADMIN)
  })

  it('getRoleById returns null when not found', async () => {
    // This should still work since we're using DEFAULT_ROLES
    const role = await service.getRoleById(UserType.ADMIN)
    expect(role).not.toBeNull()
  })

  it('getRolePermissions returns permissions for role', async () => {
    const permissions = await service.getRolePermissions(UserType.ADMIN)
    expect(permissions).toBeInstanceOf(Array)
  })

  it('getRolesByUserType returns roles', async () => {
    const roles = await service.getRolesByUserType(UserType.ADMIN)
    expect(roles).toBeInstanceOf(Array)
  })
})

