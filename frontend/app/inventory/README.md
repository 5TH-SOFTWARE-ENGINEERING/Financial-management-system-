# Inventory Management Module

This directory contains the components, logic, and state management for the application's inventory system. It facilitates tracking product stock, managing categories, and handling supplier data.

## Features

- **Inventory Dashboard**: Overview of stock levels and key metrics.
- **Item Management**: Full CRUD operations for inventory items.
- **Stock Tracking**: Real-time updates on item availability and movements.
- **Filtering & Search**: Advanced search capabilities by SKU, category, or status.
- **Data Export**: Support for exporting inventory reports in CSV/PDF formats.

## Structure

- `/components`: UI elements such as `StockLevelIndicator`, `InventoryTable`, and `ItemModal`.
- `/hooks`: Custom hooks for inventory data fetching (e.g., `useInventory`, `useCategories`).
- `/services`: API integration layer for interacting with inventory endpoints.
- `/types`: TypeScript definitions and Zod schemas for inventory models.
- `/utils`: Formatting helpers for currency, units, and stock status.

## Usage

To use the primary inventory view in a page:

```tsx
import { InventoryTable } from './components/InventoryTable';

const InventoryPage = () => {
  return (
    <div className="p-6">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">Inventory Overview</h1>
      </header>
      <InventoryTable />
    </div>
  );
};

export default InventoryPage;
```

## Integration

Data is synchronized with the backend via REST API. Ensure that the `NEXT_PUBLIC_API_URL` environment variable is configured correctly for the services layer to communicate with the inventory microservice.
