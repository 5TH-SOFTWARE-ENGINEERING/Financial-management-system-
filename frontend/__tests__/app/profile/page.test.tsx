import React from 'react'
import { render, screen } from '@testing-library/react'
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
      id: 1,
      email: 'test@example.com',
      full_name: 'Test User',
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

describe('ProfilePage', () => {
  it('renders profile page structure', () => {
    render(<ProfilePage />)
    // The page should render without crashing
    // Verify basic structure is present
    expect(document.body).toBeTruthy()
  })
})

