"use client"

import type { User } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  isInitialized: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName?: string) => Promise<void>
  signInWithOAuth: (provider: 'google') => Promise<void>
  signOut: () => Promise<void>
  clearError: () => void
}

// Note: This context provides client-side auth state management
// Server-side auth checks are handled in page components via SSR

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthContextProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        console.log('[Auth] Initial session check:', { 
          hasSession: !!session, 
          hasUser: !!session?.user,
          userEmail: session?.user?.email,
          error: sessionError?.message 
        })
        
        if (sessionError) {
          console.error('[Auth] Session error:', sessionError)
          // Only set error for non-session-missing errors
          if (sessionError.message !== 'Auth session missing!') {
            setError(sessionError.message)
          }
        }
        
        setUser(session?.user ?? null)
      } catch (err) {
        console.error('[Auth] Initialization error:', err)
        // Don't set error for initialization - user might still be authenticating
      } finally {
        setLoading(false)
        setIsInitialized(true)
      }
    }

    getInitialSession()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth] State changed:', event, session?.user?.email || 'No user', 'current error:', error)
        
        setUser(session?.user ?? null)
        setLoading(false)
        
        // Only clear errors on successful auth events with a valid session
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
          console.log('[Auth] Clearing error due to successful auth event')
          setError(null)
        }

        // Handle specific auth events
        if (event === 'SIGNED_IN') {
          console.log('[Auth] User signed in')
        } else if (event === 'SIGNED_OUT') {
          console.log('[Auth] User signed out')
          setError(null) // Clear errors on sign out
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('[Auth] Token refreshed')
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, []) // Empty dependency array since supabase client is stable

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      setError(null)

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.log('[Auth] Sign in error:', error.message)
        // Make error message more user-friendly
        const userFriendlyMessage = error.message === 'Invalid login credentials' 
          ? 'Invalid email or password. Please check your credentials and try again.'
          : error.message
        console.log('[Auth] Setting error message:', userFriendlyMessage)
        setError(userFriendlyMessage)
        throw error
      }

      // Router refresh will be handled by middleware and auth state change
      router.refresh()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed'
      // Make error message more user-friendly
      const userFriendlyMessage = errorMessage === 'Invalid login credentials' 
        ? 'Invalid email or password. Please check your credentials and try again.'
        : errorMessage
      setError(userFriendlyMessage)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      setLoading(true)
      setError(null)

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: fullName,
          },
        },
      })

      if (error) {
        setError(error.message)
        throw error
      }

      // Don't refresh router for signup - user needs to confirm email first
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign up failed'
      setError(errorMessage)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signInWithOAuth = async (provider: 'google') => {
    try {
      setLoading(true)
      setError(null)

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setError(error.message)
        throw error
      }

      // OAuth will redirect, so we don't set loading to false here
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'OAuth sign in failed'
      setError(errorMessage)
      setLoading(false)
      throw error
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      setError(null)

      const { error } = await supabase.auth.signOut()

      if (error) {
        setError(error.message)
        throw error
      }

      // Redirect to home after sign out
      router.push('/')
      router.refresh()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign out failed'
      setError(errorMessage)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const value = {
    user,
    loading,
    error,
    isInitialized,
    signIn,
    signUp,
    signInWithOAuth,
    signOut,
    clearError,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthContextProvider')
  }
  return context
} 