import React from 'react'
import { render, screen } from '@testing-library/react'
import SearchPage from '@/app/search/page'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: jest.fn(() => null),
  }),
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

jest.mock('@/store/userStore', () => ({
  useUserStore: () => ({
    user: { id: '1', role: 'admin' },
  }),
}))

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    getUsers: jest.fn().mockResolvedValue([]),
    getRevenues: jest.fn().mockResolvedValue([]),
    getExpenses: jest.fn().mockResolvedValue([]),
    getProjects: jest.fn().mockResolvedValue([]),
    getDepartments: jest.fn().mockResolvedValue([]),
  },
}))

jest.mock('@/components/layout', () => {
  return function MockLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid="layout">{children}</div>
  }
})

describe('SearchPage', () => {
  it('renders page component', () => {
    render(<SearchPage />)
    expect(screen.getByTestId('layout')).toBeInTheDocument()
  })
})

