import React from 'react'
import { render, screen } from '@testing-library/react'
import UsersPage from '@/app/users/page'

// Mock dependencies
const mockPush = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

jest.mock('@/store/userStore', () => ({
  useUserStore: () => ({
    user: { id: '1', role: 'admin' },
    isAuthenticated: true,
    isLoading: false,
    allUsers: [
      { id: '1', name: 'Admin User', email: 'admin@test.com', role: 'admin', is_active: true },
      { id: '2', name: 'Employee User', email: 'emp@test.com', role: 'employee', is_active: true },
    ],
    fetchAllUsers: jest.fn(),
  }),
}))

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    deleteUser: jest.fn(),
  },
}))

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

jest.mock('@/components/layout', () => {
  return function MockLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid="layout">{children}</div>
  }
})

jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>
  }
})

describe('UsersPage', () => {
  beforeEach(() => {
    mockPush.mockClear()
  })

  it('renders users page', () => {
    render(<UsersPage />)
    expect(screen.getByTestId('layout')).toBeInTheDocument()
    expect(screen.getByText(/User Management/)).toBeInTheDocument()
  })

  it('renders without crashing', () => {
    render(<UsersPage />)
    // Component should render successfully
    expect(document.body).toBeTruthy()
  })
})

