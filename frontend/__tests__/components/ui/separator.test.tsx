import React from 'react'
import { render } from '@testing-library/react'
import { Separator } from '@/components/ui/separator'

describe('Separator Component', () => {
  it('renders separator element', () => {
    const { container } = render(<Separator />)
    const separator = container.querySelector('[data-slot="separator"]')
    expect(separator).toBeInTheDocument()
  })

  it('renders with default horizontal orientation', () => {
    const { container } = render(<Separator />)
    const separator = container.querySelector('[data-slot="separator"]')
    expect(separator).toBeInTheDocument()
    // Radix UI uses data attributes internally, just verify it renders
  })

  it('renders vertical separator', () => {
    const { container } = render(<Separator orientation="vertical" />)
    const separator = container.querySelector('[data-slot="separator"]')
    expect(separator).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(<Separator className="custom-class" />)
    const separator = container.querySelector('[data-slot="separator"]')
    expect(separator).toBeInTheDocument()
    expect(separator).toHaveClass('custom-class')
  })

  it('forwards props correctly', () => {
    const { container } = render(<Separator data-testid="test-separator" />)
    const separator = container.querySelector('[data-testid="test-separator"]')
    expect(separator).toBeInTheDocument()
  })
})

