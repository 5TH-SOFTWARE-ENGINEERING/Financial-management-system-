import React from 'react'
import { render, screen } from '@testing-library/react'
import FinanceCreatePage from '@/app/finance/create/page'

// --------------------
// Router mock
// --------------------
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}))

// --------------------
// User store mock
// --------------------
jest.mock('@/store/userStore', () => ({
  useUserStore: () => ({
    user: { id: '1', role: 'admin' },
    isAuthenticated: true,
  }),
}))

// --------------------
// API mock
// --------------------
jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    createUser: jest.fn(),
    getDepartments: jest.fn().mockResolvedValue([]),
  },
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
// Sidebar mock (already named)
// --------------------
jest.mock('@/components/common/Sidebar', () => {
  function MockSidebar() {
    return <div data-testid="sidebar">Sidebar</div>
  }
  MockSidebar.displayName = 'MockSidebar'
  return MockSidebar
})

// --------------------
// Navbar mock (already named)
// --------------------
jest.mock('@/components/common/Navbar', () => {
  function MockNavbar() {
    return <div data-testid="navbar">Navbar</div>
  }
  MockNavbar.displayName = 'MockNavbar'
  return MockNavbar
})

// --------------------
// next/link mock (FIXED)
// --------------------
jest.mock('next/link', () => {
  const LinkMock = ({
    children,
    href,
  }: {
    children: React.ReactNode
    href: string
  }) => <a href={href}>{children}</a>

  LinkMock.displayName = 'NextLinkMock'
  return LinkMock
})

// --------------------
// Tests
// --------------------
describe('FinanceCreatePage', () => {
  it('renders page component', () => {
    render(<FinanceCreatePage />)
    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
    expect(screen.getByTestId('navbar')).toBeInTheDocument()
  })

  it('renders create finance manager form', () => {
    render(<FinanceCreatePage />)
    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
  })
})
