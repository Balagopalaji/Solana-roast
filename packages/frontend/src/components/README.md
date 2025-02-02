# Component Structure

## Organization
- `/ui`: Base UI components (Button, Window, etc.)
- `/common`: Shared utility components (ErrorBoundary, etc.)
- `/roast`: Feature-specific components

## Import Pattern
```typescript
// Preferred: Import from index
import { Button, Window } from '../ui';

// Avoid: Direct imports
import { Button } from '../ui/Button';
```