import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

describe('Select Component', () => {
  it('renders select trigger', () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
        </SelectContent>
      </Select>
    )

    expect(screen.getByText('Select an option')).toBeInTheDocument()
  })

  it('opens select when trigger is clicked', async () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
        </SelectContent>
      </Select>
    )

    // Wait for the select to be ready, then find the trigger button by data-slot
    await waitFor(() => {
      const trigger = document.querySelector('[data-slot="select-trigger"]')
      expect(trigger).toBeInTheDocument()
      expect(trigger?.tagName.toLowerCase()).toBe('button')
    })

    const trigger = document.querySelector('[data-slot="select-trigger"]') as HTMLButtonElement
    // Use fireEvent to avoid pointer capture issues in jsdom
    fireEvent.click(trigger)

    // Wait for the select content to appear (it's rendered in a portal)
    await waitFor(() => {
      const selectContent = document.querySelector('[data-slot="select-content"]')
      expect(selectContent).toBeInTheDocument()
    }, { timeout: 3000 })

    // Now check for the option text
    await waitFor(() => {
      expect(screen.getByText('Option 1')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('renders select items', async () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
          <SelectItem value="option2">Option 2</SelectItem>
        </SelectContent>
      </Select>
    )

    // Wait for the select to be ready
    await waitFor(() => {
      const trigger = document.querySelector('[data-slot="select-trigger"]')
      expect(trigger).toBeInTheDocument()
      expect(trigger?.tagName.toLowerCase()).toBe('button')
    })

    const trigger = document.querySelector('[data-slot="select-trigger"]') as HTMLButtonElement
    fireEvent.click(trigger)

    // Wait for the select content to appear
    await waitFor(() => {
      const selectContent = document.querySelector('[data-slot="select-content"]')
      expect(selectContent).toBeInTheDocument()
    }, { timeout: 3000 })

    // Check for both options
    await waitFor(() => {
      expect(screen.getByText('Option 1')).toBeInTheDocument()
      expect(screen.getByText('Option 2')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('selects an item when clicked', async () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
        </SelectContent>
      </Select>
    )

    // Wait for the select to be ready
    await waitFor(() => {
      const trigger = document.querySelector('[data-slot="select-trigger"]')
      expect(trigger).toBeInTheDocument()
      expect(trigger?.tagName.toLowerCase()).toBe('button')
    })

    const trigger = document.querySelector('[data-slot="select-trigger"]') as HTMLButtonElement
    fireEvent.click(trigger)

    // Wait for the select content to appear
    await waitFor(() => {
      const selectContent = document.querySelector('[data-slot="select-content"]')
      expect(selectContent).toBeInTheDocument()
    }, { timeout: 3000 })

    // Wait for the option to be visible
    await waitFor(() => {
      expect(screen.getByText('Option 1')).toBeInTheDocument()
    }, { timeout: 3000 })

    // Click the option item
    const option = screen.getByText('Option 1')
    fireEvent.click(option)

    // Wait for the selection to be reflected in the trigger
    await waitFor(() => {
      const selectValue = document.querySelector('[data-slot="select-value"]')
      expect(selectValue?.textContent).toBe('Option 1')
    }, { timeout: 3000 })
  })

  it('renders with default value', () => {
    render(
      <Select defaultValue="option1">
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
        </SelectContent>
      </Select>
    )

    expect(screen.getByText('Option 1')).toBeInTheDocument()
  })

  it('supports disabled state', () => {
    render(
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
        </SelectContent>
      </Select>
    )

    const trigger = screen.getByText('Select').closest('button')
    expect(trigger).toBeDisabled()
  })

  it('renders with small size', () => {
    render(
      <Select>
        <SelectTrigger size="sm">
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
        </SelectContent>
      </Select>
    )

    const trigger = screen.getByText('Select').closest('[data-size="sm"]')
    expect(trigger).toBeInTheDocument()
  })
})

