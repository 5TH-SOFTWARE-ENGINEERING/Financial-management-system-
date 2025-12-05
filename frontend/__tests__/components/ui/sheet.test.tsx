import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'

describe('Sheet Component', () => {
  it('renders sheet trigger', () => {
    render(
      <Sheet>
        <SheetTrigger asChild>
          <Button>Open Sheet</Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Sheet Title</SheetTitle>
            <SheetDescription>Sheet Description</SheetDescription>
          </SheetHeader>
          Content
        </SheetContent>
      </Sheet>
    )

    expect(screen.getByText('Open Sheet')).toBeInTheDocument()
  })

  it('opens sheet when trigger is clicked', async () => {
    const user = userEvent.setup()
    render(
      <Sheet>
        <SheetTrigger asChild>
          <Button>Open</Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Sheet Title</SheetTitle>
            <SheetDescription>Sheet Description</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    )

    const trigger = screen.getByText('Open')
    await user.click(trigger)

    await waitFor(() => {
      expect(screen.getByText('Sheet Title')).toBeInTheDocument()
      expect(screen.getByText('Sheet Description')).toBeInTheDocument()
    })
  })

  it('renders sheet title', async () => {
    const user = userEvent.setup()
    render(
      <Sheet>
        <SheetTrigger asChild>
          <Button>Open</Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Title</SheetTitle>
            <SheetDescription>Description</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    )

    await user.click(screen.getByText('Open'))

    await waitFor(() => {
      expect(screen.getByText('Title')).toBeInTheDocument()
    })
  })

  it('renders sheet description', async () => {
    const user = userEvent.setup()
    render(
      <Sheet>
        <SheetTrigger asChild>
          <Button>Open</Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Title</SheetTitle>
            <SheetDescription>Description</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    )

    await user.click(screen.getByText('Open'))

    await waitFor(() => {
      expect(screen.getByText('Description')).toBeInTheDocument()
    })
  })

  it('renders sheet footer', async () => {
    const user = userEvent.setup()
    render(
      <Sheet>
        <SheetTrigger asChild>
          <Button>Open</Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Title</SheetTitle>
            <SheetDescription>Description</SheetDescription>
          </SheetHeader>
          <SheetFooter>Footer Content</SheetFooter>
        </SheetContent>
      </Sheet>
    )

    await user.click(screen.getByText('Open'))

    await waitFor(() => {
      expect(screen.getByText('Footer Content')).toBeInTheDocument()
    })
  })

  it('renders with different sides', async () => {
    const user = userEvent.setup()
    const { rerender } = render(
      <Sheet>
        <SheetTrigger asChild>
          <Button>Open</Button>
        </SheetTrigger>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Title</SheetTitle>
            <SheetDescription>Description</SheetDescription>
          </SheetHeader>
          Content
        </SheetContent>
      </Sheet>
    )

    // Wait for sheet to open and pointer events to be enabled
    await user.click(screen.getByText('Open'))

    await waitFor(() => {
      expect(screen.getByText('Content')).toBeInTheDocument()
    }, { timeout: 3000 })

    // Close the sheet first
    const closeButton = screen.getByRole('button', { name: /close/i })
    await user.click(closeButton)

    await waitFor(() => {
      expect(screen.queryByText('Content')).not.toBeInTheDocument()
    })

    rerender(
      <Sheet>
        <SheetTrigger asChild>
          <Button>Open</Button>
        </SheetTrigger>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>Title</SheetTitle>
            <SheetDescription>Description</SheetDescription>
          </SheetHeader>
          Content
        </SheetContent>
      </Sheet>
    )

    await user.click(screen.getByText('Open'))

    await waitFor(() => {
      expect(screen.getByText('Content')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('closes sheet when close button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <Sheet>
        <SheetTrigger asChild>
          <Button>Open</Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Title</SheetTitle>
            <SheetDescription>Description</SheetDescription>
          </SheetHeader>
          Content
        </SheetContent>
      </Sheet>
    )

    await user.click(screen.getByText('Open'))

    await waitFor(() => {
      expect(screen.getByText('Content')).toBeInTheDocument()
    }, { timeout: 3000 })

    // Use getByRole instead of getByLabelText since the label is in a sr-only span
    const closeButton = screen.getByRole('button', { name: /close/i })
    await user.click(closeButton)

    await waitFor(() => {
      const content = screen.queryByText('Content')
      // Content might still be in DOM but hidden, or removed
      if (content) {
        // If still in DOM, check if it's hidden
        const sheetContent = content.closest('[data-slot="sheet-content"]')
        if (sheetContent) {
          expect(sheetContent).toHaveAttribute('data-state', 'closed')
        }
      } else {
        // Or removed from DOM entirely
        expect(content).not.toBeInTheDocument()
      }
    })
  })
})

