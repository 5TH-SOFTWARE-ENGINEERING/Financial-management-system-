import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import UserRolesPage from '@/app/settings/users-roles/user-roles/page'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

jest.mock('@/lib/rbac/auth-context', () => ({
  useAuth: () => ({
    user: { id: '1', role: 'admin' },
    isAuthenticated: true,
  }),
}))

const mockFetchAllUsers = jest.fn()

jest.mock('@/store/userStore', () => ({
  useUserStore: () => ({
    user: { id: '1', role: 'admin' },
    fetchAllUsers: mockFetchAllUsers,
    allUsers: [],
  }),
}))

jest.mock('@/lib/rbac/permission-gate', () => ({
  PermissionGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    getUsers: jest.fn().mockResolvedValue({ data: [] }),
    updateUserRole: jest.fn(),
  },
}))

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

describe('UserRolesPage', () => {
  it('renders page component', async () => {
    render(<UserRolesPage />)
    
    // Wait for the title to appear after loading completes
    await waitFor(() => {
      expect(screen.getByText(/User Role Assignment/i)).toBeInTheDocument()
    }, { timeout: 5000 })
  })
})

