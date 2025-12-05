import { render, screen } from '@testing-library/react'
import { AspectRatio } from '@/components/ui/aspect-ratio'

describe('AspectRatio Component', () => {
  it('renders aspect ratio container', () => {
    render(
      <AspectRatio ratio={16 / 9}>
        <div>Content</div>
      </AspectRatio>
    )

    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('renders with custom ratio', () => {
    render(
      <AspectRatio ratio={4 / 3}>
        <div>Content</div>
      </AspectRatio>
    )

    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('renders with 1:1 ratio', () => {
    render(
      <AspectRatio ratio={1}>
        <div>Content</div>
      </AspectRatio>
    )

    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('renders with image', () => {
    render(
      <AspectRatio ratio={16 / 9}>
        <img src="/test.jpg" alt="Test" />
      </AspectRatio>
    )

    const image = screen.getByAltText('Test')
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('src', '/test.jpg')
  })
})

