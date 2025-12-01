import React from 'react'
import { render, screen } from '@testing-library/react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardAction,
} from '@/components/ui/card'

describe('Card Components', () => {
  describe('Card', () => {
    it('renders card element', () => {
      const { container } = render(<Card>Test Content</Card>)
      const card = container.querySelector('[data-slot="card"]')
      expect(card).toBeInTheDocument()
      expect(card).toHaveTextContent('Test Content')
    })

    it('applies custom className', () => {
      const { container } = render(<Card className="custom-class">Test</Card>)
      const card = container.querySelector('[data-slot="card"]')
      expect(card).toHaveClass('custom-class')
    })
  })

  describe('CardHeader', () => {
    it('renders card header', () => {
      const { container } = render(<CardHeader>Header Content</CardHeader>)
      const header = container.querySelector('[data-slot="card-header"]')
      expect(header).toBeInTheDocument()
    })

    it('applies custom className', () => {
      const { container } = render(<CardHeader className="custom-header">Test</CardHeader>)
      const header = container.querySelector('[data-slot="card-header"]')
      expect(header).toHaveClass('custom-header')
    })
  })

  describe('CardTitle', () => {
    it('renders card title', () => {
      const { container } = render(<CardTitle>Card Title</CardTitle>)
      const title = container.querySelector('[data-slot="card-title"]')
      expect(title).toBeInTheDocument()
      expect(title).toHaveTextContent('Card Title')
    })

    it('applies custom className', () => {
      const { container } = render(<CardTitle className="custom-title">Title</CardTitle>)
      const title = container.querySelector('[data-slot="card-title"]')
      expect(title).toHaveClass('custom-title')
    })
  })

  describe('CardDescription', () => {
    it('renders card description', () => {
      const { container } = render(<CardDescription>Description text</CardDescription>)
      const desc = container.querySelector('[data-slot="card-description"]')
      expect(desc).toBeInTheDocument()
      expect(desc).toHaveTextContent('Description text')
    })
  })

  describe('CardContent', () => {
    it('renders card content', () => {
      const { container } = render(<CardContent>Content here</CardContent>)
      const content = container.querySelector('[data-slot="card-content"]')
      expect(content).toBeInTheDocument()
      expect(content).toHaveTextContent('Content here')
    })
  })

  describe('CardFooter', () => {
    it('renders card footer', () => {
      const { container } = render(<CardFooter>Footer content</CardFooter>)
      const footer = container.querySelector('[data-slot="card-footer"]')
      expect(footer).toBeInTheDocument()
      expect(footer).toHaveTextContent('Footer content')
    })
  })

  describe('CardAction', () => {
    it('renders card action', () => {
      const { container } = render(<CardAction>Action button</CardAction>)
      const action = container.querySelector('[data-slot="card-action"]')
      expect(action).toBeInTheDocument()
    })
  })
})

