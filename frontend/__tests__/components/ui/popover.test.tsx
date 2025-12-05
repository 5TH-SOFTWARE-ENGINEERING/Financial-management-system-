import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'

describe('Popover Component', () => {
  it('renders popover trigger', () => {
    render(
      <Popover>
        <PopoverTrigger asChild>
          <Button>Open Popover</Button>
        </PopoverTrigger>
        <PopoverContent>Popover content</PopoverContent>
      </Popover>
    )

    expect(screen.getByText('Open Popover')).toBeInTheDocument()
  })

  it('opens popover when trigger is clicked', async () => {
    const user = userEvent.setup()
    render(
      <Popover>
        <PopoverTrigger asChild>
          <Button>Open</Button>
        </PopoverTrigger>
        <PopoverContent>Popover content</PopoverContent>
      </Popover>
    )

    const trigger = screen.getByText('Open')
    await user.click(trigger)

    await waitFor(() => {
      expect(screen.getByText('Popover content')).toBeInTheDocument()
    })
  })

  it('closes popover when clicking outside', async () => {
    const user = userEvent.setup()
    render(
      <div>
        <Popover>
          <PopoverTrigger asChild>
            <Button>Open</Button>
          </PopoverTrigger>
          <PopoverContent>Popover content</PopoverContent>
        </Popover>
        <div>Outside content</div>
      </div>
    )

    await user.click(screen.getByText('Open'))

    await waitFor(() => {
      expect(screen.getByText('Popover content')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Outside content'))

    await waitFor(() => {
      const popover = screen.queryByText('Popover content')
      // Popover should be closed - either not in DOM or hidden
      if (popover) {
        // If still in DOM, it should be hidden
        expect(popover.closest('[data-slot="popover-content"]')).toHaveAttribute('data-state', 'closed')
      } else {
        // Or removed from DOM entirely
        expect(popover).not.toBeInTheDocument()
      }
    })
  })

  it('applies custom className to PopoverContent', async () => {
    const user = userEvent.setup()
    render(
      <Popover>
        <PopoverTrigger asChild>
          <Button>Open</Button>
        </PopoverTrigger>
        <PopoverContent className="custom-popover">Content</PopoverContent>
      </Popover>
    )

    await user.click(screen.getByText('Open'))

    await waitFor(() => {
      const content = screen.getByText('Content').closest('[data-slot="popover-content"]')
      expect(content).toHaveClass('custom-popover')
    })
  })

  it('renders with custom align', async () => {
    const user = userEvent.setup()
    render(
      <Popover>
        <PopoverTrigger asChild>
          <Button>Open</Button>
        </PopoverTrigger>
        <PopoverContent align="start">Content</PopoverContent>
      </Popover>
    )

    await user.click(screen.getByText('Open'))

    await waitFor(() => {
      expect(screen.getByText('Content')).toBeInTheDocument()
    })
  })

  it('renders with custom sideOffset', async () => {
    const user = userEvent.setup()
    render(
      <Popover>
        <PopoverTrigger asChild>
          <Button>Open</Button>
        </PopoverTrigger>
        <PopoverContent sideOffset={10}>Content</PopoverContent>
      </Popover>
    )

    await user.click(screen.getByText('Open'))

    await waitFor(() => {
      expect(screen.getByText('Content')).toBeInTheDocument()
    })
  })
})

