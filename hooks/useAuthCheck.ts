import { useAuthContext } from "@/components/auth/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

// DEPRECATED: This hook is deprecated in favor of server-side auth checks
// Use SSR pattern in page components: await createClient().auth.getUser()
// For client components that need auth state, use useAuthContext() directly

interface UseAuthCheckOptions {
  redirectTo?: string
  requireAuth?: boolean
}

export function useAuthCheck(options: UseAuthCheckOptions = {}) {
  console.warn('useAuthCheck is deprecated. Use server-side auth checks or useAuthContext() directly.')
  
  const { user, isInitialized } = useAuthContext()
  const router = useRouter()
  const { redirectTo = '/login', requireAuth = true } = options

  useEffect(() => {
    if (isInitialized && requireAuth && !user) {
      router.push(redirectTo)
    }
  }, [isInitialized, user, requireAuth, redirectTo, router])

  return {
    user,
    isInitialized,
    isLoading: !isInitialized,
    isAuthenticated: !!user,
    shouldRender: isInitialized && (requireAuth ? !!user : true)
  }
} 