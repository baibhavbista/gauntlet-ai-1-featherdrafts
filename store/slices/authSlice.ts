import type { StateCreator } from 'zustand'
import type { AppStore, AuthSlice } from '@/types/store'
import { supabase } from '@/lib/supabase'

export const createAuthSlice: StateCreator<AppStore, [], [], AuthSlice> = (set, get) => ({
  // State
  user: null,
  loading: true,
  error: null,
  isInitialized: false,

  // Actions - real implementations
  initialize: async () => {
    try {
      // Prevent multiple initializations
      const { isInitialized } = get()
      if (isInitialized) {
        return
      }

      set({ loading: true, error: null })

      // Get initial session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) {
        console.error('Session error:', sessionError)
        set({ error: sessionError.message, user: null, loading: false, isInitialized: true })
        return
      }

      // Set initial user
      set({ user: session?.user ?? null, loading: false, isInitialized: true })

      // Listen for auth state changes
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        
        set({ 
          user: session?.user ?? null, 
          loading: false,
          error: null // Clear any previous errors on auth state change
        })

        // Handle specific auth events
        if (event === 'SIGNED_OUT') {
          console.log('User signed out')
        } else if (event === 'SIGNED_IN') {
          console.log('User signed in')
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed')
        }
      })

      // Store the subscription for cleanup (we'll handle this in the component)
      // Note: In a real app, you might want to store this subscription reference
      // for proper cleanup, but Zustand handles this differently

    } catch (error) {
      console.error('Auth initialization error:', error)
      set({ 
        error: error instanceof Error ? error.message : 'Authentication initialization failed', 
        loading: false, 
        isInitialized: true 
      })
    }
  },

  signIn: async (email: string, password: string) => {
    try {
      set({ loading: true, error: null })

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        set({ error: error.message, loading: false })
        throw error
      }

      // User state will be updated via the auth state change listener
      set({ loading: false, error: null })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed'
      set({ error: errorMessage, loading: false })
      throw error
    }
  },

  signUp: async (email: string, password: string, fullName?: string) => {
    try {
      set({ loading: true, error: null })

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (error) {
        set({ error: error.message, loading: false })
        throw error
      }

      // User state will be updated via the auth state change listener
      set({ loading: false, error: null })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign up failed'
      set({ error: errorMessage, loading: false })
      throw error
    }
  },

  signInWithOAuth: async (provider: 'google') => {
    try {
      set({ loading: true, error: null })

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        set({ error: error.message, loading: false })
        throw error
      }

      // OAuth will redirect, so we don't set loading to false here
      // The redirect will handle the auth state change

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'OAuth sign in failed'
      set({ error: errorMessage, loading: false })
      throw error
    }
  },

  signOut: async () => {
    try {
      set({ loading: true, error: null })

      const { error } = await supabase.auth.signOut()

      if (error) {
        set({ error: error.message, loading: false })
        throw error
      }

      // User state will be updated via the auth state change listener
      set({ user: null, loading: false, error: null })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign out failed'
      set({ error: errorMessage, loading: false })
      throw error
    }
  },

  clearError: () => {
    set({ error: null })
  },

  // Internal methods - real implementations
  setUser: (user) => {
    set({ user })
  },

  setLoading: (loading) => {
    set({ loading })
  },

  setError: (error) => {
    set({ error })
  },
}) 