import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import ProfilePage from '@/app/profile/page'

// Mock dependencies
jest.mock('@/lib/rbac/auth-context', () => ({
  useAuth: () => ({
    user: {
      id: '1',
      email: 'test@example.com',
      full_name: 'Test User',
      role: 'admin',
    },
    isAuthenticated: true,
  }),
}))

jest.mock('@/lib/rbac', () => ({
  ComponentGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  ComponentId: 'profile',
  UserType: {
    ADMIN: 'ADMIN',
  },
}))

jest.mock('@/store/userStore', () => ({
  useUserStore: () => ({
    user: { id: '1', name: 'Test User', email: 'test@example.com', role: 'admin' },
  }),
}))

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    getCurrentUser: jest.fn().mockResolvedValue({
      data: {
        id: 1,
        email: 'test@example.com',
        full_name: 'Test User',
        username: 'testuser',
        role: 'admin',
        is_active: true,
      },
    }),
    updateUser: jest.fn(),
  },
}))

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

// Mock utility functions
jest.mock('@/lib/utils', () => ({
  getInitials: (name: string) => name?.split(' ').map((n: string) => n[0]).join('') || '',
  formatUserType: (type: string) => type || 'User',
  getUserColor: () => '#000000',
}))

describe('ProfilePage', () => {
  it('renders profile page structure', async () => {
    render(<ProfilePage />)
    
    // Wait for Profile heading to appear after loading completes
    await waitFor(() => {
      expect(screen.getByText(/Profile/i)).toBeInTheDocument()
    }, { timeout: 5000 })
  })
})

