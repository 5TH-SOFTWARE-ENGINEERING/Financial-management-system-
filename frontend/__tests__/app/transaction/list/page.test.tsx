import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import TransactionListPage from '@/app/transaction/list/page'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    getTransactions: jest.fn().mockResolvedValue({ data: [] }),
    getRevenues: jest.fn().mockResolvedValue([]),
    getExpenses: jest.fn().mockResolvedValue([]),
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

describe('TransactionListPage', () => {
  it('renders page component', async () => {
    render(<TransactionListPage />)
    
    // Wait for layout to appear after loading completes
    await waitFor(() => {
      expect(screen.getByTestId('layout')).toBeInTheDocument()
    }, { timeout: 5000 })
  })
})

