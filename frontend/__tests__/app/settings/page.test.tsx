import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import SettingsPage from '@/app/settings/page'
import { AuthProvider } from '@/lib/rbac/auth-context'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock dependencies
jest.mock('next/navigation', () => ({
  usePathname: () => '/settings',
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
}))

jest.mock('@/lib/rbac', () => ({
  ComponentGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  ComponentId: 'settings',
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
  }
})

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    getCurrentUser: jest.fn().mockResolvedValue({
      data: { id: 1, email: 'admin@test.com', role: 'admin' },
    }),
    getAdminSystemStats: jest.fn().mockResolvedValue({
      data: {
        totalUsers: 10,
        activeUsers: 8,
        totalRevenue: 100000,
        totalExpenses: 50000,
      },
    }),
    getSystemSettings: jest.fn().mockResolvedValue({
      data: {
        maintenanceMode: false,
        allowRegistrations: true,
      },
    }),
    getSystemHealth: jest.fn().mockResolvedValue({
      data: {
        status: 'healthy',
        database: 'connected',
      },
    }),
  },
}))

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

describe('SettingsPage', () => {
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
    // Suppress act() warnings for async state updates
    const consoleError = jest.spyOn(console, 'error').mockImplementation((message) => {
      if (typeof message === 'string' && message.includes('not wrapped in act')) {
        return
      }
      // Log other errors
      console.error(message)
    })

    render(<SettingsPage />, { wrapper: createWrapper() })
    
    // Wait for async operations to complete
    await waitFor(() => {
      expect(screen.getByTestId('layout')).toBeInTheDocument()
    }, { timeout: 3000 })

    consoleError.mockRestore()
  })
})

