import { useCallback } from 'react'
import { useRouter } from 'next/navigation'

export interface AppError extends Error {
  code?: string
  statusCode?: number
  digest?: string
}

export function useErrorHandler() {
  const router = useRouter()

  const handleError = useCallback((error: AppError, context?: string) => {
    console.error(`Error in ${context || 'app'}:`, error)

    // Log error details for debugging
    if (process.env.NODE_ENV === 'development') {
      console.group('Error Details')
      console.log('Message:', error.message)
      console.log('Code:', error.code)
      console.log('Status:', error.statusCode)
      console.log('Context:', context)
      console.log('Stack:', error.stack)
      console.groupEnd()
    }

    // Handle specific error types
    switch (error.statusCode || error.code) {
      case 404:
      case 'NOT_FOUND':
        // Let Next.js handle 404s with our custom page
        throw error
        
      case 401:
      case 'UNAUTHORIZED':
        // Redirect to login for auth errors
        router.push('/login')
        break
        
      case 403:
      case 'FORBIDDEN':
        // Throw error to be caught by error boundary
        throw new Error('Access denied - you don\'t have permission to access this resource')
        
      case 500:
      case 'INTERNAL_ERROR':
        // Generic server error
        throw new Error('An internal error occurred. Please try again later.')
        
      default:
        // Re-throw other errors to be caught by error boundary
        throw error
    }
  }, [router])

  const handleAsyncError = useCallback(async <T>(
    asyncOperation: () => Promise<T>,
    context?: string,
    fallback?: T
  ): Promise<T | undefined> => {
    try {
      return await asyncOperation()
    } catch (error) {
      handleError(error as AppError, context)
      return fallback
    }
  }, [handleError])

  const createErrorThrower = useCallback((error: AppError, context?: string) => {
    return () => handleError(error, context)
  }, [handleError])

  return {
    handleError,
    handleAsyncError,
    createErrorThrower,
  }
} 