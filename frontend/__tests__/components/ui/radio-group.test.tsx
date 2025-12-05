import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'

describe('RadioGroup Component', () => {
  it('renders radio group with items', () => {
    render(
      <RadioGroup>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="option1" id="option1" />
          <Label htmlFor="option1">Option 1</Label>
        </div>
      </RadioGroup>
    )

    const radio = screen.getByRole('radio')
    expect(radio).toBeInTheDocument()
  })

  it('renders multiple radio items', () => {
    render(
      <RadioGroup>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="option1" id="option1" />
          <Label htmlFor="option1">Option 1</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="option2" id="option2" />
          <Label htmlFor="option2">Option 2</Label>
        </div>
      </RadioGroup>
    )

    const radios = screen.getAllByRole('radio')
    expect(radios).toHaveLength(2)
  })

  it('selects radio item when clicked', async () => {
    const user = userEvent.setup()
    render(
      <RadioGroup>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="option1" id="option1" />
          <Label htmlFor="option1">Option 1</Label>
        </div>
      </RadioGroup>
    )

    const radio = screen.getByRole('radio')
    await user.click(radio)

    expect(radio).toBeChecked()
  })

  it('renders with default value', () => {
    render(
      <RadioGroup defaultValue="option1">
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="option1" id="option1" />
          <Label htmlFor="option1">Option 1</Label>
        </div>
      </RadioGroup>
    )

    const radio = screen.getByRole('radio')
    expect(radio).toBeChecked()
  })

  it('only allows one selection at a time', async () => {
    const user = userEvent.setup()
    render(
      <RadioGroup>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="option1" id="option1" />
          <Label htmlFor="option1">Option 1</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="option2" id="option2" />
          <Label htmlFor="option2">Option 2</Label>
        </div>
      </RadioGroup>
    )

    const radios = screen.getAllByRole('radio')
    await user.click(radios[0])
    expect(radios[0]).toBeChecked()
    expect(radios[1]).not.toBeChecked()

    await user.click(radios[1])
    expect(radios[0]).not.toBeChecked()
    expect(radios[1]).toBeChecked()
  })

  it('applies custom className to RadioGroup', () => {
    render(
      <RadioGroup className="custom-group">
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="option1" id="option1" />
          <Label htmlFor="option1">Option 1</Label>
        </div>
      </RadioGroup>
    )

    const group = screen.getByRole('radiogroup')
    expect(group).toHaveClass('custom-group')
  })

  it('applies custom className to RadioGroupItem', () => {
    render(
      <RadioGroup>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="option1" id="option1" className="custom-item" />
          <Label htmlFor="option1">Option 1</Label>
        </div>
      </RadioGroup>
    )

    const radio = screen.getByRole('radio')
    expect(radio).toHaveClass('custom-item')
  })

  it('handles disabled state', () => {
    render(
      <RadioGroup>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="option1" id="option1" disabled />
          <Label htmlFor="option1">Option 1</Label>
        </div>
      </RadioGroup>
    )

    const radio = screen.getByRole('radio')
    expect(radio).toBeDisabled()
  })
})

