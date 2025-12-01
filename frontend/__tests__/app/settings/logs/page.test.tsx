import React from 'react'
import { render, screen } from '@testing-library/react'
import LogsPage from '@/app/settings/logs/page'

// Mock dependencies
jest.mock('@/lib/rbac', () => ({
  ComponentGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  ComponentId: 'settings',
}))

jest.mock('@/lib/rbac/auth-context', () => ({
  useAuth: () => ({
    user: { id: '1', role: 'admin' },
    isAuthenticated: true,
  }),
}))

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    getLogs: jest.fn().mockResolvedValue([]),
    downloadLogs: jest.fn(),
  },
}))

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

describe('LogsPage', () => {
  it('renders page component', () => {
    render(<LogsPage />)
    // Page should render without crashing
    expect(document.body).toBeTruthy()
  })
})

