import React from 'react'
import { render, screen } from '@testing-library/react'
import SettingsPage from '@/app/settings/page'

// Mock dependencies
jest.mock('next/navigation', () => ({
  usePathname: () => '/settings',
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

describe('SettingsPage', () => {
  it('renders page component', () => {
    render(<SettingsPage />)
    expect(screen.getByTestId('layout')).toBeInTheDocument()
  })
})

