# Testing Setup Summary

## Overview

A comprehensive unit and integration testing setup has been created for the frontend application.

## What Was Created

### Configuration Files

1. **jest.config.js** - Jest configuration for unit tests
   - Configured for Next.js 16
   - React Testing Library setup
   - Coverage thresholds (50% minimum)
   - TypeScript support via ts-jest

2. **jest.setup.js** - Jest setup file
   - Mocked Next.js router
   - Mocked Next.js Image component
   - Mocked next-themes
   - Mocked sonner (toast notifications)
   - Global test timeout

3. **playwright.config.ts** - Playwright configuration for E2E tests
   - Configured for multiple browsers (Chrome, Firefox, Safari)
   - Local dev server integration
   - Screenshot on failure
   - HTML reporter

### Test Utilities

4. **__tests__/utils/test-utils.tsx** - Custom render function
   - Wraps components with AuthProvider and ThemeProvider
   - Custom render function for testing

5. **__tests__/utils/mocks.ts** - Mock data and API client
   - Mock API client functions
   - Mock user data (admin, employee, manager)
   - Mock API responses
   - Reset mocks utility

### Example Unit Tests

6. **__tests__/components/ui/button.test.tsx** - Button component tests
   - Rendering tests
   - Variant and size tests
   - Click event handling
   - Disabled state
   - Accessibility tests

7. **__tests__/components/ui/input.test.tsx** - Input component tests
   - Rendering tests
   - Value handling
   - Change events
   - Input types
   - Validation states

8. **__tests__/lib/api.test.ts** - API client tests
   - Method existence checks
   - Authentication methods
   - CRUD operations

9. **__tests__/lib/utils.test.ts** - Utility function tests
   - Currency formatting
   - Date formatting
   - String utilities
   - Array/Object utilities
   - Class name merging

10. **__tests__/hooks/useHierarchy.test.ts** - Hook test template
    - Placeholder for custom hook tests

### Integration Tests

11. **tests/integration/auth.spec.ts** - Authentication flow tests
    - Login form display
    - Validation errors
    - Invalid credentials
    - Successful login flow

12. **tests/integration/navigation.spec.ts** - Navigation tests
    - Dashboard navigation
    - Navigation menu accessibility
    - Mobile responsiveness

13. **tests/integration/users-management.spec.ts** - User management tests
    - Users list display
    - Create user button
    - Navigation to create page
    - User table structure

### Documentation

14. **TESTING.md** - Comprehensive testing guide
    - Test structure overview
    - Running tests instructions
    - Writing tests guidelines
    - Best practices
    - Debugging tips
    - Common issues and solutions

### Package.json Updates

- Added test scripts:
  - `test` - Run unit tests
  - `test:watch` - Watch mode
  - `test:coverage` - Coverage report
  - `test:ci` - CI mode
  - `test:e2e` - Integration tests
  - `test:e2e:ui` - UI mode
  - `test:e2e:headed` - Headed mode
  - `test:e2e:debug` - Debug mode
  - `test:all` - Run all tests

- Added dev dependencies:
  - Jest and related packages
  - React Testing Library
  - Playwright
  - Type definitions
  - Testing utilities

### .gitignore Updates

- Added test result directories
- Playwright cache and reports

## Next Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run Tests**
   ```bash
   # Unit tests
   npm run test

   # Integration tests
   npm run test:e2e
   ```

3. **Write More Tests**
   - Add tests for your pages (see TESTING.md for examples)
   - Add tests for custom hooks
   - Add tests for complex components
   - Add more integration test scenarios

4. **Set Up CI/CD**
   - Add test commands to your CI pipeline
   - Configure test coverage reporting
   - Set up automated test runs

## File Structure

```
frontend/
├── __tests__/
│   ├── components/
│   │   └── ui/
│   │       ├── button.test.tsx
│   │       └── input.test.tsx
│   ├── hooks/
│   │   └── useHierarchy.test.ts
│   ├── lib/
│   │   ├── api.test.ts
│   │   └── utils.test.ts
│   └── utils/
│       ├── test-utils.tsx
│       └── mocks.ts
├── tests/
│   └── integration/
│       ├── auth.spec.ts
│       ├── navigation.spec.ts
│       └── users-management.spec.ts
├── jest.config.js
├── jest.setup.js
├── playwright.config.ts
├── TESTING.md
└── TEST_SETUP_SUMMARY.md
```

## Coverage Goals

- **Current Threshold**: 50% minimum
- **Target Areas**:
  - Critical user flows: 80%+
  - Components: 70%+
  - Utilities: 90%+
  - Pages: 60%+

## Notes

- All test files use TypeScript
- Tests follow React Testing Library best practices
- Integration tests use Playwright for browser automation
- Mock data is centralized in `__tests__/utils/mocks.ts`
- Custom render function handles context providers automatically

## Support

For questions or issues:
1. Check TESTING.md for detailed documentation
2. Review example tests in `__tests__/` directory
3. Check Jest and Playwright official documentation




