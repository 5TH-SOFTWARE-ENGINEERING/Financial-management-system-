import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'

describe('Collapsible Component', () => {
  it('renders collapsible trigger', () => {
    render(
      <Collapsible>
        <CollapsibleTrigger asChild>
          <Button>Toggle</Button>
        </CollapsibleTrigger>
        <CollapsibleContent>Content</CollapsibleContent>
      </Collapsible>
    )

    expect(screen.getByText('Toggle')).toBeInTheDocument()
  })

  it('expands content when trigger is clicked', async () => {
    const user = userEvent.setup()
    render(
      <Collapsible>
        <CollapsibleTrigger asChild>
          <Button>Toggle</Button>
        </CollapsibleTrigger>
        <CollapsibleContent>Content</CollapsibleContent>
      </Collapsible>
    )

    const trigger = screen.getByText('Toggle')
    await user.click(trigger)

    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('collapses content when trigger is clicked again', async () => {
    const user = userEvent.setup()
    render(
      <Collapsible>
        <CollapsibleTrigger asChild>
          <Button>Toggle</Button>
        </CollapsibleTrigger>
        <CollapsibleContent>Content</CollapsibleContent>
      </Collapsible>
    )

    const trigger = screen.getByText('Toggle')
    await user.click(trigger)
    expect(screen.getByText('Content')).toBeInTheDocument()

    await user.click(trigger)
    // Content is hidden when collapsed - check that it's not visible
    const content = screen.queryByText('Content')
    // Content might still be in DOM but hidden, so check the hidden attribute or visibility
    if (content) {
      expect(content).toHaveAttribute('hidden')
    } else {
      // Or it might be removed from DOM
      expect(content).not.toBeInTheDocument()
    }
  })

  it('renders with default open state', () => {
    render(
      <Collapsible defaultOpen>
        <CollapsibleTrigger asChild>
          <Button>Toggle</Button>
        </CollapsibleTrigger>
        <CollapsibleContent>Content</CollapsibleContent>
      </Collapsible>
    )

    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('renders with controlled open state', () => {
    render(
      <Collapsible open>
        <CollapsibleTrigger asChild>
          <Button>Toggle</Button>
        </CollapsibleTrigger>
        <CollapsibleContent>Content</CollapsibleContent>
      </Collapsible>
    )

    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('handles onOpenChange callback', async () => {
    const user = userEvent.setup()
    const handleOpenChange = jest.fn()

    render(
      <Collapsible onOpenChange={handleOpenChange}>
        <CollapsibleTrigger asChild>
          <Button>Toggle</Button>
        </CollapsibleTrigger>
        <CollapsibleContent>Content</CollapsibleContent>
      </Collapsible>
    )

    const trigger = screen.getByText('Toggle')
    await user.click(trigger)

    expect(handleOpenChange).toHaveBeenCalledWith(true)
  })
})

