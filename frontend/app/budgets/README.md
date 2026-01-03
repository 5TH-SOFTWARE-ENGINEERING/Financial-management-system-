## Budgets Module

The frontend/app/budgets directory provides a comprehensive framework for Financial Planning and Budget Management. It allows the organization to track expenditures against predefined limits, visualize spending habits, and manage departmental or project-specific fiscal cycles.

Based on the directory structure and code, its primary functions are:

1. Budget Monitoring Dashboard (/list / main page)
The central hub for tracking finances:

Visual Progress Tracking: Uses a grid-based interface to display current spending vs. limits.
Real-time Status Updates: Automatically tracks budget lifecycle stages such as Draft, Approved, Active, or Archived.
Financial Health Summary: Displays aggregated totals for Revenue, Expenses, and Net Profit for each budget cycle at a glance.
Filtering & Search: Advanced tools to find budgets by name, department, or project, and to narrow down lists by status.
2. Item-Level Management (/listitems, /additems, /edititems)
Budgets are broken down into granular line items for precise tracking:

Revenue & Expense Tracking: Manage individual financial entries within a larger budget framework.
Category-Based Allocation: Assigns expenditures to specific categories (e.g., Utilities, Salaries, Marketing) to monitor where money is going.
3. Lifecycle & Workflow (/create, /edit, /details)
Template-Based Creation: Allows users to create new budgets from scratch or use Templates to standardize fiscal planning.
Duration Control: Define specific start and end dates for budgeting periods (e.g., Monthly or Quarterly cycles).
Secure Administration: Sensitive actions, such as deleting a budget record, require administrator password verification.
4. Strategic Integration
Multi-Dimensional Reporting: Budgets are tied directly to Departments and Projects, allowing the organization to see which initiatives are within budget and which are over-spending.
Automated Aggregation: The system automatically sums transactions mapped to categories to provide real-time updates on "Remaining Budget."