import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import NotificationsPage from '@/app/notifications/page'
import { AuthProvider } from '@/lib/rbac/auth-context'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}))

jest.mock('@/store/userStore', () => {
  const mockUser = {
    id: '1',
    name: 'Test User',
    email: 'admin@test.com',
    role: 'admin' as const,
    isActive: true,
  }
  
  return {
    __esModule: true,
    default: jest.fn(() => ({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      error: null,
      login: jest.fn(),
      logout: jest.fn(),
      getCurrentUser: jest.fn(),
    })),
    useUserStore: jest.fn(() => ({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      error: null,
      login: jest.fn(),
      logout: jest.fn(),
      getCurrentUser: jest.fn(),
    })),
  }
})

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    getNotifications: jest.fn().mockResolvedValue({ data: [] }),
    markNotificationAsRead: jest.fn(),
    deleteNotification: jest.fn(),
    getCurrentUser: jest.fn().mockResolvedValue({
      data: { id: 1, email: 'admin@test.com', role: 'admin' },
    }),
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

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  )
}

describe('NotificationsPage', () => {
  beforeEach(() => {
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => null),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    })
  })

  it('renders page component', async () => {
    render(<NotificationsPage />, { wrapper: createWrapper() })
    
    // Wait for the heading to appear, which indicates loading is complete
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Notifications/i })).toBeInTheDocument()
    }, { timeout: 5000 })
    
    // Verify layout is present
    expect(screen.getByTestId('layout')).toBeInTheDocument()
  })
})

