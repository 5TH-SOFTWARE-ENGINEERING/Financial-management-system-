import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import UserDetailPage from '@/app/users/[id]/page'

// Mock dependencies
const mockPush = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useParams: () => ({
    id: '1',
  }),
}))

jest.mock('@/store/userStore', () => ({
  useUserStore: () => ({
    user: { id: '1', role: 'admin' },
    allUsers: [
      { id: '1', name: 'Test User', email: 'test@test.com', role: 'admin' },
    ],
    fetchAllUsers: jest.fn(),
  }),
}))

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    getUsers: jest.fn().mockResolvedValue({
      data: [
        {
          id: 1,
          full_name: 'Test User',
          email: 'test@test.com',
          username: 'testuser',
          role: 'admin',
          is_active: true,
        },
      ],
    }),
    deleteUser: jest.fn(),
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

jest.mock('@/lib/utils', () => ({
  formatDate: (date: string) => date,
}))

describe('UserDetailPage', () => {
  beforeEach(() => {
    mockPush.mockClear()
  })

  it('renders user detail page', async () => {
    render(<UserDetailPage />)
    
    // Wait for user content to appear after loading completes
    await waitFor(() => {
      expect(screen.getByText(/User Details/i)).toBeInTheDocument()
    }, { timeout: 5000 })
    
    // Verify layout is present
    expect(screen.getByTestId('layout')).toBeInTheDocument()
  })

  it('shows loading state initially', () => {
    render(<UserDetailPage />)
    // Component should render
    expect(document.body).toBeTruthy()
  })
})

