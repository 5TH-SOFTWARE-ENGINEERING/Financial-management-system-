import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
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
    getDashboardOverview: jest.fn().mockResolvedValue({ data: {} }),
    getDashboardRecentActivity: jest.fn().mockResolvedValue({ data: [] }),
    getApprovals: jest.fn().mockResolvedValue({ data: [] }),
  },
}))

jest.mock('@/components/layout', () => {
  return function MockLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid="layout">{children}</div>
  }
})

describe('DashboardPage', () => {
  it('renders page component', async () => {
    render(<DashboardPage />)
    
    // Wait for layout to appear after loading completes
    await waitFor(() => {
      expect(screen.getByTestId('layout')).toBeInTheDocument()
    }, { timeout: 5000 })
  })
})

