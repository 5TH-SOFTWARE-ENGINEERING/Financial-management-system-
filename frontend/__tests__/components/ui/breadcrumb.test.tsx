import { render, screen } from '@testing-library/react'
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

describe('Breadcrumb Component', () => {
  it('renders breadcrumb navigation', () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    )

    expect(screen.getByRole('navigation', { name: 'breadcrumb' })).toBeInTheDocument()
    expect(screen.getByText('Home')).toBeInTheDocument()
  })

  it('renders breadcrumb with multiple items', () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Current</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    )

    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Current')).toBeInTheDocument()
  })

  it('renders breadcrumb link', () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/home">Home</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    )

    const link = screen.getByText('Home')
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/home')
  })

  it('renders breadcrumb page', () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Current Page</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    )

    const page = screen.getByText('Current Page')
    expect(page).toBeInTheDocument()
    expect(page).toHaveAttribute('aria-current', 'page')
  })

  it('renders breadcrumb separator', () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Page</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    )

    // Separator has aria-hidden="true", so query by data-slot instead
    const separator = document.querySelector('[data-slot="breadcrumb-separator"]')
    expect(separator).toBeInTheDocument()
    expect(separator).toHaveAttribute('role', 'presentation')
  })

  it('renders breadcrumb ellipsis', () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbEllipsis />
          <BreadcrumbItem>
            <BreadcrumbPage>Page</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    )

    // Ellipsis has aria-hidden="true", so query by data-slot instead
    const ellipsis = document.querySelector('[data-slot="breadcrumb-ellipsis"]')
    expect(ellipsis).toBeInTheDocument()
    expect(ellipsis).toHaveAttribute('role', 'presentation')
  })

  it('applies custom className to BreadcrumbList', () => {
    render(
      <Breadcrumb>
        <BreadcrumbList className="custom-list">
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    )

    const list = screen.getByText('Home').closest('ol')
    expect(list).toHaveClass('custom-list')
  })

  it('applies custom className to BreadcrumbItem', () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem className="custom-item">
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    )

    const item = screen.getByText('Home').closest('li')
    expect(item).toHaveClass('custom-item')
  })

  it('renders breadcrumb with asChild prop', () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <a href="/custom">Custom Link</a>
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    )

    const link = screen.getByText('Custom Link')
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/custom')
  })
})