# Testing Guide

This document provides a comprehensive guide for testing in the frontend application.

## Overview

The project uses two main testing approaches:

1. **Unit Tests** - Using Jest and React Testing Library
2. **Integration/E2E Tests** - Using Playwright

## Test Structure

```
frontend/
├── __tests__/              # Unit tests
│   ├── components/         # Component tests
│   ├── lib/               # Utility and API tests
│   └── utils/             # Test utilities and mocks
├── tests/                  # Integration/E2E tests
│   └── integration/       # Playwright tests
├── jest.config.js         # Jest configuration
├── jest.setup.js          # Jest setup file
└── playwright.config.ts   # Playwright configuration
```

## Running Tests

### Unit Tests

```bash
# Run all unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests in CI mode
npm run test:ci
```

### Integration/E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI mode
npm run test:e2e:ui

# Run E2E tests in headed mode (see browser)
npm run test:e2e:headed

# Debug E2E tests
npm run test:e2e:debug

# Run all tests (unit + E2E)
npm run test:all
```

## Writing Unit Tests

### Component Tests

Component tests should be placed in `__tests__/components/` directory.

Example:

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '@/components/ui/button'

describe('Button Component', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('handles click events', async () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click</Button>)
    await userEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalled()
  })
})
```

### Utility Tests

Utility tests should be placed in `__tests__/lib/` directory.

Example:

```typescript
import { formatCurrency, formatDate } from '@/lib/utils'

describe('formatCurrency', () => {
  it('formats numbers correctly', () => {
    expect(formatCurrency(1000)).toMatch(/1,000/)
  })
})
```

## Writing Integration Tests

Integration tests should be placed in `tests/integration/` directory.

Example:

```typescript
import { test, expect } from '@playwright/test'

test.describe('User Authentication', () => {
  test('should login successfully', async ({ page }) => {
    await page.goto('/auth/login')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard')
  })
})
```

## Test Utilities

### Custom Render Function

Use the custom render function from `__tests__/utils/test-utils.tsx` for components that need context providers:

```typescript
import { render } from '@/__tests__/utils/test-utils'

test('renders with auth context', () => {
  render(<MyComponent />)
  // Component has access to AuthProvider and ThemeProvider
})
```

### Mock Data

Mock data and API client mocks are available in `__tests__/utils/mocks.ts`:

```typescript
import { mockUser, mockApiClient } from '@/__tests__/utils/mocks'

test('uses mock data', () => {
  mockApiClient.getUser.mockResolvedValue({ data: mockUser })
  // Your test code
})
```

## Best Practices

1. **Test Behavior, Not Implementation**
   - Focus on what users see and interact with
   - Avoid testing internal implementation details

2. **Use Semantic Queries**
   - Prefer `getByRole`, `getByLabelText` over `getByTestId`
   - Make tests more accessible and maintainable

3. **Keep Tests Isolated**
   - Each test should be independent
   - Use `beforeEach` for common setup

4. **Mock External Dependencies**
   - Mock API calls
   - Mock router navigation
   - Mock browser APIs

5. **Write Descriptive Test Names**
   - Use clear, descriptive test names
   - Follow the pattern: "should [expected behavior]"

6. **Maintain Test Coverage**
   - Aim for at least 50% code coverage
   - Focus on critical paths and user flows

## Coverage Reports

After running `npm run test:coverage`, you can view the coverage report:

- HTML report: Open `coverage/lcov-report/index.html` in your browser
- Terminal output: Coverage summary is displayed in the terminal

## Continuous Integration

The test suite is configured to run in CI environments:

- Unit tests run with `npm run test:ci`
- E2E tests run with `npm run test:e2e`
- Coverage thresholds are enforced (50% minimum)

## Debugging Tests

### Unit Tests

```bash
# Run a specific test file
npm run test button.test.tsx

# Run tests matching a pattern
npm run test -- --testNamePattern="renders"

# Debug in VS Code
# Add breakpoint and use "Debug Jest Test" configuration
```

### Integration Tests

```bash
# Run in debug mode
npm run test:e2e:debug

# Run with UI mode for step-by-step execution
npm run test:e2e:ui

# Run a specific test file
npx playwright test auth.spec.ts
```

## Common Issues

### Issue: Tests timeout

**Solution**: Increase timeout in test or jest config:

```typescript
jest.setTimeout(10000) // 10 seconds
```

### Issue: Styled Components not rendering

**Solution**: Ensure `next.config.ts` has styled-components compiler enabled (already configured).

### Issue: Next.js router errors

**Solution**: The router is already mocked in `jest.setup.js`. If you need custom mocks, update the setup file.

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Next.js Testing Guide](https://nextjs.org/docs/app/building-your-application/testing)

## Contributing

When adding new features:

1. Write tests alongside your code
2. Maintain or improve test coverage
3. Update this guide if you add new testing patterns
4. Ensure all tests pass before submitting PR

// installing of "npx playwright install" for chromium, webkit, firefox