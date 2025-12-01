import React from 'react'
import { render } from '@testing-library/react'
import { Skeleton } from '@/components/ui/skeleton'

describe('Skeleton Component', () => {
  it('renders skeleton element', () => {
    const { container } = render(<Skeleton />)
    const skeleton = container.querySelector('[data-slot="skeleton"]')
    expect(skeleton).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(<Skeleton className="custom-class" />)
    const skeleton = container.querySelector('[data-slot="skeleton"]')
    expect(skeleton).toHaveClass('custom-class')
  })

  it('forwards props correctly', () => {
    const { container } = render(<Skeleton data-testid="test-skeleton" />)
    const skeleton = container.querySelector('[data-testid="test-skeleton"]')
    expect(skeleton).toBeInTheDocument()
  })
})

