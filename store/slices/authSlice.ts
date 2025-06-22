import type { StateCreator } from 'zustand'
import type { AppStore, AuthSlice } from '@/types/store'
import { getUserCustomDictionary, addWordToUserDictionary, removeWordFromUserDictionary } from '@/lib/database'

// SIMPLIFIED AUTH SLICE - Most auth logic moved to SSR + AuthContext
// This slice now only handles:
// 1. Custom dictionary management (user-specific data)
// 2. Backward compatibility for components not yet migrated

export const createAuthSlice: StateCreator<AppStore, [], [], AuthSlice> = (set, get) => ({
  // DEPRECATED STATE - kept for backward compatibility
  user: null,
  loading: false, // Always false since SSR handles auth
  error: null,
  isInitialized: true, // Always true since SSR handles auth
  
  // ACTIVE STATE - still used for dictionary management
  customDictionary: [],
  isDictionaryLoaded: false,

  // DEPRECATED ACTIONS - kept for backward compatibility but simplified
  initialize: async () => {
    console.warn('[AuthSlice] initialize() is deprecated. Auth is now handled by SSR + AuthContext.')
    set({ loading: false, isInitialized: true })
  },

  signIn: async (email: string, password: string) => {
    console.warn('[AuthSlice] signIn() is deprecated. Use AuthContext instead.')
    throw new Error('Auth actions moved to AuthContext')
  },

  signUp: async (email: string, password: string, fullName?: string) => {
    console.warn('[AuthSlice] signUp() is deprecated. Use AuthContext instead.')
    throw new Error('Auth actions moved to AuthContext')
  },

  signInWithOAuth: async (provider: 'google') => {
    console.warn('[AuthSlice] signInWithOAuth() is deprecated. Use AuthContext instead.')
    throw new Error('Auth actions moved to AuthContext')
  },

  signOut: async () => {
    console.warn('[AuthSlice] signOut() is deprecated. Use AuthContext instead.')
    throw new Error('Auth actions moved to AuthContext')
  },

  clearError: () => {
    console.warn('[AuthSlice] clearError() is deprecated. Use AuthContext instead.')
    set({ error: null })
  },

  // ACTIVE DICTIONARY ACTIONS - still needed for user-specific data
  loadCustomDictionary: async () => {
    try {
      console.log('[AuthSlice] Loading custom dictionary...')
      const dictionary = await getUserCustomDictionary()
      
      set({ customDictionary: dictionary, isDictionaryLoaded: true })
      console.log('[AuthSlice] Custom dictionary loaded:', dictionary.length, 'words')
    } catch (error) {
      console.error('[AuthSlice] Error loading custom dictionary:', error)
      set({ customDictionary: [], isDictionaryLoaded: false })
    }
  },

  addWordToDictionary: async (word: string) => {
    try {
      const { customDictionary } = get()

      // Normalize word
      const normalizedWord = word.toLowerCase().trim()
      
      // Check if word already exists
      if (customDictionary.includes(normalizedWord)) {
        console.log('[AuthSlice] Word already in dictionary:', normalizedWord)
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
        console.error('[AuthSlice] Failed to add word to dictionary:', word)
        return false
      }

      console.log('[AuthSlice] Word added to dictionary:', normalizedWord)
      return true
    } catch (error) {
      console.error('[AuthSlice] Error adding word to dictionary:', error)
      return false
    }
  },

  removeWordFromDictionary: async (word: string) => {
    try {
      const { customDictionary } = get()

      // Normalize word
      const normalizedWord = word.toLowerCase().trim()
      
      // Check if word exists
      if (!customDictionary.includes(normalizedWord)) {
        console.log('[AuthSlice] Word not in dictionary:', normalizedWord)
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
        console.error('[AuthSlice] Failed to remove word from dictionary:', word)
        return false
      }

      console.log('[AuthSlice] Word removed from dictionary:', normalizedWord)
      return true
    } catch (error) {
      console.error('[AuthSlice] Error removing word from dictionary:', error)
      return false
    }
  },

  syncDictionaryToServer: async () => {
    try {
      // Reload dictionary from server to ensure consistency
      await get().loadCustomDictionary()
      console.log('[AuthSlice] Dictionary synced from server')
    } catch (error) {
      console.error('[AuthSlice] Error syncing dictionary:', error)
    }
  },

  // DEPRECATED INTERNAL METHODS - kept for backward compatibility
  setUser: (user) => {
    console.warn('[AuthSlice] setUser() is deprecated. Auth state managed by AuthContext.')
    set({ user })
  },

  setLoading: (loading) => {
    console.warn('[AuthSlice] setLoading() is deprecated. Auth state managed by AuthContext.')
    set({ loading })
  },

  setError: (error) => {
    console.warn('[AuthSlice] setError() is deprecated. Auth state managed by AuthContext.')
    set({ error })
  },

  setCustomDictionary: (dictionary) => {
    set({ customDictionary: dictionary })
  },

  setDictionaryLoaded: (loaded) => {
    set({ isDictionaryLoaded: loaded })
  },
}) 