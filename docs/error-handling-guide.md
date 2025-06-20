# Error Handling Guide

This document explains the comprehensive error handling system in FeatherDrafts.

## Overview

The app uses a multi-layered error handling approach with:

1. **Next.js Error Pages**: Custom 404, 500, and route-specific error pages
2. **Error Boundaries**: React error boundaries for component-level errors
3. **Custom Error Hooks**: Reusable error handling logic
4. **Loading States**: Proper loading indicators and skeleton screens

## Error Pages

### Global Error Pages

#### 1. `app/not-found.tsx` (404 Page)
```typescript
// Custom 404 page with navigation options
- Branded design with FeatherDrafts logo
- Multiple navigation options (Home, Threads, Go Back)
- Helpful messaging for users
```

#### 2. `app/error.tsx` (Global Error Page)
```typescript
// Catches unhandled errors across the app
- Shows error details in development
- Provides "Try Again" and "Go to Home" options
- Error reporting ready (digest ID)
```

#### 3. `app/loading.tsx` (Global Loading Page)
```typescript
// Default loading state for route transitions
- Branded loading animation
- Consistent styling
```

### Route-Specific Error Pages

#### 1. `app/thread/[threadId]/error.tsx`
```typescript
// Handles thread-specific errors
- Differentiates between 404, 403, and generic errors
- Contextual error messages
- Appropriate navigation options
- No "Try Again" for 404/403 errors
```

#### 2. `app/thread/[threadId]/loading.tsx`
```typescript
// Thread-specific loading with skeleton
- Mimics actual thread layout
- Progress indicators
- Contextual loading messages
```

## Error Boundaries

### Main Error Boundary (`components/ui/error-boundary.tsx`)

```typescript
import { ErrorBoundary } from '@/components/ui/error-boundary'

// Wrap components that might throw errors
<ErrorBoundary fallback={CustomErrorComponent}>
  <MyComponent />
</ErrorBoundary>
```

**Features:**
- Class-based React error boundary
- Development error details
- Custom fallback components
- Reset functionality
- Error logging ready

### Usage in Layout

```typescript
// app/layout.tsx
<ErrorBoundary>
  <ThemeProvider>
    {children}
  </ThemeProvider>
</ErrorBoundary>
```

## Custom Error Hook

### `useErrorHandler` Hook

```typescript
import { useErrorHandler } from '@/hooks'

function MyComponent() {
  const { handleError, handleAsyncError } = useErrorHandler()

  // Handle sync errors
  const handleClick = () => {
    try {
      riskyOperation()
    } catch (error) {
      handleError(error, 'MyComponent.handleClick')
    }
  }

  // Handle async errors
  const handleAsyncClick = () => {
    handleAsyncError(
      () => riskyAsyncOperation(),
      'MyComponent.handleAsyncClick',
      fallbackValue
    )
  }
}
```

**Features:**
- Automatic error routing based on status codes
- Development logging
- Context tracking
- Async error handling
- Fallback values

### Error Types Handled

```typescript
interface AppError extends Error {
  code?: string
  statusCode?: number
  digest?: string
}

// Error routing:
404/NOT_FOUND     → Throw for Next.js 404 page
401/UNAUTHORIZED  → Redirect to /login
403/FORBIDDEN     → Throw "Access denied" error
500/INTERNAL      → Throw "Internal error" error
default           → Re-throw for error boundary
```

## Loading Components

### Loading Spinner Component

```typescript
import { LoadingSpinner, PageLoading } from '@/components/ui/loading-spinner'

// Inline loading
<LoadingSpinner 
  size="md" 
  variant="default" 
  text="Loading..." 
/>

// Full page loading
<PageLoading text="Loading threads..." variant="branded" />
```

**Variants:**
- `default`: Simple spinner with optional text
- `branded`: FeatherDrafts logo with spinner
- `minimal`: Just the spinner, no text

**Sizes:**
- `sm`: Small (16px)
- `md`: Medium (24px) - default
- `lg`: Large (32px)
- `xl`: Extra large (48px)

