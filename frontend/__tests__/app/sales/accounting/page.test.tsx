import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import SalesAccountingPage from '@/app/sales/accounting/page'

// Generic API mock returning resolved empty data
jest.mock('@/lib/api', () => {
  const mockApiClient = new Proxy({}, { get: () => jest.fn().mockResolvedValue({ data: [] }) })
  return {
    __esModule: true,
    default: mockApiClient,
  }
})

jest.mock('@/lib/rbac/auth-context', () => ({
  useAuth: () => ({
    user: { id: '1', role: 'admin', email: 'admin@test.com' },
    isAuthenticated: true,
  }),
}))

const mockStore = {
  getState: () => ({
    user: { id: '1', role: 'admin', name: 'Admin', email: 'admin@test.com', isActive: true },
    isAuthenticated: true,
    accessToken: 'token',
  }),
}
jest.mock('@/store/userStore', () => ({
  __esModule: true,
  default: () => mockStore.getState(),
  useUserStore: () => mockStore.getState(),
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

describe('SalesAccountingPage', () => {
  it('renders page component', async () => {
    render(<SalesAccountingPage />)
    await waitFor(() => {
      expect(screen.getByTestId('layout')).toBeInTheDocument()
    })
  })
})


