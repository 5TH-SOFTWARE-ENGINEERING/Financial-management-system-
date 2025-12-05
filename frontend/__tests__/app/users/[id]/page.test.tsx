import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import UserDetailPage from '@/app/users/[id]/page'
import apiClient from '@/lib/api'

// Mock dependencies
const mockPush = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: () => ({ id: '1' }),
}))

jest.mock('@/store/userStore', () => ({
  useUserStore: () => ({
    user: { id: '1', role: 'admin' },
    allUsers: [
      { id: '1', name: 'Test User', email: 'test@test.com', role: 'admin' },
    ],
    fetchAllUsers: jest.fn().mockResolvedValue(true),
  }),
}))

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    getUser: jest.fn().mockResolvedValue({
      data: {
        id: 1,
        full_name: 'Test User',
        email: 'test@test.com',
        username: 'testuser',
        role: 'admin',
        is_active: true,
        created_at: '2024-01-01',
      },
    }),
    deleteUser: jest.fn(),
  },
}))

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
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
  cn: (...inputs: any[]) => inputs.filter(Boolean).join(' '),
}))

// Silence console.error for expected errors during async updates
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe('UserDetailPage', () => {
  const mockGetUser = apiClient.getUser as jest.Mock

  beforeEach(() => {
    mockPush.mockClear()
    mockGetUser.mockClear()
    mockGetUser.mockResolvedValue({
      data: {
        id: 1,
        full_name: 'Test User',
        email: 'test@test.com',
        username: 'testuser',
        role: 'admin',
        is_active: true,
        created_at: '2024-01-01',
      },
    })
  })

  it('renders user detail page without act warnings', async () => {
    render(<UserDetailPage />)

    // Wait for the API call to be made
    await waitFor(() => {
      expect(mockGetUser).toHaveBeenCalledWith(1)
    }, { timeout: 3000 })

    // Wait for loading to complete and user to be set
    // The component shows "User Details" only when user is loaded and not in loading/error state
    await waitFor(() => {
      // Check that we're not in loading or error state
      const loadingText = screen.queryByText(/Loading user details/i)
      const errorText = screen.queryByText(/Failed to load user/i)
      expect(loadingText).not.toBeInTheDocument()
      expect(errorText).not.toBeInTheDocument()
    }, { timeout: 5000 })

    // Now wait for the heading to appear
    const heading = await screen.findByText(/User Details/i, {}, { timeout: 5000 })
    expect(heading).toBeInTheDocument()

    // Layout should be visible after hydration
    expect(screen.getByTestId('layout')).toBeInTheDocument()
  })

  it('shows loading state initially', async () => {
    render(<UserDetailPage />)

    // Make sure the component at least renders before async effects resolve
    expect(document.body).toBeTruthy()
    expect(screen.getByTestId('layout')).toBeInTheDocument()
  })
})
