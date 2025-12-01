import React from 'react'
import { render, screen } from '@testing-library/react'
import Navbar from '@/components/common/Navbar'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  usePathname: () => '/dashboard',
}))

jest.mock('@/lib/rbac/auth-context', () => ({
  useAuth: () => ({
    user: { id: '1', full_name: 'Test User', email: 'test@example.com' },
    isAuthenticated: true,
    logout: jest.fn(),
  }),
}))

jest.mock('@/store/userStore', () => ({
  useUserStore: () => ({
    user: { id: '1', name: 'Test User' },
  }),
}))

jest.mock('@/lib/rbac', () => ({
  ComponentGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  ComponentId: 'header',
}))

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    search: jest.fn(),
    getNotifications: jest.fn().mockResolvedValue([]),
  },
}))

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>
  }
})

describe('Navbar', () => {
  it('renders navbar component', () => {
    render(<Navbar />)
    // Navbar should render without crashing
    expect(document.body).toBeTruthy()
  })
})

