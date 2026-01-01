# Scenarios

Scenarios are a powerful tool for simulating various application states, API responses, and edge cases during development and testing. They allow developers to switch between different data sets and network behaviors dynamically without modifying the core application logic.

## How It Works

The scenario system operates by intercepting network requests (typically using a library like MSW - Mock Service Worker) and providing a management layer to toggle between different sets of mock handlers.

1.  **Registration**: Scenarios are defined with a unique ID and a set of request handlers.
2.  **Selection**: The user selects a scenario via a developer dashboard or a query parameter.
3.  **Interception**: When the application makes a network request, the scenario manager checks if the active scenario has a matching handler.
4.  **Response**: If a match is found, the mock response is returned; otherwise, it falls back to default mocks or the actual network.

## Core Functions

### `defineScenario(config)`
This function is used to register a new scenario. It encapsulates the metadata and the specific network behavior for a use case.
- **Arguments**:
    - `id`: A unique string identifier.
    - `name`: A display name for the UI.
    - `description`: A brief explanation of what the scenario simulates.
    - `handlers`: An array of MSW handlers (e.g., `http.get`, `http.post`).
- **Returns**: A scenario object ready for registration.

### `activateScenario(id)`
Programmatically switches the application's current state to the specified scenario.
- **Arguments**: `id` (string) - The ID of the scenario to enable.
- **Effect**: Updates the global state and refreshes the mock service worker to apply the new handlers.

### `getAvailableScenarios()`
Retrieves a list of all registered scenarios.
- **Returns**: `Array<Scenario>` - Useful for populating developer toolbars or selection menus.

### `useScenarioState()`
A React hook that provides the current status of the scenario system.
- **Returns**:
    - `currentScenario`: The currently active scenario object.
    - `isActive`: A boolean indicating if any scenario is currently overriding defaults.
    - `reset()`: A function to clear the active scenario and return to default behavior.

### `setupWorker(scenarios)`
Initializes the underlying mock service worker with the provided scenarios.
- **Arguments**: `scenarios` - An array of all defined scenarios.
- **Usage**: Typically called in the application's entry point (e.g., `main.tsx` or `index.tsx`) during development.

## Example Usage

```typescript
const successScenario = defineScenario({
  id: 'user-success',
  name: 'Successful User Load',
  handlers: [
    http.get('/api/user', () => {
      return HttpResponse.json({ id: '1', name: 'John Doe' });
    }),
  ],
});
```