## Implementation Patterns

### 1. Route Validation

```typescript
// app/thread/[threadId]/page.tsx
useEffect(() => {
  if (!threadId || typeof threadId !== 'string') {
    notFound() // Triggers 404 page
  }

  // UUID validation
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(threadId)) {
    notFound()
  }
}, [threadId])
```

### 2. Component Error Handling

```typescript
function MyComponent() {
  const { handleAsyncError } = useErrorHandler()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    const result = await handleAsyncError(
      () => fetchData(),
      'MyComponent.loadData'
    )
    
    if (!result) {
      setError('Failed to load data')
    }
    
    setLoading(false)
  }, [handleAsyncError])

  if (loading) return <LoadingSpinner text="Loading data..." />
  if (error) return <div className="text-red-600">{error}</div>

  return <div>Content</div>
}
```

### 3. API Error Handling

```typescript
// In API calls
async function fetchThread(id: string) {
  try {
    const response = await fetch(`/api/threads/${id}`)
    
    if (!response.ok) {
      const error = new Error('Thread not found') as AppError
      error.statusCode = response.status
      throw error
    }
    
    return response.json()
  } catch (error) {
    // Error will be handled by useErrorHandler
    throw error
  }
}
```

## Error States UX

### Loading States
```typescript
// Skeleton loading for better perceived performance
<div className="space-y-4">
  {[1, 2, 3].map(i => (
    <div key={i} className="bg-gray-200 animate-pulse h-4 rounded" />
  ))}
</div>
```

### Error States
```typescript
// Contextual error messages
- "Thread not found" → Navigate to threads list
- "Access denied" → Clear explanation, navigate home
- "Network error" → Try again button
- "Validation error" → Inline form feedback
```

### Empty States
```typescript
// When no data is available
<div className="text-center py-12">
  <FileX className="h-12 w-12 text-gray-400 mx-auto mb-4" />
  <h3 className="text-lg font-medium text-gray-900 mb-2">No threads found</h3>
  <p className="text-gray-600 mb-4">Create your first thread to get started</p>
  <Button onClick={handleCreate}>Create Thread</Button>
</div>
```

## Error Monitoring

### Development
- Console error logging with context
- Error details in error pages
- Component stack traces
- Error boundaries catch all errors

### Production Ready
```typescript
// Error reporting integration points
componentDidCatch(error, errorInfo) {
  // Send to error reporting service
  // logErrorToService(error, errorInfo)
}

useEffect(() => {
  // Log error to monitoring service
  // if (error) reportError(error, context)
}, [error])
```

## Best Practices

### 1. Error Boundary Placement
```typescript
// Wrap major sections
<ErrorBoundary>
  <ThreadEditor />
</ErrorBoundary>

// Don't wrap every small component
```

### 2. Loading State Management
```typescript
// Show loading immediately
setLoading(true)

// Always clear loading in finally
try {
  await operation()
} finally {
  setLoading(false)
}
```

### 3. Error Context
```typescript
// Always provide context
handleError(error, 'ThreadList.loadThreads')
handleError(error, 'ThreadEditor.saveContent')
```

### 4. User-Friendly Messages
```typescript
// Technical error
throw new Error('Network request failed with status 500')

// User-friendly error
throw new Error('Unable to save your changes. Please check your connection and try again.')
```

## Testing Error Scenarios

### Development Testing
```typescript
// Test error boundaries
function ErrorThrowingComponent() {
  throw new Error('Test error boundary')
}

// Test async errors
const testAsyncError = async () => {
  throw new Error('Test async error handling')
}

// Test 404 pages
// Visit: /thread/invalid-id
// Visit: /nonexistent-page
```

### Error Simulation
```typescript
// Add to component for testing
if (process.env.NODE_ENV === 'development' && window.location.search.includes('test-error')) {
  throw new Error('Test error simulation')
}
```

This comprehensive error handling system ensures users always have a clear path forward, even when things go wrong. 