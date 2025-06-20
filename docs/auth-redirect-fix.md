# Auth Redirect Fix - setState During Render Error

## Problem
Getting React error: "Cannot update a component (Router) while rendering a different component (LoginPage)"

This happens when calling `router.push()` or `router.replace()` directly in the render function, which tries to update the Router component while React is still rendering the current component.

## Root Cause
The issue was in these files where we were calling router methods directly in the render:

```tsx
// ❌ BAD - Calling router.push in render
if (user) {
  router.push('/threads') // This causes the error
  return null
}
```

## Solution
Move all router navigation calls to `useEffect` hooks to avoid setState during render:

```tsx
// ✅ GOOD - Calling router.push in useEffect
useEffect(() => {
  if (isInitialized && user) {
    router.replace('/threads')
  }
}, [isInitialized, user, router])

if (user) {
  return null // Just return null, useEffect handles redirect
}
```

## Files Fixed

### 1. `app/login/page.tsx`
- ✅ Moved authenticated user redirect to useEffect
- ✅ Added proper redirect destination handling
- ✅ Used `router.replace()` instead of `router.push()` to avoid history pollution

### 2. `app/signup/page.tsx`
- ✅ Same fix as login page
- ✅ Proper redirect destination handling

### 3. `app/threads/page.tsx`
- ✅ Moved unauthenticated user redirect to useEffect
- ✅ Show loading state while redirecting

### 4. `app/thread/[threadId]/page.tsx`
- ✅ Same fix as threads page

### 5. `middleware.ts`
- ✅ Simplified middleware to avoid conflicts with client-side redirects
- ✅ Let client-side handle most auth logic
- ✅ Removed aggressive server-side redirects that were causing loops

## Key Changes

### Router Method Choice
- **`router.replace()`**: Used for auth redirects to avoid adding entries to browser history
- **`router.push()`**: Reserved for user-initiated navigation

### Timing
- All auth-based redirects happen in `useEffect` after component mount
- Render functions only return appropriate loading states or null
- No router calls during render phase

### Loading States
- Show loading spinner while auth is initializing (`!isInitialized`)
- Show redirecting message while auth redirect is happening
- Clear visual feedback for user experience

## Testing Checklist

### ✅ Fixed Issues
- [ ] No more "setState during render" errors
- [ ] Login redirects work properly
- [ ] No infinite redirect loops
- [ ] Protected routes redirect to login when needed
- [ ] Auth pages redirect to threads when already logged in

### ✅ Expected Behavior
1. **Landing page (`/`)**: Shows landing page, no infinite spinner
2. **Login page (`/login`)**: 
   - Shows login form for unauthenticated users
   - Redirects to threads (or redirectTo param) for authenticated users
3. **Protected pages (`/threads`, `/thread/[id]`)**:
   - Shows content for authenticated users
   - Redirects to login for unauthenticated users
4. **No console errors**: No React warnings about setState during render

## Performance Impact
- ✅ Eliminated infinite re-render loops
- ✅ Reduced unnecessary router calls
- ✅ Better user experience with proper loading states
- ✅ Cleaner browser history (using replace instead of push)

## Future Considerations
- Consider implementing a global auth guard component
- Add retry logic for failed redirects
- Implement progressive loading states
- Add analytics for auth flow tracking