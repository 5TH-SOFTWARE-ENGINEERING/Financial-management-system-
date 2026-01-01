# Variance Analysis Module

The **Variance** module is designed to calculate, analyze, and visualize the discrepancies between two sets of data—typically **Actual** performance versus **Budgeted** or **Target** benchmarks.

## Core Concepts

### 1. Definition of Variance
Variance represents the difference between an expected result and the actual result. It is a critical KPI for identifying operational inefficiencies or unexpected growth.

### 2. Calculation Logic
The module implements two primary metrics:
- **Absolute Variance**: `Actual - Target`
- **Percentage Variance**: `((Actual - Target) / Target) * 100`

### 3. Variance Classification
- **Favorable (F)**: When actual revenue exceeds targets or actual expenses are below budget.
- **Unfavorable (U)**: When actual revenue falls short of targets or actual expenses exceed budget.

## Implementation Details

The logic within `frontend/app/variance` follows a standard pattern:
- **Data Transformation**: Normalizing raw API responses to align "Actual" and "Target" timestamps.
- **Dynamic Styling**: Utilizing conditional formatting (e.g., green for favorable, red for unfavorable) based on the metric type (Income vs. Expense).
- **Visualization**: Rendering trend lines and waterfall charts to show how individual components contribute to the total variance.

## Key Components
- `VarianceTable`: A high-density grid showing line-item variances.
- `VarianceChart`: A visual representation of deviations over time.
- `useVarianceCalculator`: A custom hook for standardized calculations across the application.
