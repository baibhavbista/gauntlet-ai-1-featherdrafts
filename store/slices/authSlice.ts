import type { StateCreator } from 'zustand'
import type { AppStore, AuthSlice } from '@/types/store'
import { supabase } from '@/lib/supabase'
import { getUserCustomDictionary, addWordToUserDictionary, removeWordFromUserDictionary } from '@/lib/database'

export const createAuthSlice: StateCreator<AppStore, [], [], AuthSlice> = (set, get) => ({
  // State
  user: null,
  loading: true,
  error: null,
  isInitialized: false,
  customDictionary: [],
  isDictionaryLoaded: false,

  // Actions - real implementations
  initialize: async () => {
    try {
      console.log('[Auth] Starting initialization...')
      
      // Prevent multiple initializations
      const { isInitialized } = get()
      if (isInitialized) {
        console.log('[Auth] Already initialized, skipping')
        return
      }

      set({ loading: true, error: null })
      console.log('[Auth] Set loading state')

      // Get initial session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) {
        console.error('[Auth] Session error:', sessionError)
        set({ error: sessionError.message, user: null, loading: false, isInitialized: true })
        return
      }

      console.log('[Auth] Session retrieved:', session?.user?.email || 'No user')

      // Set initial user
      set({ user: session?.user ?? null, loading: false, isInitialized: true })
      
      // Load custom dictionary if user is authenticated
      if (session?.user) {
        await get().loadCustomDictionary()
      }
      
      console.log('[Auth] Initialization complete')

      // Listen for auth state changes
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('[Auth] State changed:', event, session?.user?.email || 'No user')
        
        set({ 
          user: session?.user ?? null, 
          loading: false,
          error: null // Clear any previous errors on auth state change
        })

        // Handle specific auth events
        if (event === 'SIGNED_OUT') {
          console.log('[Auth] User signed out')
          // Clear custom dictionary on sign out
          set({ customDictionary: [], isDictionaryLoaded: false })
        } else if (event === 'SIGNED_IN') {
          console.log('[Auth] User signed in')
          // Load custom dictionary on sign in
          await get().loadCustomDictionary()
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('[Auth] Token refreshed')
        }
      })

      // Store the subscription for cleanup (we'll handle this in the component)
      // Note: In a real app, you might want to store this subscription reference
      // for proper cleanup, but Zustand handles this differently

    } catch (error) {
      console.error('[Auth] Initialization error:', error)
      set({ 
        error: error instanceof Error ? error.message : 'Authentication initialization failed', 
        loading: false, 
        isInitialized: true 
      })
    }
  },

  loadCustomDictionary: async () => {
    try {
      const { user } = get()
      if (!user) {
        console.log('[Auth] No user, skipping dictionary load')
        return
      }

      console.log('[Auth] Loading custom dictionary...')
      const dictionary = await getUserCustomDictionary()
      
      set({ customDictionary: dictionary, isDictionaryLoaded: true })
      console.log('[Auth] Custom dictionary loaded:', dictionary.length, 'words')
    } catch (error) {
      console.error('[Auth] Error loading custom dictionary:', error)
      set({ customDictionary: [], isDictionaryLoaded: false })
    }
  },

  addWordToDictionary: async (word: string) => {
    try {
      const { user, customDictionary } = get()
      if (!user) {
        console.log('[Auth] No user, cannot add word to dictionary')
        return false
      }

      // Normalize word
      const normalizedWord = word.toLowerCase().trim()
      
      // Check if word already exists
      if (customDictionary.includes(normalizedWord)) {
        console.log('[Auth] Word already in dictionary:', normalizedWord)
        return true
      }

      // Optimistic update
      const updatedDictionary = [...customDictionary, normalizedWord]
      set({ customDictionary: updatedDictionary })

      // Sync to server
      const success = await addWordToUserDictionary(word)
      
      if (!success) {
        // Revert optimistic update on failure
        set({ customDictionary })
        console.error('[Auth] Failed to add word to dictionary:', word)
        return false
      }

      console.log('[Auth] Word added to dictionary:', normalizedWord)
      return true
    } catch (error) {
      console.error('[Auth] Error adding word to dictionary:', error)
      return false
    }
  },

  removeWordFromDictionary: async (word: string) => {
    try {
      const { user, customDictionary } = get()
      if (!user) {
        console.log('[Auth] No user, cannot remove word from dictionary')
        return false
      }

      // Normalize word
      const normalizedWord = word.toLowerCase().trim()
      
      // Check if word exists
      if (!customDictionary.includes(normalizedWord)) {
        console.log('[Auth] Word not in dictionary:', normalizedWord)
        return true
      }

      // Optimistic update
      const updatedDictionary = customDictionary.filter(w => w !== normalizedWord)
      set({ customDictionary: updatedDictionary })

      // Sync to server
      const success = await removeWordFromUserDictionary(word)
      
      if (!success) {
        // Revert optimistic update on failure
        set({ customDictionary })
        console.error('[Auth] Failed to remove word from dictionary:', word)
        return false
      }

      console.log('[Auth] Word removed from dictionary:', normalizedWord)
      return true
    } catch (error) {
      console.error('[Auth] Error removing word from dictionary:', error)
      return false
    }
  },

  syncDictionaryToServer: async () => {
    try {
      const { user } = get()
      if (!user) {
        console.log('[Auth] No user, cannot sync dictionary')
        return
      }

      // Reload dictionary from server to ensure consistency
      await get().loadCustomDictionary()
      console.log('[Auth] Dictionary synced from server')
    } catch (error) {
      console.error('[Auth] Error syncing dictionary:', error)
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
      set({ user: null, loading: false, error: null, customDictionary: [], isDictionaryLoaded: false })

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

  setCustomDictionary: (dictionary) => {
    set({ customDictionary: dictionary })
  },

  setDictionaryLoaded: (loaded) => {
    set({ isDictionaryLoaded: loaded })
  },
}) 