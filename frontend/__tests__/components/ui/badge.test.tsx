import React from 'react'
import { render, screen } from '@testing-library/react'
import { Badge } from '@/components/ui/badge'

describe('Badge Component', () => {
  it('renders badge text', () => {
    render(<Badge>Test Badge</Badge>)
    expect(screen.getByText('Test Badge')).toBeInTheDocument()
  })

  it('applies default variant', () => {
    const { container } = render(<Badge>Test</Badge>)
    const badge = container.querySelector('[data-slot="badge"]')
    expect(badge).toBeInTheDocument()
  })

  it('applies variant classes', () => {
    const { container } = render(<Badge variant="secondary">Test</Badge>)
    const badge = container.querySelector('[data-slot="badge"]')
    expect(badge).toBeInTheDocument()
  })

  it('applies destructive variant', () => {
    const { container } = render(<Badge variant="destructive">Test</Badge>)
    const badge = container.querySelector('[data-slot="badge"]')
    expect(badge).toBeInTheDocument()
  })

  it('applies outline variant', () => {
    const { container } = render(<Badge variant="outline">Test</Badge>)
    const badge = container.querySelector('[data-slot="badge"]')
    expect(badge).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(<Badge className="custom-class">Test</Badge>)
    const badge = container.querySelector('[data-slot="badge"]')
    expect(badge).toHaveClass('custom-class')
  })
})

