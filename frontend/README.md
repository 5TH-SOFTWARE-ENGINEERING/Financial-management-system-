# Financial Management System - Frontend

A comprehensive financial management system built with Next.js, React, and TypeScript. This frontend application provides a complete suite of tools for managing finances, budgets, forecasts, and analytics.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun
- Backend API server running (see backend README)

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📋 Project Overview

This is a full-featured financial management system with the following core capabilities:

- **Revenue & Expense Management**: Track and manage all financial transactions
- **Budgeting & Forecasting (FP&A)**: Create budgets, scenarios, and forecasts
- **Variance Analysis**: Compare budget vs actual performance
- **Approval Workflows**: Multi-level approval system for transactions
- **Advanced Analytics**: Customizable dashboards with KPIs and trend analysis
- **User Management**: Role-based access control with hierarchy
- **Reporting**: Generate comprehensive financial reports

## 🏗️ Architecture

```
frontend/
├── app/                              # Next.js App Router
│   ├── globals.css                   # Global styles
│   ├── layout.tsx                    # Root layout with providers
│   ├── page.tsx                      # Home/landing page
│   ├── (protected)/                  # Protected routes wrapper
│   │   └── layout.tsx                # Protected layout with sidebar
│   │
│   ├── auth/                         # Authentication
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   │
│   ├── dashboard/                    # Main dashboard
│   │   └── page.tsx                  # Dashboard with KPIs & charts
│   │
│   ├── revenue/                      # Revenue management
│   │   ├── page.tsx                  # List & create revenue entries
│   │   ├── items/                    # Revenue items calculator
│   │   └── components/
│   │
│   ├── expenses/                     # Expense management
│   │   ├── page.tsx                  # List & create expense entries
│   │   ├── items/                    # Expense items calculator
│   │   └── components/
│   │
│   ├── budgets/                      # Budget management
│   │   ├── page.tsx                  # Budget list with templates
│   │   ├── create/page.tsx           # Create new budget
│   │   ├── [id]/page.tsx             # Budget detail view
│   │   ├── edit/[id]/page.tsx        # Edit budget
│   │   ├── listitems/page.tsx        # Budget items list
│   │   ├── additems/page.tsx         # Add budget item
│   │   └── edititems/[id]/page.tsx   # Edit budget item
│   │
│   ├── scenarios/                    # Scenario planning
│   │   ├── page.tsx                  # Main scenarios hub
│   │   ├── list/page.tsx             # Scenario list
│   │   ├── create/page.tsx           # Create scenario
│   │   └── campare/page.tsx          # Compare scenarios
│   │
│   ├── forecast/                     # Financial forecasting
│   │   ├── page.tsx                  # Main forecast hub
│   │   ├── list/page.tsx             # Forecast list
│   │   ├── create/page.tsx           # Create forecast
│   │   └── [id]/page.tsx             # Forecast detail
│   │
│   ├── variance/                     # Variance analysis
│   │   ├── page.tsx                  # Variance hub
│   │   ├── calculatevariance/        # Calculate variance
│   │   ├── variancehistory/          # Variance history
│   │   └── variancesummery/          # Variance summary
│   │
│   ├── analytics/                    # Advanced analytics
│   │   └── page.tsx                  # Analytics dashboard with KPIs & charts
│   │
│   ├── users/                        # User management
│   │   ├── page.tsx                  # User hierarchy view
│   │   └── [id]/                     # User details & edit
│   │       ├── page.tsx
│   │       └── edit/page.tsx
│   │
│   ├── approvals/                    # Approval workflows
│   │   ├── page.tsx                  # Pending approvals list
│   │   └── [id]/page.tsx             # Approval detail
│   │
│   ├── project/                      # Project management
│   │   ├── page.tsx                  # Project hub/redirect
│   │   ├── list/page.tsx             # Project list
│   │   ├── create/page.tsx           # Create project
│   │   └── edit/[id]/page.tsx        # Edit project
│   │
│   ├── department/                   # Department management
│   │   ├── page.tsx                  # Department hub/redirect
│   │   ├── list/page.tsx             # Department list
│   │   ├── create/page.tsx           # Create department
│   │   ├── edit/[id]/page.tsx        # Edit department
│   │   └── delete/[id]/page.tsx      # Delete department
│   │
│   ├── employees/                    # Employee management
│   │   ├── list/page.tsx
│   │   ├── create/page.tsx
│   │   ├── edit/[id]/page.tsx
│   │   └── delete/[id]/page.tsx
│   │
│   ├── accountants/                  # Accountant management
│   │   ├── list/page.tsx
│   │   ├── create/page.tsx
│   │   ├── edit/[id]/page.tsx
│   │   └── delete/[id]/page.tsx
│   │
│   ├── finance/                      # Finance user management
│   │   ├── list/page.tsx
│   │   ├── create/page.tsx
│   │   ├── edit/[id]/page.tsx
│   │   └── delete/[id]/page.tsx
│   │
│   ├── settings/                     # User settings
│   │   ├── page.tsx                  # Settings hub
│   │   ├── profile/page.tsx          # Profile management
│   │   ├── security/page.tsx         # Security (2FA, IP restriction)
│   │   ├── logs/page.tsx             # Audit logs
│   │   ├── history/page.tsx          # Login history
│   │   ├── notifications/page.tsx    # Notification preferences
│   │   ├── backup/page.tsx           # Backup settings
│   │   ├── general/page.tsx          # General settings
│   │   └── users-roles/              # User & role management
│   │       ├── roles/page.tsx
│   │       ├── user-roles/page.tsx
│   │       └── permission-management/page.tsx
│   │
│   ├── profile/                      # User profile
│   │   └── page.tsx                  # Profile view/edit
│   │
│   ├── permissions/                  # Permission management
│   │   └── page.tsx                  # Permission manager
│   │
│   ├── reports/                      # Reporting
│   │   └── page.tsx                  # Report generator
│   │
│   ├── notifications/                # Notifications
│   │   └── page.tsx                  # Notification center
│   │
│   ├── search/                       # Global search
│   │   └── page.tsx                  # Multi-resource search
│   │
│   ├── transaction/                  # Transaction management
│   │   └── list/page.tsx             # Transaction list
│   │
│   ├── admin/                        # Admin panel
│   │   └── page.tsx                  # System administration
│   │
│   └── unauthorized/                 # Unauthorized access
│       └── page.tsx                  # 403/unauthorized page
│
├── components/                       # Reusable components
│   ├── ui/                           # UI components (buttons, inputs, etc.)
│   ├── common/                       # Common components
│   │   ├── Sidebar.tsx               # Navigation sidebar
│   │   ├── Navbar.tsx                # Top navigation bar
│   │   ├── Layout.tsx                # Page layout wrapper
│   │   └── theme.ts                  # Theme configuration
│   └── layout.tsx                    # Layout wrapper
│
├── lib/                              # Core libraries
│   ├── api.ts                        # API client (Axios)
│   ├── rbac/                         # Role-based access control
│   │   ├── auth-context.tsx          # Auth context provider
│   │   ├── component-access.ts       # Component permissions
│   │   └── use-authorization.ts      # Authorization hooks
│   └── utils.ts                      # Utility functions
│
├── store/                            # State management
│   └── userStore.ts                  # Zustand user store
│
├── hooks/                            # Custom React hooks
│   └── useHierarchy.ts               # User hierarchy hook
│
├── __tests__/                        # Unit tests
│   ├── components/                   # Component tests
│   ├── lib/                          # Library tests
│   └── utils/                        # Test utilities
│
├── tests/                            # Integration/E2E tests
│   └── integration/                  # Playwright tests
│
├── public/                           # Static assets
│
├── next.config.js                    # Next.js configuration
├── jest.config.js                    # Jest configuration
├── playwright.config.ts              # Playwright configuration
├── tsconfig.json                     # TypeScript configuration
└── package.json                      # Dependencies
```

