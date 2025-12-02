import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import DashboardPage from '@/app/dashboard/page'
import apiClient from '@/lib/api'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  usePathname: () => '/dashboard',
}))

jest.mock('@/lib/rbac/auth-context', () => ({
  useAuth: () => ({
    user: { 
      id: '1', 
      role: 'admin',
      username: 'admin',
      email: 'admin@test.com'
    },
    isAuthenticated: true,
  }),
}))

jest.mock('@/lib/rbac', () => ({
  ComponentGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  ComponentId: {
    SIDEBAR_DASHBOARD: 'sidebar.dashboard',
  },
}))

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    getDashboardOverview: jest.fn(),
    getDashboardRecentActivity: jest.fn(),
    getAdvancedKPIs: jest.fn(),
    getApprovals: jest.fn(),
    getRevenues: jest.fn(),
    getExpenses: jest.fn(),
  },
}))

jest.mock('@/components/layout', () => {
  return function MockLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid="layout">{children}</div>
  }
})

describe('DashboardPage', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks()
    
    // Set up default mock responses with proper structure
    ;(apiClient.getDashboardOverview as jest.Mock).mockResolvedValue({
      data: {
        financials: {
          total_revenue: 100000,
          total_expenses: 50000,
          profit: 50000,
          profit_margin: 50,
        },
        pending_approvals: 0,
      },
    })
    
    ;(apiClient.getDashboardRecentActivity as jest.Mock).mockResolvedValue({
      data: [],
    })
    
    ;(apiClient.getAdvancedKPIs as jest.Mock).mockResolvedValue({
      data: {},
    })
    
    ;(apiClient.getApprovals as jest.Mock).mockResolvedValue({
      data: [],
    })
    
    ;(apiClient.getRevenues as jest.Mock).mockResolvedValue({
      data: [],
    })
    
    ;(apiClient.getExpenses as jest.Mock).mockResolvedValue({
      data: [],
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('renders page component and loads dashboard data', async () => {
    render(<DashboardPage />)
    
    // Wait for layout to appear
    await waitFor(() => {
      expect(screen.getByTestId('layout')).toBeInTheDocument()
    }, { timeout: 5000 })
    
    // Wait for API calls to complete
    await waitFor(() => {
      expect(apiClient.getDashboardOverview).toHaveBeenCalled()
    }, { timeout: 5000 })
    
    // Verify all API methods were called
    expect(apiClient.getDashboardRecentActivity).toHaveBeenCalledWith(8)
    expect(apiClient.getAdvancedKPIs).toHaveBeenCalled()
    expect(apiClient.getApprovals).toHaveBeenCalled()
    expect(apiClient.getRevenues).toHaveBeenCalled()
    expect(apiClient.getExpenses).toHaveBeenCalled()
  })

  it('handles loading state', async () => {
    // Delay the API response to test loading state
    ;(apiClient.getDashboardOverview as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ 
        data: {
          financials: {
            total_revenue: 0,
            total_expenses: 0,
            profit: 0,
          },
        }
      }), 100))
    )
    
    render(<DashboardPage />)
    
    // Should show loading initially, then layout
    await waitFor(() => {
      expect(screen.getByTestId('layout')).toBeInTheDocument()
    }, { timeout: 5000 })
  })

  it('handles API errors gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    
    ;(apiClient.getDashboardOverview as jest.Mock).mockRejectedValue(new Error('API Error'))
    
    render(<DashboardPage />)
    
    await waitFor(() => {
      expect(screen.getByTestId('layout')).toBeInTheDocument()
    }, { timeout: 5000 })
    
    consoleErrorSpy.mockRestore()
  })
})

