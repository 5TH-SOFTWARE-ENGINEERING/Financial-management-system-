import React from 'react'
import { render, screen } from '@testing-library/react'
import Header from '@/components/common/Header'

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />
  },
}))

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>
  }
})

// Mock framer-motion to filter out non-DOM props like whileHover
jest.mock('framer-motion', () => {
  const createMockElement = (elementName: string, defaultRole?: string) => {
    return ({ children, whileHover, initial, animate, transition, ...props }: any) => {
      const Element = elementName as any
      const domProps: any = { ...props }
      if (defaultRole) domProps.role = defaultRole
      return <Element {...domProps}>{children}</Element>
    }
  }

  return {
    motion: {
      span: createMockElement('span'),
      button: createMockElement('button'),
      div: createMockElement('div'),
      header: createMockElement('header', 'banner'),
      a: createMockElement('a'),
    },
  }
})

describe('Header Component', () => {
  it('renders header element', () => {
    // The rendered element will now be the mock <header role="banner"> provided by motion.header mock
    render(<Header />)
    const header = screen.getByRole('banner')
    expect(header).toBeInTheDocument()
  })

  it('displays Financial Management System title', () => {
    render(<Header />)
    expect(screen.getByText('Financial Management System')).toBeInTheDocument()
  })

  it('renders login button', () => {
    render(<Header />)
    const loginLink = screen.getByText('Login').closest('a')
    expect(loginLink).toBeInTheDocument()
    expect(loginLink).toHaveAttribute('href', '/auth/login')
  })

  it('renders logo image', () => {
    render(<Header />)
    const logo = screen.getByAltText('Financial Management System')
    expect(logo).toBeInTheDocument()
    expect(logo).toHaveAttribute('src', '/log.png')
  })
})