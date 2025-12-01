import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import ProtectedLayout from '@/app/(protected)/layout'

// Mock dependencies
const mockPush = jest.fn()
const mockRefreshUser = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

jest.mock('@/lib/rbac/auth-context', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    isLoading: false,
    user: { id: '1', role: 'admin' },
    refreshUser: mockRefreshUser,
  }),
}))

jest.mock('@/components/common/Navbar', () => {
  return function MockNavbar() {
    return <div data-testid="navbar">Navbar</div>
  }
})

jest.mock('@/components/common/Sidebar', () => {
  return function MockSidebar() {
    return <div data-testid="sidebar">Sidebar</div>
  }
})

describe('ProtectedLayout', () => {
  beforeEach(() => {
    mockPush.mockClear()
    mockRefreshUser.mockClear()
  })

  it('renders layout when authenticated', () => {
    render(
      <ProtectedLayout>
        <div>Test Content</div>
      </ProtectedLayout>
    )
    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
    expect(screen.getByTestId('navbar')).toBeInTheDocument()
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('renders children when user is authenticated', () => {
    render(
      <ProtectedLayout>
        <div>Test Content</div>
      </ProtectedLayout>
    )
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })
})

