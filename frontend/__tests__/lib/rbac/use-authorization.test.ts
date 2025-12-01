import { renderHook } from '@testing-library/react'
import { useAuthorization } from '@/lib/rbac/use-authorization'
import { Resource, Action, UserType } from '@/lib/rbac/models'

// Mock auth-context
const mockUser = {
  id: '1',
  userType: UserType.ADMIN,
  role: 'admin',
}

const mockHasPermission = jest.fn()
const mockHasUserPermission = jest.fn()
const mockRefreshUser = jest.fn()

jest.mock('@/lib/rbac/auth-context', () => ({
  useAuth: () => ({
    user: mockUser,
    hasPermission: mockHasPermission,
    hasUserPermission: mockHasUserPermission,
    refreshUser: mockRefreshUser,
  }),
}))

describe('useAuthorization', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUser.userType = UserType.ADMIN
    mockUser.role = 'admin'
  })

  it('returns authorization methods', () => {
    const { result } = renderHook(() => useAuthorization())
    
    expect(result.current).toHaveProperty('hasPermission')
    expect(result.current).toHaveProperty('hasUserPermission')
    expect(result.current).toHaveProperty('isAdmin')
    expect(result.current).toHaveProperty('isFinanceAdmin')
    expect(result.current).toHaveProperty('isAccountant')
    expect(result.current).toHaveProperty('isEmployee')
    expect(result.current).toHaveProperty('hasRole')
    expect(result.current).toHaveProperty('hasUserType')
    expect(result.current).toHaveProperty('refreshUser')
  })

  it('isAdmin returns true for admin user', () => {
    mockUser.userType = UserType.ADMIN
    const { result } = renderHook(() => useAuthorization())
    expect(result.current.isAdmin()).toBe(true)
  })

  it('isAdmin returns true for finance admin user', () => {
    mockUser.userType = UserType.FINANCE_ADMIN
    const { result } = renderHook(() => useAuthorization())
    expect(result.current.isAdmin()).toBe(true)
  })

  it('isFinanceAdmin returns true for finance admin', () => {
    mockUser.userType = UserType.FINANCE_ADMIN
    const { result } = renderHook(() => useAuthorization())
    expect(result.current.isFinanceAdmin()).toBe(true)
  })

  it('isAccountant returns true for accountant', () => {
    mockUser.userType = UserType.ACCOUNTANT
    const { result } = renderHook(() => useAuthorization())
    expect(result.current.isAccountant()).toBe(true)
  })

  it('isEmployee returns true for employee', () => {
    mockUser.userType = UserType.EMPLOYEE
    const { result } = renderHook(() => useAuthorization())
    expect(result.current.isEmployee()).toBe(true)
  })

  it('hasRole checks user role correctly', () => {
    mockUser.role = 'admin'
    const { result } = renderHook(() => useAuthorization())
    expect(result.current.hasRole('admin')).toBe(true)
    expect(result.current.hasRole('manager')).toBe(false)
  })

  it('hasRole works with array of roles', () => {
    mockUser.role = 'admin'
    const { result } = renderHook(() => useAuthorization())
    expect(result.current.hasRole(['admin', 'manager'])).toBe(true)
    expect(result.current.hasRole(['manager', 'accountant'])).toBe(false)
  })

  it('hasUserType checks user type correctly', () => {
    mockUser.userType = UserType.ADMIN
    const { result } = renderHook(() => useAuthorization())
    expect(result.current.hasUserType(UserType.ADMIN)).toBe(true)
    expect(result.current.hasUserType(UserType.EMPLOYEE)).toBe(false)
  })

  it('hasUserType works with array of user types', () => {
    mockUser.userType = UserType.ADMIN
    const { result } = renderHook(() => useAuthorization())
    expect(result.current.hasUserType([UserType.ADMIN, UserType.FINANCE_ADMIN])).toBe(true)
    expect(result.current.hasUserType([UserType.EMPLOYEE, UserType.ACCOUNTANT])).toBe(false)
  })

  it('returns false when user is null', () => {
    jest.mock('@/lib/rbac/auth-context', () => ({
      useAuth: () => ({
        user: null,
        hasPermission: mockHasPermission,
        hasUserPermission: mockHasUserPermission,
        refreshUser: mockRefreshUser,
      }),
    }))

    const { result } = renderHook(() => useAuthorization())
    expect(result.current.isAdmin()).toBe(false)
    expect(result.current.hasRole('admin')).toBe(false)
  })
})