## ✨ Key Features

### Core Financial Management

- **Revenue Tracking**: Create, edit, and manage revenue entries with categories and approval workflows
- **Expense Management**: Track expenses with vendors, categories, and receipt attachments
- **Items Calculator**: Calculate revenue/expense items automatically
- **Recurring Transactions**: Set up recurring revenue and expense entries

### Budgeting & Forecasting (FP&A)

- **Budget Creation**: 
  - Manual budget creation with items
  - Template-based budgets (monthly, quarterly, yearly)
  - Budget validation
  - Budget items management (add, edit, delete)
  
- **Scenario Planning**:
  - Create what-if scenarios (best case, worst case, most likely, custom)
  - Adjust budget items using multipliers or fixed amounts
  - Side-by-side scenario comparison
  - Impact analysis

- **Financial Forecasting**:
  - Moving average forecasts
  - Linear growth forecasts
  - Trend analysis (linear regression)
  - Historical data integration
  - Period-based forecasts (monthly, quarterly, yearly)

- **Variance Analysis**:
  - Calculate budget vs actual variance
  - Variance history tracking
  - Variance summary reports
  - Revenue, expense, and profit variance analysis

### Advanced Analytics

- **Customizable Dashboards**: 
  - Real-time KPI metrics
  - Growth indicators
  - Trend analysis
  - Category breakdowns
  
