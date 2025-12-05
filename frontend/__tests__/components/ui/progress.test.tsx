import { render, screen } from '@testing-library/react'
import { Progress } from '@/components/ui/progress'

describe('Progress Component', () => {
  it('renders progress bar', () => {
    render(<Progress value={50} />)
    const progress = screen.getByRole('progressbar')
    expect(progress).toBeInTheDocument()
  })

  it('renders with 0% value', () => {
    render(<Progress value={0} />)
    const progress = screen.getByRole('progressbar')
    expect(progress).toBeInTheDocument()
  })

  it('renders with 100% value', () => {
    render(<Progress value={100} />)
    const progress = screen.getByRole('progressbar')
    expect(progress).toBeInTheDocument()
  })

  it('renders with 50% value', () => {
    render(<Progress value={50} />)
    const progress = screen.getByRole('progressbar')
    expect(progress).toBeInTheDocument()
  })

  it('renders with undefined value', () => {
    render(<Progress />)
    const progress = screen.getByRole('progressbar')
    expect(progress).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<Progress value={50} className="custom-progress" />)
    const progress = screen.getByRole('progressbar')
    expect(progress).toHaveClass('custom-progress')
  })

  it('handles value greater than 100', () => {
    render(<Progress value={150} />)
    const progress = screen.getByRole('progressbar')
    expect(progress).toBeInTheDocument()
  })

  it('handles negative value', () => {
    render(<Progress value={-10} />)
    const progress = screen.getByRole('progressbar')
    expect(progress).toBeInTheDocument()
  })
})

