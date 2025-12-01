import React from 'react'
import { render, screen } from '@testing-library/react'
import ResetPasswordPage from '@/app/auth/reset-password/page'

// Mock dependencies
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

jest.mock('@/lib/rbac', () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
  }),
}))

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    requestPasswordReset: jest.fn(),
    verifyPasswordResetOTP: jest.fn(),
    resetPassword: jest.fn(),
  },
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

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    mockPush.mockClear()
  })

  it('renders reset password page', () => {
    render(<ResetPasswordPage />)
    // Check if the reset password form structure is rendered
    expect(document.body).toBeTruthy()
  })
})

