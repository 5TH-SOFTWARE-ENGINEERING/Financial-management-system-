import { render, screen } from '@testing-library/react'
import { ScrollArea } from '@/components/ui/scroll-area'

describe('ScrollArea Component', () => {
  it('renders scroll area with content', () => {
    render(
      <ScrollArea>
        <div>Scrollable content</div>
      </ScrollArea>
    )

    expect(screen.getByText('Scrollable content')).toBeInTheDocument()
  })

  it('renders with multiple children', () => {
    render(
      <ScrollArea>
        <div>Item 1</div>
        <div>Item 2</div>
        <div>Item 3</div>
      </ScrollArea>
    )

    expect(screen.getByText('Item 1')).toBeInTheDocument()
    expect(screen.getByText('Item 2')).toBeInTheDocument()
    expect(screen.getByText('Item 3')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(
      <ScrollArea className="custom-scroll">
        <div>Content</div>
      </ScrollArea>
    )

    const scrollArea = screen.getByText('Content').closest('[data-slot="scroll-area"]')
    expect(scrollArea).toHaveClass('custom-scroll')
  })

  it('renders with custom height', () => {
    render(
      <ScrollArea style={{ height: '200px' }}>
        <div>Content</div>
      </ScrollArea>
    )

    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('renders with long content', () => {
    const longContent = Array.from({ length: 100 }, (_, i) => (
      <div key={i}>Item {i + 1}</div>
    ))

    render(<ScrollArea>{longContent}</ScrollArea>)

    expect(screen.getByText('Item 1')).toBeInTheDocument()
    expect(screen.getByText('Item 100')).toBeInTheDocument()
  })
})

