import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import ProjectCreatePage from '@/app/project/create/page'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}))

jest.mock('@/store/userStore', () => ({
  useUserStore: () => ({
    user: { id: '1', role: 'admin' },
    isAuthenticated: true,
    allUsers: [],              // FIX: Prevent undefined.length
    fetchAllUsers: jest.fn(),
  }),
}))

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    createProject: jest.fn(),
    getDepartments: jest.fn().mockResolvedValue({ data: [] }),
    getUsers: jest.fn().mockResolvedValue({ data: [] }),
  },
}))

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}))

jest.mock('@/components/common/Navbar', () => () => (
  <div data-testid="navbar">Navbar</div>
))

jest.mock('@/components/common/Sidebar', () => () => (
  <div data-testid="sidebar">Sidebar</div>
))

jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>
})

describe('ProjectCreatePage', () => {
  it('renders page component', async () => {
    render(<ProjectCreatePage />)
    
    // Wait for layout components to appear after loading completes
    await waitFor(() => {
      expect(screen.getByTestId('sidebar')).toBeInTheDocument()
      expect(screen.getByTestId('navbar')).toBeInTheDocument()
    }, { timeout: 5000 })
  })
})
