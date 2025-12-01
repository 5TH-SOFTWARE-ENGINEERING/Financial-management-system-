import React from 'react'
import { render, screen } from '@testing-library/react'
import AccountantsCreatePage from '@/app/accountants/create/page'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

jest.mock('@/store/userStore', () => ({
  useUserStore: () => ({
    user: { id: '1', role: 'admin' },
    isAuthenticated: true,
  }),
}))

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    createUser: jest.fn(),
    getDepartments: jest.fn().mockResolvedValue([]),
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

describe('AccountantsCreatePage', () => {
  it('renders page component', () => {
    render(<AccountantsCreatePage />)
    expect(screen.getByTestId('layout')).toBeInTheDocument()
  })
})

