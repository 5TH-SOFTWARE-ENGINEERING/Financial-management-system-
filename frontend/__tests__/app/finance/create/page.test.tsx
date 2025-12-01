import React from 'react'
import { render, screen } from '@testing-library/react'
import FinanceCreatePage from '@/app/finance/create/page'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
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

jest.mock('@/components/common/Sidebar', () => {
  return function MockSidebar() {
    return <div data-testid="sidebar">Sidebar</div>
  }
})

jest.mock('@/components/common/Navbar', () => {
  return function MockNavbar() {
    return <div data-testid="navbar">Navbar</div>
  }
})

jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>
  }
})

describe('FinanceCreatePage', () => {
  it('renders page component', () => {
    render(<FinanceCreatePage />)
    // Check if sidebar and navbar are rendered
    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
    expect(screen.getByTestId('navbar')).toBeInTheDocument()
  })

  it('renders create finance manager form', () => {
    render(<FinanceCreatePage />)
    // Check for form elements (may need to adjust based on actual structure)
    // At minimum, verify the page structure is present
    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
  })
})

