import { render, screen, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '@/components/AuthProvider'
import useUserStore from '@/store/userStore'
import apiClient from '@/lib/api'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock dependencies
jest.mock('@/store/userStore')
jest.mock('@/lib/api')
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}))

const mockUseUserStore = useUserStore as jest.MockedFunction<typeof useUserStore>

const TestComponent = () => {
  const auth = useAuth()
  return (
    <div>
      <div data-testid="isAuthenticated">{auth.isAuthenticated ? 'true' : 'false'}</div>
      <div data-testid="isLoading">{auth.isLoading ? 'true' : 'false'}</div>
      <div data-testid="user">{auth.user ? auth.user.email : 'null'}</div>
    </div>
  )
}

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  )
}

describe('AuthProvider Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
  })

  it('provides auth context to children', () => {
    mockUseUserStore.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
      canManageUsers: jest.fn(() => false),
      canViewAllData: jest.fn(() => false),
      canApproveTransactions: jest.fn(() => false),
      canSubmitTransactions: jest.fn(() => false),
      getCurrentUser: jest.fn(),
    } as any)

    render(<TestComponent />, { wrapper: createWrapper() })

    expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false')
    expect(screen.getByTestId('isLoading')).toHaveTextContent('false')
  })

  it('provides user data when authenticated', () => {
    const mockUser = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'admin' as const,
      isActive: true,
      createdAt: '2024-01-01',
    }

    mockUseUserStore.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
      canManageUsers: jest.fn(() => true),
      canViewAllData: jest.fn(() => true),
      canApproveTransactions: jest.fn(() => true),
      canSubmitTransactions: jest.fn(() => true),
      getCurrentUser: jest.fn(),
    } as any)

    render(<TestComponent />, { wrapper: createWrapper() })

    expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true')
    expect(screen.getByTestId('user')).toHaveTextContent('test@example.com')
  })

  it('calls getCurrentUser when token exists and user is null', async () => {
    localStorage.setItem('access_token', 'test-token')
    const mockGetCurrentUser = jest.fn().mockResolvedValue(undefined)

    mockUseUserStore.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
      canManageUsers: jest.fn(() => false),
      canViewAllData: jest.fn(() => false),
      canApproveTransactions: jest.fn(() => false),
      canSubmitTransactions: jest.fn(() => false),
      getCurrentUser: mockGetCurrentUser,
    } as any)

    render(<TestComponent />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(mockGetCurrentUser).toHaveBeenCalled()
    })
  })

  it('does not call getCurrentUser when user already exists', () => {
    localStorage.setItem('access_token', 'test-token')
    const mockGetCurrentUser = jest.fn()

    mockUseUserStore.mockReturnValue({
      user: {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'admin' as const,
        isActive: true,
      },
      isAuthenticated: true,
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
      canManageUsers: jest.fn(() => false),
      canViewAllData: jest.fn(() => false),
      canApproveTransactions: jest.fn(() => false),
      canSubmitTransactions: jest.fn(() => false),
      getCurrentUser: mockGetCurrentUser,
    } as any)

    render(<TestComponent />, { wrapper: createWrapper() })

    expect(mockGetCurrentUser).not.toHaveBeenCalled()
  })

  it('provides permission methods', () => {
    mockUseUserStore.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
      canManageUsers: jest.fn(() => true),
      canViewAllData: jest.fn(() => true),
      canApproveTransactions: jest.fn(() => true),
      canSubmitTransactions: jest.fn(() => true),
      getCurrentUser: jest.fn(),
    } as any)

    const PermissionTest = () => {
      const auth = useAuth()
      return (
        <div>
          <div data-testid="canManage">{auth.canManageUsers() ? 'true' : 'false'}</div>
          <div data-testid="canView">{auth.canViewAllData() ? 'true' : 'false'}</div>
        </div>
      )
    }

    render(<PermissionTest />, { wrapper: createWrapper() })

    expect(screen.getByTestId('canManage')).toHaveTextContent('true')
    expect(screen.getByTestId('canView')).toHaveTextContent('true')
  })
})

describe('useAuth Hook', () => {
  it('throws error when used outside AuthProvider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    const TestComponent = () => {
      useAuth()
      return null
    }

    expect(() => {
      render(<TestComponent />)
    }).toThrow('useAuth must be used within an AuthProvider')

    consoleSpy.mockRestore()
  })
})

