# Department Module

The Department module provides the user interface and logic for managing organizational departments. This includes viewing department hierarchies, managing staff assignments, and updating department metadata.

## Features

- **Overview Dashboard**: Summary of department statistics and activities.
- **Management Interface**: CRUD operations for department records.
- **Staff Assignment**: Tools to assign or transfer employees between departments.
- **Search & Filter**: Advanced filtering by location, head of department, or status.

## Folder Structure

```text
frontend/app/department/
├── components/       # UI components (List, Form, Card)
├── hooks/            # Data fetching and business logic hooks
├── services/         # API client integrations
├── types/            # TypeScript definitions
├── utils/            # Formatting and validation helpers
└── page.tsx          # Main entry point for the department route
```

## Development

### Prerequisites

Ensure the backend services are running and the API environment variables are configured in your `.env` file.

### Running Tests

To run unit tests for this module:

```bash
npm test frontend/app/department
```

## API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/api/departments` | Retrieve all departments |
| POST | `/api/departments` | Create a new department |
| GET | `/api/departments/:id` | Get specific department details |
| PATCH | `/api/departments/:id` | Update department information |
| DELETE | `/api/departments/:id` | Archive/Delete a department |
