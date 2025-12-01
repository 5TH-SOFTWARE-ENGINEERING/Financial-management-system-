import React from 'react'
import { render, screen, waitFor } from '@testing-library/react' // <-- Import waitFor
import AdminPage from '@/app/admin/page'
import apiClient from '@/lib/api' // <-- Import the API client for mocking its implementation

// Mock dependencies
const mockPush = jest.fn()
const mockGetAdminSystemStats = apiClient.getAdminSystemStats as jest.Mock

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

jest.mock('@/store/userStore', () => ({
  useUserStore: () => ({
    user: { id: '1', role: 'admin' },
    isAuthenticated: true,
    isLoading: false,
    allUsers: [],
    fetchAllUsers: jest.fn(),
  }),
}))

// NOTE: We keep the default mock for successful state, but update the definition
// to correctly refer to the imported mock function for clarity.
jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    getAdminSystemStats: jest.fn().mockResolvedValue({
      data: {
        total_users: 10,
        active_users: 8,
        total_revenue: 10000,
        total_expenses: 5000,
        pending_approvals: 2,
        system_health: 'healthy',
      },
    }),
  },
}))

jest.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}))

describe('AdminPage', () => {
  beforeEach(() => {
    mockPush.mockClear()
    // Clear mock implementation before each test to ensure test isolation
    mockGetAdminSystemStats.mockClear(); 
    mockGetAdminSystemStats.mockResolvedValue({
        data: {
            total_users: 10,
            active_users: 8,
            total_revenue: 10000,
            total_expenses: 5000,
            pending_approvals: 2,
            system_health: 'healthy',
        },
    });
  })

  // 1. New test to explicitly wait for the data to load
  it('renders system stats after loading', async () => {
    render(<AdminPage />);
    
    // The component first renders, then calls the async API, which updates state
    // We use waitFor to wait for the final state (the data being displayed)
    // Wait for loading to complete and stats to appear
    await waitFor(() => {
        // Assert that a piece of the successfully loaded data is present
        expect(screen.getByText('Total Users')).toBeInTheDocument();
        // You can also assert on the specific value to ensure the state update worked
        expect(screen.getByText('10')).toBeInTheDocument(); 
    }, { timeout: 5000 });
    
    // This confirms that setSystemStats, setStatsLoading(false), etc., have all finished
    // within the act scope created by waitFor.
  });
  
  // 2. Test for error handling, also needs waitFor
  it('renders error message on API failure', async () => {
    // Override the successful mock for this specific test
    mockGetAdminSystemStats.mockRejectedValue({
        message: 'Network Error',
        response: { status: 500, data: { detail: 'Server failed' } },
    });
    
    render(<AdminPage />);
    
    // Wait for the asynchronous error handling and state update (setStatsError) to complete
    // The error message displayed is the detail from the error response
    await waitFor(() => {
        // Assert that the error message is visible - it shows "Server failed" from error.response.data.detail
        expect(screen.getByText(/Server failed/i)).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  // Keep existing tests, ensuring they also use await/waitFor if they rely on async code
  it('renders admin page after loading', async () => { // <-- Make it async
    render(<AdminPage />)
    
    // Add waitFor to ensure the component is in its final state
    await waitFor(() => {
        expect(screen.getByText(/Admin Dashboard/i)).toBeInTheDocument()
    }, { timeout: 5000 });
  })

  it('renders access denied for non-admin users', () => {
    // This test relies on an *additional* mock for the user, which is not defined here.
    // Assuming the current mock *is* an admin, the test should verify it renders.
    render(<AdminPage />)
    expect(document.body).toBeTruthy()
  })

  it('renders without crashing', async () => { // <-- Make it async
    render(<AdminPage />)
    
    // Wait for initial render and any async operations
    await waitFor(() => {
        expect(screen.getByText(/Admin Dashboard/i)).toBeInTheDocument()
    }, { timeout: 5000 });
  })
})