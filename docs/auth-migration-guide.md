# Authentication Migration Guide

## Migration from Custom Zustand Auth to @supabase/ssr

This document outlines the migration from our custom Zustand-based auth system to the official `@supabase/ssr` package, which resolves infinite loading issues and provides better SSR support.

## ✅ What Was Changed

### 1. **New SSR-First Architecture**
- **Server Components**: Auth checks now happen server-side using `await createClient().auth.getUser()`
- **Client Components**: Use `useAuthContext()` for auth state when needed
- **Middleware**: Automatically refreshes expired tokens using `@supabase/ssr`

### 2. **File Structure Updates**
```
utils/supabase/
├── client.ts      # Client Component auth (replaces old lib/supabase.ts)
├── server.ts      # Server Component auth  
└── middleware.ts  # Session refresh logic

components/auth/
├── auth-context.tsx   # New client-side auth context
└── auth-provider.tsx  # Simplified provider (no loading states)
```

### 3. **Key Benefits**
- ✅ **No more infinite loading loops** on expired sessions
- ✅ **Faster page loads** with server-side auth checks
- ✅ **Automatic token refresh** via middleware
- ✅ **Better SEO** with proper SSR
- ✅ **Reduced complexity** (~70% less auth code)

## 🔄 How to Use the New System

### Server Components (Recommended)
```typescript
// app/protected-page/page.tsx
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function ProtectedPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  return <div>Hello {user.email}</div>
}
```

### Client Components (When Needed)
```typescript
// components/user-profile.tsx
"use client"
import { useAuthContext } from '@/components/auth/auth-context'

export function UserProfile() {
  const { user, signOut } = useAuthContext()
  
  if (!user) return null
  
  return (
    <div>
      <p>{user.email}</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  )
}
```

## 📋 Migration Checklist

### ✅ Completed
- [x] Created new SSR client utilities
- [x] Updated middleware for automatic token refresh
- [x] Converted all pages to server-side auth checks
- [x] Created new AuthContext for client components
- [x] Updated auth forms and UI components
- [x] Simplified Zustand auth slice (kept dictionary functions)
- [x] Added deprecation warnings for old patterns

### 🏗️ Still Using Legacy (Intentionally)
- `store/slices/authSlice.ts` - Dictionary management functions
- `lib/database.ts` - Database operations (works with both patterns)
- Some UI components - Dictionary-related functionality

## 🚨 Breaking Changes

### Deprecated Patterns
```typescript
// ❌ OLD - Don't use anymore
const { user, loading, isInitialized } = useAuth() // From store
if (!isInitialized) return <Loading />
if (!user) router.push('/login')

// ✅ NEW - Server-side approach
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect('/login')
```

### Auth Hook Changes
```typescript
// ❌ OLD
import { useAuth } from '@/store'

// ✅ NEW 
import { useAuthContext } from '@/components/auth/auth-context'
```

## 🐛 Issues Resolved

1. **Infinite Loading on Expired Sessions**
   - **Cause**: Complex client-side auth initialization waiting for session state
   - **Fix**: Server-side auth checks with immediate redirects

2. **Slow Initial Page Loads**
   - **Cause**: Client-side loading states blocking content
   - **Fix**: SSR renders authenticated content immediately

3. **Token Refresh Complexity**
   - **Cause**: Manual auth state management in Zustand
   - **Fix**: Automatic refresh via `@supabase/ssr` middleware

## 📝 Best Practices

### When to Use Each Pattern

| Use Case | Pattern | Example |
|----------|---------|---------|
| Page-level auth | Server Component | `if (!user) redirect('/login')` |
| Navigation menus | Client Component | `useAuthContext()` |
| Forms & UI | Client Component | `useAuthContext()` |
| Database queries | Server Actions | `createClient()` from server utils |

### Performance Tips

1. **Prefer Server Components** for auth checks
2. **Use Client Components** only when you need interactivity
3. **Minimize auth context usage** in favor of SSR
4. **Let middleware handle** token refresh automatically

## 🔧 Troubleshooting

### Common Issues

**Q: "Component using old `useAuth` from store"**
- Replace with `useAuthContext()` for UI state
- Use server-side checks for protection

**Q: "Loading state never resolves"**
- Check if using server-side auth pattern
- Remove client-side loading logic

**Q: "User state not updating"**
- Ensure AuthProvider wraps your app
- Check if middleware is running

## 📚 Further Reading

- [Supabase SSR Guide](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Next.js 15 Auth Patterns](https://nextjs.org/docs/app/building-your-application/authentication)
- [Project README.md](../README.md) for technical details 