- **Time-Series Analysis**: 
  - Revenue vs expenses over time
  - Profit trend analysis
  - Dynamic period filtering (week, month, quarter, year, custom)

### User & Access Management

- **Role-Based Access Control (RBAC)**:
  - Admin, Finance Manager, Manager, Accountant, Employee roles
  - Component-level permissions
  - User hierarchy management
  
- **Security Features**:
  - Two-Factor Authentication (2FA)
  - IP Address Restriction
  - Login activity tracking
  - Password management

### Approval Workflows

- **Multi-Level Approvals**: 
  - Approve/reject transactions
  - Approval comments
  - Status tracking
  - Deduplication logic

### Reporting & Search

- **Comprehensive Reports**: Generate financial reports with filters
- **Global Search**: Search across users, revenue, expenses, projects, departments
- **Audit Logs**: Track all system activities

## 🛠️ Technology Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Styled Components + Tailwind CSS
- **State Management**: Zustand
- **API Client**: Axios
- **Forms**: React Hook Form
- **Notifications**: Sonner
- **Icons**: Lucide React
- **Testing**: Jest + React Testing Library, Playwright

## 📦 Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm start                # Start production server

# Testing
npm run test             # Run unit tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report
npm run test:e2e         # Run integration/E2E tests
npm run test:all         # Run all tests

