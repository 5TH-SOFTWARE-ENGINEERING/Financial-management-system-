import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

describe('Pagination Component', () => {
  it('renders pagination navigation', () => {
    render(
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationLink href="/page/1">1</PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    )

    expect(screen.getByRole('navigation', { name: 'pagination' })).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('renders pagination links', () => {
    render(
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationLink href="/page/1">1</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="/page/2">2</PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    )

    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('renders active pagination link', () => {
    render(
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationLink href="/page/1" isActive>
              1
            </PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    )

    const link = screen.getByText('1')
    expect(link).toHaveAttribute('aria-current', 'page')
    expect(link).toHaveAttribute('data-active', 'true')
  })

  it('renders previous button', () => {
    render(
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="/page/1" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    )

    expect(screen.getByLabelText('Go to previous page')).toBeInTheDocument()
  })

  it('renders next button', () => {
    render(
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationNext href="/page/2" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    )

    expect(screen.getByLabelText('Go to next page')).toBeInTheDocument()
  })

  it('renders ellipsis', () => {
    render(
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    )

    expect(screen.getByText('More pages')).toBeInTheDocument()
  })

  it('applies custom className to Pagination', () => {
    render(
      <Pagination className="custom-pagination">
        <PaginationContent>
          <PaginationItem>
            <PaginationLink href="/page/1">1</PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    )

    const nav = screen.getByRole('navigation', { name: 'pagination' })
    expect(nav).toHaveClass('custom-pagination')
  })

  it('applies custom className to PaginationContent', () => {
    render(
      <Pagination>
        <PaginationContent className="custom-content">
          <PaginationItem>
            <PaginationLink href="/page/1">1</PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    )

    const content = screen.getByText('1').closest('ul')
    expect(content).toHaveClass('custom-content')
  })

  it('handles link click', async () => {
    const user = userEvent.setup()
    render(
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationLink href="/page/1">1</PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    )

    const link = screen.getByText('1')
    expect(link).toHaveAttribute('href', '/page/1')
  })
})

