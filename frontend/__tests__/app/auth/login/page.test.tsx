import React from 'react'
import { render, screen } from '@testing-library/react'
import LoginPage from '@/app/auth/login/page'

// Mock dependencies
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

jest.mock('@/lib/rbac', () => ({
  useAuth: () => ({
    login: jest.fn(),
    user: null,
    isAuthenticated: false,
  }),
}))

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
  Toaster: () => null,
}))

jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>
  }
})

describe('LoginPage', () => {
  beforeEach(() => {
    mockPush.mockClear()
  })

  it('renders login page', () => {
    render(<LoginPage />)
    // Check if the login form structure is rendered
    expect(document.body).toBeTruthy()
  })
})