# Linting
npm run lint             # Run ESLint
npm run type-check       # Check TypeScript types
```

## 🔐 Authentication & Authorization

The application uses JWT-based authentication with role-based access control:

- **JWT Tokens**: Stored in localStorage
- **RBAC System**: Component-level permissions
- **User Roles**: Admin, Finance Manager, Manager, Accountant, Employee
- **Hierarchy**: Managers can see their team's data

## 🎨 Theme & Styling

The application uses a consistent theme system:

- **Primary Color**: Green (#00AA00)
- **Theme Provider**: Centralized theme configuration
- **Responsive Design**: Mobile-friendly layouts
- **Styled Components**: Component-level styling

## 📡 API Integration

All API calls are centralized in `lib/api.ts`:

- **Base URL**: Configurable via environment variables
- **Authentication**: Automatic JWT token injection
- **Error Handling**: Centralized error handling
- **Request/Response Interceptors**: Token refresh, error handling

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🧪 Testing

### Unit Tests

Tests are located in `__tests__/` directory:

```bash
npm run test
```

### Integration Tests

E2E tests use Playwright:

```bash
npm run test:e2e
```

See `TESTING.md` for detailed testing documentation.

## 📱 Responsive Design

The application is fully responsive:

- **Desktop**: Full-featured layouts
- **Tablet**: Optimized grid layouts
- **Mobile**: Collapsible sidebar, stacked layouts

## 🔄 Navigation Structure

### Main Navigation (Sidebar)

- Dashboard
- Revenue
- Expenses
- Budgets
- Forecasts
- Scenarios
- Variance
- Analytics
- Users
- Projects
- Departments
- Approvals
- Reports
- Notifications
- Settings
- Admin (Admin only)

## 📋 Feature Status

### ✅ Fully Implemented

- ✅ Revenue & Expense Management
- ✅ Budgeting System (CRUD, Templates, Validation)
- ✅ Scenario Planning (Create, Compare)
- ✅ Financial Forecasting (3 Methods)
- ✅ Variance Analysis (Calculate, History, Summary)
- ✅ Advanced Analytics Dashboard
- ✅ Budget Items Management
- ✅ User Management with Hierarchy
- ✅ Approval Workflows
- ✅ Authentication & Authorization (2FA, IP Restriction)
- ✅ Reports & Search
- ✅ Notifications

### 🔄 Future Enhancements

- [ ] Budget approval workflow
- [ ] Budget version tracking
- [ ] Export functionality (CSV/PDF)
- [ ] Enhanced forecasting methods
- [ ] Budget templates management UI
- [ ] Performance optimizations
- [ ] Caching strategy

## 🚀 Deployment

### Production Build

```bash
npm run build
npm start
```

### Environment Setup

Ensure all environment variables are configured:

- `NEXT_PUBLIC_API_URL`: Backend API URL
- `NEXT_PUBLIC_APP_URL`: Frontend application URL

### Recommended Platforms

- **Vercel**: Optimal for Next.js applications
- **Netlify**: Good alternative
- **Self-hosted**: Docker containerization supported

## 📚 Documentation

- **API Documentation**: See backend API docs at `/docs` endpoint
- **Testing Guide**: See `TESTING.md` for testing documentation
- **Component Documentation**: Inline JSDoc comments

## 🤝 Contributing

1. Follow TypeScript best practices
2. Use styled-components for styling
3. Maintain consistent error handling
4. Write tests for new features
5. Follow the existing code structure

## 📝 Notes

- **Backend Required**: Frontend requires backend API server running on port 8000 (default)
- **Database**: Backend manages database, frontend only handles API calls
- **Real-time Updates**: Consider adding WebSocket support for real-time notifications
- **Caching**: Consider implementing React Query or SWR for better caching

## 🐛 Troubleshooting

### Common Issues

**CORS Errors**: Ensure backend CORS is configured to allow frontend origin

**Authentication Issues**: Check JWT token expiration and refresh logic

**API Connection Errors**: Verify backend server is running and accessible

**Build Errors**: Check TypeScript types and ensure all dependencies are installed

## 📄 License

[Your License Here]

## 🔗 Links

- **Backend Repository**: [Backend README](../backend/README.md)
- **API Documentation**: http://localhost:8000/docs (when backend is running)
- **Next.js Docs**: https://nextjs.org/docs

---

**Status**: ✅ Production Ready

All core features are fully functional and tested. The application is ready for deployment and use.


When adding new features:

1. Write tests alongside your code
2. Maintain or improve test coverage
3. Update this guide if you add new testing patterns
4. Ensure all tests pass before submitting PR

// installing of "npx playwright install" for chromium, webkit, firefox
      Next steps
Install dependencies:
   npm install
Run tests:
   # Unit tests  
    npm run test  
     # Watch mode 
       npm run test:watch  
        # With coverage 
          npm run test:coverage  
           # Integration/E2E tests  
            npm run test:e2e
Available test commands
npm run test - Run all unit tests
npm run test:watch - Watch mode for development
npm run test:coverage - Generate coverage report
npm run test:ci - CI mode with coverage
npm run test:e2e - Run integration tests
npm run test:e2e:ui - Playwright UI mode
npm run test:all - Run both unit and E2E tests
Test coverage
The setup includes:
50% minimum coverage threshold
Example tests for components, utilities, and pages
Mock data for testing
Integration test examples
All tests are ready to use. See TESTING.md for detailed documentation on writing and running tests.