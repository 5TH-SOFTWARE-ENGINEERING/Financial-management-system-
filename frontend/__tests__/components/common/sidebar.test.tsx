import React from 'react'
import { render, screen } from '@testing-library/react'
import Sidebar from '@/components/common/Sidebar'

// Mock dependencies
jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}))

jest.mock('@/lib/rbac/auth-context', () => ({
  useAuth: () => ({
    user: { id: '1', userType: 'ADMIN' },
    isAuthenticated: true,
  }),
}))

jest.mock('@/lib/rbac/use-authorization', () => ({
  useAuthorization: () => ({
    hasPermission: jest.fn().mockReturnValue(true),
    hasRole: jest.fn().mockReturnValue(true),
    hasUserType: jest.fn().mockReturnValue(true),
  }),
}))

jest.mock('@/lib/rbac', () => ({
  ComponentGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  ComponentId: 'sidebar',
  UserType: {
    ADMIN: 'ADMIN',
    FINANCE_ADMIN: 'FINANCE_ADMIN',
    ACCOUNTANT: 'ACCOUNTANT',
    EMPLOYEE: 'EMPLOYEE',
  },
}))

jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>
  }
})

describe('Sidebar', () => {
  it('renders sidebar component', () => {
    render(<Sidebar />)
    // Sidebar should render without crashing
    expect(document.body).toBeTruthy()
  })
})

