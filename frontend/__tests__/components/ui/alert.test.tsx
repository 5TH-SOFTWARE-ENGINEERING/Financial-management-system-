import { render, screen } from '@testing-library/react'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'

describe('Alert Component', () => {
  it('renders correctly with default props', () => {
    render(<Alert>Default alert</Alert>)
    const alert = screen.getByRole('alert')
    expect(alert).toBeInTheDocument()
    expect(alert).toHaveTextContent('Default alert')
  })

  it('renders with default variant', () => {
    render(<Alert variant="default">Default variant</Alert>)
    const alert = screen.getByRole('alert')
    expect(alert).toBeInTheDocument()
  })

  it('renders with destructive variant', () => {
    render(<Alert variant="destructive">Destructive alert</Alert>)
    const alert = screen.getByRole('alert')
    expect(alert).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<Alert className="custom-class">Custom alert</Alert>)
    const alert = screen.getByRole('alert')
    expect(alert).toHaveClass('custom-class')
  })

  it('renders with AlertTitle', () => {
    render(
      <Alert>
        <AlertTitle>Alert Title</AlertTitle>
      </Alert>
    )
    const title = screen.getByText('Alert Title')
    expect(title).toBeInTheDocument()
  })

  it('renders with AlertDescription', () => {
    render(
      <Alert>
        <AlertDescription>Alert description text</AlertDescription>
      </Alert>
    )
    const description = screen.getByText('Alert description text')
    expect(description).toBeInTheDocument()
  })

  it('renders with both title and description', () => {
    render(
      <Alert>
        <AlertTitle>Title</AlertTitle>
        <AlertDescription>Description</AlertDescription>
      </Alert>
    )
    expect(screen.getByText('Title')).toBeInTheDocument()
    expect(screen.getByText('Description')).toBeInTheDocument()
  })

  it('renders with icon', () => {
    render(
      <Alert>
        <svg data-testid="alert-icon" />
        <AlertTitle>Alert with icon</AlertTitle>
      </Alert>
    )
    expect(screen.getByTestId('alert-icon')).toBeInTheDocument()
  })
})

