import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import TransactionListPage from '@/app/transaction/list/page'

// --------------------
// Router mock
// --------------------
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

// --------------------
// API mock
// --------------------
jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    getTransactions: jest.fn().mockResolvedValue({ data: [] }),
    getRevenues: jest.fn().mockResolvedValue([]),
    getExpenses: jest.fn().mockResolvedValue([]),
  },
}))

// --------------------
// Auth mock
// --------------------
jest.mock('@/lib/rbac/auth-context', () => ({
  useAuth: () => ({
    user: {
      id: '1',
      role: 'admin',
      username: 'admin',
      email: 'admin@test.com',
    },
    isAuthenticated: true,
  }),
}))

// --------------------
// Toast mock
// --------------------
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

// --------------------
// Layout mock (FIXED)
// --------------------
jest.mock('@/components/layout', () => {
  const MockLayout = ({ children }: { children: React.ReactNode }) => (
    <div data-testid="layout">{children}</div>
  )

  MockLayout.displayName = 'MockLayout'
  return MockLayout
})

// --------------------
// next/link mock (FIXED)
// --------------------
jest.mock('next/link', () => {
  const Link = ({
    children,
    href,
  }: {
    children: React.ReactNode
    href: string
  }) => <a href={href}>{children}</a>

  Link.displayName = 'NextLinkMock'
  return Link
})

// --------------------
// Tests
// --------------------
describe('TransactionListPage', () => {
  it('renders page component', async () => {
    render(<TransactionListPage />)

    await waitFor(() => {
      expect(screen.getByTestId('layout')).toBeInTheDocument()
    })
  })
})
