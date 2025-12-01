import React from 'react'
import { render, screen } from '@testing-library/react'
import HistoryPage from '@/app/settings/history/page'

// Mock dependencies
jest.mock('@/lib/rbac/auth-context', () => ({
  useAuth: () => ({
    user: { id: '1', role: 'admin' },
    isAuthenticated: true,
  }),
}))

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    getActivityHistory: jest.fn().mockResolvedValue([]),
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

describe('HistoryPage', () => {
  it('renders page component', () => {
    render(<HistoryPage />)
    expect(screen.getByTestId('layout')).toBeInTheDocument()
  })
})

