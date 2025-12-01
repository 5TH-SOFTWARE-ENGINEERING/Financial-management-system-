import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import NotificationsPage from '@/app/notifications/page'

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
    isLoading: false,
  }),
}))

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    getNotifications: jest.fn().mockResolvedValue({ data: [] }),
    markNotificationAsRead: jest.fn(),
    deleteNotification: jest.fn(),
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

describe('NotificationsPage', () => {
  it('renders page component', async () => {
    render(<NotificationsPage />)
    
    // Wait for the heading to appear, which indicates loading is complete
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Notifications/i })).toBeInTheDocument()
    }, { timeout: 5000 })
    
    // Verify layout is present
    expect(screen.getByTestId('layout')).toBeInTheDocument()
  })
})

