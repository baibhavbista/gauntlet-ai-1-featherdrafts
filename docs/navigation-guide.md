# Navigation Guide

This document explains the new URL-based navigation system in FeatherDrafts.

## Overview

The app has been refactored from state-based navigation to URL-based navigation using Next.js 15 App Router. This provides better SEO, shareable links, and proper browser navigation support.

## Route Structure

```
/                    # Landing page (public)
/login              # Login form (public, redirects if authenticated)  
/signup             # Signup form (public, redirects if authenticated)
/threads            # Thread dashboard (protected)
/thread/[threadId]  # Thread editor (protected)
/auth/callback      # OAuth callback (handles redirects)
```

## New Navigation Pattern

### Use the `useNavigation` Hook (Recommended)

```typescript
import { useNavigation } from '@/hooks'

function MyComponent() {
  const { navigateToThreads, navigateToThread, navigateToLogin } = useNavigation()

  const handleClick = () => {
    navigateToThread('thread-id-123')
  }

  return <button onClick={handleClick}>Go to Thread</button>
}
```

### Available Navigation Methods

```typescript
const {
  // Basic navigation
  navigateToThreads,       // () => void
  navigateToThread,        // (threadId: string) => void
  navigateToLogin,         // (redirectTo?: string) => void
  navigateToSignup,        // (redirectTo?: string) => void
  navigateToLanding,       // () => void
  
  // History navigation
  navigateBack,            // () => void
  navigateForward,         // () => void
  
  // Utility functions
  refresh,                 // () => void
  replace,                 // (url: string) => void
  
  // Direct router access
  router,                  // NextRouter
} = useNavigation()
```

### Direct Router Usage (Alternative)

```typescript
import { useRouter } from 'next/navigation'

function MyComponent() {
  const router = useRouter()

  const handleClick = () => {
    router.push('/thread/thread-id-123')
  }

  return <button onClick={handleClick}>Go to Thread</button>
}
```

## Getting Current Route Information

### Use Next.js Hooks

```typescript
import { usePathname, useParams, useSearchParams } from 'next/navigation'

function MyComponent() {
  const pathname = usePathname()           // '/thread/123'
  const params = useParams()              // { threadId: '123' }
  const searchParams = useSearchParams()  // URLSearchParams object

  return <div>Current path: {pathname}</div>
}
```

### Route-Specific Patterns

```typescript
// In a thread detail page
function ThreadDetailPage() {
  const params = useParams()
  const threadId = params.threadId as string
  
  // Use threadId...
}

// In a page that needs to check auth redirect
function LoginPage() {
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo')
  
  // After login, redirect to intended destination
  const handleSuccess = () => {
    const destination = redirectTo || '/threads'
    router.push(destination)
  }
}
```

## Route Protection

Route protection is handled by middleware (`middleware.ts`):

- ✅ **Automatic redirects**: Unauthenticated users accessing protected routes are redirected to login
- ✅ **Preserve intended destination**: Login includes `?redirectTo=` parameter
- ✅ **Prevent auth page access**: Authenticated users can't access login/signup pages

## Legacy Navigation Store

The navigation store has been simplified but is still available for backward compatibility:

```typescript
import { useNavigationStore } from '@/store'

function MyComponent() {
  const { 
    navigationHistory,
    addToHistory,
    clearHistory,
    
    // Deprecated methods (will log warnings)
    navigateToThreads,  // Use useNavigation hook instead
    navigateToThread,   // Use useNavigation hook instead
  } = useNavigationStore()
}
```

## Migration Guide

### Before (State-based)

```typescript
import { useNavigation } from '@/store'

function MyComponent() {
  const { currentView, navigateToThreads } = useNavigation()
  
  if (currentView === 'threads') {
    // ...
  }
  
  const handleClick = () => {
    navigateToThreads()
  }
}
```

### After (URL-based)

```typescript
import { usePathname } from 'next/navigation'
import { useNavigation } from '@/hooks'

function MyComponent() {
  const pathname = usePathname()
  const { navigateToThreads } = useNavigation()
  
  if (pathname === '/threads') {
    // ...
  }
  
  const handleClick = () => {
    navigateToThreads()
  }
}
```

## Best Practices

1. **Use the `useNavigation` hook** for consistent navigation patterns
2. **Use Next.js hooks** for route information (`usePathname`, `useParams`, etc.)
3. **Let middleware handle auth** instead of component-level redirects
4. **Use URL search params** for shareable filter states
5. **Leverage browser history** with `navigateBack()` instead of custom history management

## Examples

### Thread List with Navigation

```typescript
import { useNavigation } from '@/hooks'

function ThreadList() {
  const { navigateToThread } = useNavigation()
  
  return (
    <div>
      {threads.map(thread => (
        <div 
          key={thread.id}
          onClick={() => navigateToThread(thread.id)}
        >
          {thread.title}
        </div>
      ))}
    </div>
  )
}
```

### Protected Component

```typescript
import { usePathname } from 'next/navigation'
import { useAuth } from '@/store'

function ProtectedComponent() {
  const { user } = useAuth()
  const pathname = usePathname()
  
  // Middleware handles redirects, so we can assume user exists here
  // But still good to check for safety
  if (!user) {
    return <div>Loading...</div>
  }
  
  return <div>Welcome to {pathname}</div>
}
``` 