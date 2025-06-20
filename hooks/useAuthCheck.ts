import { useAuth } from "@/store"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface UseAuthCheckOptions {
  redirectTo?: string
  requireAuth?: boolean
}

export function useAuthCheck(options: UseAuthCheckOptions = {}) {
  const { user, isInitialized } = useAuth()
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