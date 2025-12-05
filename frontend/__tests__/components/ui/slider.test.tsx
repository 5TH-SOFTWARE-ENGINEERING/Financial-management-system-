import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Slider } from '@/components/ui/slider'

describe('Slider Component', () => {
  it('renders slider', () => {
    render(<Slider defaultValue={[50]} />)
    const slider = screen.getByRole('slider')
    expect(slider).toBeInTheDocument()
  })

  it('renders with default value', () => {
    render(<Slider defaultValue={[25]} />)
    const slider = screen.getByRole('slider')
    expect(slider).toBeInTheDocument()
  })

  it('renders with controlled value', () => {
    render(<Slider value={[75]} />)
    const slider = screen.getByRole('slider')
    expect(slider).toBeInTheDocument()
  })

  it('renders with custom min and max', () => {
    render(<Slider min={0} max={200} defaultValue={[100]} />)
    const slider = screen.getByRole('slider')
    expect(slider).toBeInTheDocument()
  })

  it('renders with multiple values', () => {
    render(<Slider defaultValue={[25, 75]} />)
    const sliders = screen.getAllByRole('slider')
    expect(sliders).toHaveLength(2)
  })

  it('applies custom className', () => {
    render(<Slider defaultValue={[50]} className="custom-slider" />)
    const slider = screen.getByRole('slider').closest('[data-slot="slider"]')
    expect(slider).toHaveClass('custom-slider')
  })

  it('handles step prop', () => {
    render(<Slider step={10} defaultValue={[50]} />)
    const slider = screen.getByRole('slider')
    expect(slider).toBeInTheDocument()
  })

  it('handles disabled state', () => {
    render(<Slider disabled defaultValue={[50]} />)
    const slider = screen.getByRole('slider')
    // Radix UI Slider uses data-disabled attribute, not disabled attribute
    expect(slider).toHaveAttribute('data-disabled', '')
    // Also check aria-disabled if present
    const ariaDisabled = slider.getAttribute('aria-disabled')
    if (ariaDisabled !== null) {
      expect(ariaDisabled).toBe('true')
    }
  })

  it('renders with default min and max when no value provided', () => {
    render(<Slider />)
    const slider = screen.getByRole('slider')
    expect(slider).toBeInTheDocument()
  })
})

