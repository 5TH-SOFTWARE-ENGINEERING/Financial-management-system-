import React from 'react'
import { render, screen, waitFor } from '@/__tests__/utils/test-utils'
import LogsPage from '@/app/settings/logs/page'

// Mock dependencies
jest.mock('@/lib/rbac', () => ({
  ComponentGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  ComponentId: {
    SETTINGS_VIEW: 'settings.view',
  },
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
    getAuditLogs: jest.fn().mockResolvedValue({ data: [] }),
    getUsers: jest.fn().mockResolvedValue({ data: [] }),
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
  it('renders page component', async () => {
    render(<LogsPage />)

    // Wait for "Audit Logs" heading to appear after loading completes
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Audit Logs/i })).toBeInTheDocument()
    }, { timeout: 5000 })
  })
})

