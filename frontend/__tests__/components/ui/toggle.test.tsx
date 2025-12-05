import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Toggle } from '@/components/ui/toggle'

describe('Toggle Component', () => {
  it('renders toggle button', () => {
    render(<Toggle>Toggle</Toggle>)
    const toggle = screen.getByRole('button', { name: /toggle/i })
    expect(toggle).toBeInTheDocument()
  })

  it('toggles state when clicked', async () => {
    const user = userEvent.setup()
    render(<Toggle>Toggle</Toggle>)
    
    const toggle = screen.getByRole('button', { name: /toggle/i })
    expect(toggle).toHaveAttribute('data-state', 'off')

    await user.click(toggle)
    expect(toggle).toHaveAttribute('data-state', 'on')

    await user.click(toggle)
    expect(toggle).toHaveAttribute('data-state', 'off')
  })

  it('renders with default variant', () => {
    render(<Toggle>Toggle</Toggle>)
    const toggle = screen.getByRole('button', { name: /toggle/i })
    expect(toggle).toBeInTheDocument()
  })

  it('renders with outline variant', () => {
    render(<Toggle variant="outline">Toggle</Toggle>)
    const toggle = screen.getByRole('button', { name: /toggle/i })
    expect(toggle).toBeInTheDocument()
  })

  it('renders with different sizes', () => {
    const { rerender } = render(<Toggle size="sm">Small</Toggle>)
    expect(screen.getByRole('button', { name: /small/i })).toBeInTheDocument()

    rerender(<Toggle size="lg">Large</Toggle>)
    expect(screen.getByRole('button', { name: /large/i })).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<Toggle className="custom-toggle">Toggle</Toggle>)
    const toggle = screen.getByRole('button', { name: /toggle/i })
    expect(toggle).toHaveClass('custom-toggle')
  })

  it('handles disabled state', () => {
    render(<Toggle disabled>Toggle</Toggle>)
    const toggle = screen.getByRole('button', { name: /toggle/i })
    expect(toggle).toBeDisabled()
  })

  it('handles pressed state', () => {
    render(<Toggle pressed>Toggle</Toggle>)
    const toggle = screen.getByRole('button', { name: /toggle/i })
    expect(toggle).toHaveAttribute('data-state', 'on')
  })

  it('handles onClick events', async () => {
    const user = userEvent.setup()
    const handleClick = jest.fn()
    render(<Toggle onClick={handleClick}>Toggle</Toggle>)
    
    const toggle = screen.getByRole('button', { name: /toggle/i })
    await user.click(toggle)
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})

