# Role-Based Access Control (RBAC) with Component IDs

This module provides a comprehensive solution for implementing role-based access control at the component level in your health insurance system application.

## Key Components

### 1. Component IDs (`component-access.ts`)

Each component in the system is assigned a unique component ID, which is used to determine if a user with a specific role can access it.

```typescript
// Example of component IDs
export enum ComponentId {
  USER_LIST = 'users.list',
  USER_CREATE = 'users.create',
  // More component IDs...
}
```

### 2. User Types and Components Mapping

The system defines which components are accessible to each user type:

```typescript
// Example mapping of user types to component IDs
export const USER_TYPE_COMPONENT_MAP: Record<UserType, ComponentId[]> = {
  [UserType.ADMIN]: Object.values(ComponentId), // Admin has access to all components
  [UserType.MEMBER]: [
    ComponentId.LOGIN,
    ComponentId.HEADER,
    // More accessible components...
  ],
  // More user types...
};
```

### 3. Component Gate (`component-gate.tsx`)

A React component that conditionally renders its children based on whether the user has access to the specified component:

```tsx
<ComponentGate componentId={ComponentId.USER_CREATE}>
  <UserCreationForm />
</ComponentGate>
```

### 4. Higher-Order Component (HOC)

A HOC that wraps a component with role-based access control:

```tsx
const ProtectedComponent = withComponentAccess(
  MyComponent,
  ComponentId.SOME_COMPONENT
);
```

## How to Use

### Adding Component Access to a Button

```tsx
import Button from '../../components/common/Button';
import { ComponentId } from '../../lib/rbac';

// The button will only be visible to users with USER_CREATE permission
<Button componentId={ComponentId.USER_CREATE}>
  Create User
</Button>
```

### Restricting Access to a Section

```tsx
import { ComponentGate, ComponentId } from '../../lib/rbac';

<ComponentGate componentId={ComponentId.POLICY_LIST}>
  <div>
    <h2>Policies</h2>
    <PolicyTable />
  </div>
</ComponentGate>
```

### Assigning a Component ID to a Custom Component

For any new component that needs role-based access control, follow these steps:

1. Add a new component ID in `component-access.ts`
2. Update the user type to component mapping
3. Use the ComponentGate or withComponentAccess HOC to protect the component

## Integration with Existing RBAC

This component-level access control works alongside the existing permission-based RBAC system:

- **Permission Gate**: Controls access based on resource/action permissions
- **Component Gate**: Controls access based on specific UI components
- **Role Gate**: Controls access based on user roles

## Demo

Check out the live demo at `/rbac-demo` to see how components are conditionally rendered based on the logged-in user's role. 