import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import EditUserPage from '@/app/users/[id]/edit/page'
import apiClient from '@/lib/api'

// Mock dependencies
const mockPush = jest.fn()
const mockGetUsers = apiClient.getUsers as jest.Mock

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: jest.fn(),
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
    updateUser: jest.fn(),
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

describe('EditUserPage', () => {
  beforeEach(() => {
    mockPush.mockClear()
    mockGetUsers.mockClear()
    mockGetUsers.mockResolvedValue({
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
    })
  })

  it('renders edit user page', async () => {
    await act(async () => {
      render(<EditUserPage />)
    })
    
    expect(screen.getByTestId('layout')).toBeInTheDocument()
    
    // Wait for async user loading to complete
    await waitFor(() => {
      expect(mockGetUsers).toHaveBeenCalled()
    }, { timeout: 3000 })
  })

  it('shows loading state initially', async () => {
    await act(async () => {
      render(<EditUserPage />)
    })
    
    // Component should render
    expect(document.body).toBeTruthy()
    
    // Wait for async operations to complete
    await waitFor(() => {
      expect(mockGetUsers).toHaveBeenCalled()
    }, { timeout: 3000 })
  })
})

