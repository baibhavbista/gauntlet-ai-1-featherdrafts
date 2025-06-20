import { useRouter } from 'next/navigation'
import { useCallback } from 'react'

/**
 * Custom hook for consistent navigation patterns throughout the app
 * Provides type-safe navigation helpers using Next.js router
 */
export function useNavigation() {
  const router = useRouter()

  // Navigation helpers
  const navigateToThreads = useCallback(() => {
    router.push('/threads')
  }, [router])

  const navigateToThread = useCallback((threadId: string) => {
    router.push(`/thread/${threadId}`)
  }, [router])

  const navigateToLogin = useCallback((redirectTo?: string) => {
    const url = redirectTo ? `/login?redirectTo=${encodeURIComponent(redirectTo)}` : '/login'
    router.push(url)
  }, [router])

  const navigateToSignup = useCallback((redirectTo?: string) => {
    const url = redirectTo ? `/signup?redirectTo=${encodeURIComponent(redirectTo)}` : '/signup'
    router.push(url)
  }, [router])

  const navigateToLanding = useCallback(() => {
    router.push('/')
  }, [router])

  // Navigation with history
  const navigateBack = useCallback(() => {
    router.back()
  }, [router])

  const navigateForward = useCallback(() => {
    router.forward()
  }, [router])

  // Utility functions
  const refresh = useCallback(() => {
    router.refresh()
  }, [router])

  const replace = useCallback((url: string) => {
    router.replace(url)
  }, [router])

  return {
    // Basic navigation
    navigateToThreads,
    navigateToThread,
    navigateToLogin,
    navigateToSignup,
    navigateToLanding,
    
    // History navigation
    navigateBack,
    navigateForward,
    
    // Utility functions
    refresh,
    replace,
    
    // Direct router access for advanced use cases
    router,
  }
} 