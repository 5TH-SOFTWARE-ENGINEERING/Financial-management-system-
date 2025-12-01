import React from 'react'
import { render, screen } from '@testing-library/react'
import DashboardPage from '@/app/dashboard/page'

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

jest.mock('@/lib/rbac', () => ({
  ComponentGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  ComponentId: 'dashboard',
}))

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    getStats: jest.fn().mockResolvedValue({
      totalUsers: 0,
      totalRevenue: 0,
      totalExpenses: 0,
    }),
    getRecentActivities: jest.fn().mockResolvedValue([]),
  },
}))

jest.mock('@/components/layout', () => {
  return function MockLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid="layout">{children}</div>
  }
})

describe('DashboardPage', () => {
  it('renders page component', () => {
    render(<DashboardPage />)
    expect(screen.getByTestId('layout')).toBeInTheDocument()
  })
})

