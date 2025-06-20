import { create } from 'zustand'
import { persist, createJSONStorage, devtools } from 'zustand/middleware'
import type { AppStore } from '@/types/store'
import { createAuthSlice } from './slices/authSlice'
import { createThreadsSlice } from './slices/threadsSlice'
import { createEditorSlice } from './slices/editorSlice'
import { createNavigationSlice } from './slices/navigationSlice'
import { createUISlice } from './slices/uiSlice'

// Create the main store with persistence and devtools
export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      (...args) => ({
        // Combine all slices
        ...createAuthSlice(...args),
        ...createThreadsSlice(...args),
        ...createEditorSlice(...args),
        ...createNavigationSlice(...args),
        ...createUISlice(...args),
      }),
      {
        name: 'featherdrafts-store',
        storage: createJSONStorage(() => localStorage),
        
        // Define what parts of the state to persist
        partialize: (state) => ({
          // Navigation persistence (simplified)
          navigationHistory: state.navigationHistory,
          
          // Editor preferences
          isAutoSaveEnabled: state.isAutoSaveEnabled,
          dictionaryStatus: state.dictionaryStatus,
          
          // Don't persist auth state - let it initialize fresh each time:
          // - user (will be loaded from Supabase session)
          // - isInitialized (should start false)
          // - loading states
          // - error states
          // - temporary UI states
          // - current thread content (will be loaded fresh)
          // - suggestions (will be regenerated)
          // - view state (now handled by URL)
          
          // Explicitly exclude all auth-related state to prevent persistence conflicts
          // user: undefined,
          // loading: undefined,
          // error: undefined,
          // isInitialized: undefined,
        }),
        
        // Skip merge function for now to avoid TypeScript complexity
        // merge: will be implemented later
      }
    ),
    {
      name: 'FeatherDrafts Store',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
)

// Utility function to reset the store to initial state
export const resetStore = () => {
  useAppStore.setState((state) => ({
    ...state,
    // Reset auth to initial values
    user: null,
    loading: true, // Start with loading true for proper initialization
    error: null,
    isInitialized: false,
    customDictionary: [],
    isDictionaryLoaded: false,
    threads: [],
    currentThread: null,
    saving: false,
    searchQuery: "",
    activeFilter: "draft",
    lastSaved: null,
    segments: [
      {
        id: "temp-segment-1",
        content: "",
        charCount: 0,
        index: 0,
      },
    ],
    activeSegmentId: "temp-segment-1",
    suggestions: [],
    isSpellCheckLoading: false,
    isGrammarCheckLoading: false,
    isSaving: false,
    isAutoSaveEnabled: true,
    dictionaryStatus: {
      isInitialized: false,
      isLoading: false,
    },
    isEditingTitle: false,
    selectedSuggestionId: null,
    navigationHistory: [],
    isCreateThreadDialogOpen: false,
    isDeleteThreadDialogOpen: false,
    isSettingsDialogOpen: false,
    isGlobalLoading: false,
    notifications: [],
    globalError: null,
  }))
}

// Utility function to clear persisted data
export const clearPersistedStore = () => {
  localStorage.removeItem('featherdrafts-store')
  resetStore()
}

// Store initialization function
export const initializeStore = async () => {
  const store = useAppStore.getState()
  
  // Initialize auth if not already done
  if (!store.isInitialized) {
    await store.initialize()
  }
  
  // Initialize dictionary
  if (!store.dictionaryStatus.isInitialized && !store.dictionaryStatus.isLoading) {
    await store.initializeDictionary()
  }
}

// Auto-initialization is now handled in the component to prevent infinite loops
// Store initialization moved to app/page.tsx useEffect

// Selector hooks - use direct store access to avoid infinite loops
export const useAuth = () => {
  // State selectors
  const user = useAppStore(state => state.user)
  const loading = useAppStore(state => state.loading)
  const error = useAppStore(state => state.error)
  const isInitialized = useAppStore(state => state.isInitialized)
  const customDictionary = useAppStore(state => state.customDictionary)
  const isDictionaryLoaded = useAppStore(state => state.isDictionaryLoaded)
  
  // Action selectors with stable references
  const initialize = useAppStore(state => state.initialize)
  const signIn = useAppStore(state => state.signIn)
  const signUp = useAppStore(state => state.signUp)
  const signInWithOAuth = useAppStore(state => state.signInWithOAuth)
  const signOut = useAppStore(state => state.signOut)
  const clearError = useAppStore(state => state.clearError)
  const loadCustomDictionary = useAppStore(state => state.loadCustomDictionary)
  const addWordToDictionary = useAppStore(state => state.addWordToDictionary)
  const removeWordFromDictionary = useAppStore(state => state.removeWordFromDictionary)
  const syncDictionaryToServer = useAppStore(state => state.syncDictionaryToServer)
  
  return {
    user,
    loading,
    error,
    isInitialized,
    customDictionary,
    isDictionaryLoaded,
    initialize,
    signIn,
    signUp,
    signInWithOAuth,
    signOut,
    clearError,
    loadCustomDictionary,
    addWordToDictionary,
    removeWordFromDictionary,
    syncDictionaryToServer,
  }
}

export const useThreads = () => ({
  // State
  threads: useAppStore(state => state.threads),
  currentThread: useAppStore(state => state.currentThread),
  isLoading: useAppStore(state => state.isLoading),
  isCreating: useAppStore(state => state.isCreating),
  isUpdating: useAppStore(state => state.isUpdating),
  isDeleting: useAppStore(state => state.isDeleting),
  error: useAppStore(state => state.error),
  lastSaved: useAppStore(state => state.lastSaved),
  searchQuery: useAppStore(state => state.searchQuery),
  statusFilter: useAppStore(state => state.statusFilter),
  sortBy: useAppStore(state => state.sortBy),
  sortOrder: useAppStore(state => state.sortOrder),
  
  // Actions - access directly from store
  loadThreads: useAppStore(state => state.loadThreads),
  createThread: useAppStore(state => state.createThread),
  loadThread: useAppStore(state => state.loadThread),
  updateThread: useAppStore(state => state.updateThread),
  deleteThread: useAppStore(state => state.deleteThread),
  
  // Segment operations
  createSegment: useAppStore(state => state.createSegment),
  updateSegment: useAppStore(state => state.updateSegment),
  deleteSegment: useAppStore(state => state.deleteSegment),
  reorderSegments: useAppStore(state => state.reorderSegments),
  
  // UI state
  setSearchQuery: useAppStore(state => state.setSearchQuery),
  setStatusFilter: useAppStore(state => state.setStatusFilter),
  setSortBy: useAppStore(state => state.setSortBy),
  setSortOrder: useAppStore(state => state.setSortOrder),
  clearError: useAppStore(state => state.clearError),
  clearCurrentThread: useAppStore(state => state.clearCurrentThread),
  
  // Utility methods
  optimisticUpdateThread: useAppStore(state => state.optimisticUpdateThread),
  getFilteredThreads: useAppStore(state => state.getFilteredThreads),
})

export const useNavigationStore = () => ({
  // State (simplified)
  navigationHistory: useAppStore(state => state.navigationHistory),
  
  // Navigation helpers (recommend using Next.js router directly in components)
  navigateToThreads: useAppStore(state => state.navigateToThreads),
  navigateToThread: useAppStore(state => state.navigateToThread),
  navigateToLogin: useAppStore(state => state.navigateToLogin),
  navigateToLanding: useAppStore(state => state.navigateToLanding),
  
  // Navigation utilities
  addToHistory: useAppStore(state => state.addToHistory),
  clearHistory: useAppStore(state => state.clearHistory),
  getHistory: useAppStore(state => state.getHistory),
  
  // Thread-specific helpers
  selectThread: useAppStore(state => state.selectThread),
  createNewThread: useAppStore(state => state.createNewThread),
  returnToThreads: useAppStore(state => state.returnToThreads),
  
  // Deprecated methods (kept for backward compatibility - will log warnings)
  navigateTo: useAppStore(state => state.navigateTo),
  navigateToEditor: useAppStore(state => state.navigateToEditor),
  navigateToAuth: useAppStore(state => state.navigateToAuth),
  navigateBack: useAppStore(state => state.navigateBack),
  getCurrentRoute: useAppStore(state => state.getCurrentRoute),
  canGoBack: useAppStore(state => state.canGoBack),
  handleAuthenticatedNavigation: useAppStore(state => state.handleAuthenticatedNavigation),
  smartNavigateTo: useAppStore(state => state.smartNavigateTo),
})

export const useUI = () => ({
  // State
  notifications: useAppStore(state => state.notifications),
  globalError: useAppStore(state => state.globalError),
  isGlobalLoading: useAppStore(state => state.isGlobalLoading),
  isCreateThreadDialogOpen: useAppStore(state => state.isCreateThreadDialogOpen),
  isDeleteThreadDialogOpen: useAppStore(state => state.isDeleteThreadDialogOpen),
  isSettingsDialogOpen: useAppStore(state => state.isSettingsDialogOpen),
  
  // Actions
  addNotification: useAppStore(state => state.addNotification),
  removeNotification: useAppStore(state => state.removeNotification),
  clearNotifications: useAppStore(state => state.clearNotifications),
  setGlobalError: useAppStore(state => state.setGlobalError),
  clearGlobalError: useAppStore(state => state.clearGlobalError),
  setGlobalLoading: useAppStore(state => state.setGlobalLoading),
  openCreateThreadDialog: useAppStore(state => state.openCreateThreadDialog),
  closeCreateThreadDialog: useAppStore(state => state.closeCreateThreadDialog),
  openDeleteThreadDialog: useAppStore(state => state.openDeleteThreadDialog),
  closeDeleteThreadDialog: useAppStore(state => state.closeDeleteThreadDialog),
  openSettingsDialog: useAppStore(state => state.openSettingsDialog),
  closeSettingsDialog: useAppStore(state => state.closeSettingsDialog),
  
  // Utility methods
  showSuccessNotification: useAppStore(state => state.showSuccessNotification),
  showErrorNotification: useAppStore(state => state.showErrorNotification),
  showWarningNotification: useAppStore(state => state.showWarningNotification),
  showInfoNotification: useAppStore(state => state.showInfoNotification),
  withGlobalLoading: useAppStore(state => state.withGlobalLoading),
  closeAllModals: useAppStore(state => state.closeAllModals),
  hasOpenModals: useAppStore(state => state.hasOpenModals),
})

export const useEditor = () => ({
  // State
  segments: useAppStore(state => state.segments),
  activeSegmentId: useAppStore(state => state.activeSegmentId),
  suggestions: useAppStore(state => state.suggestions),
  isSpellCheckLoading: useAppStore(state => state.isSpellCheckLoading),
  isGrammarCheckLoading: useAppStore(state => state.isGrammarCheckLoading),
  isSaving: useAppStore(state => state.isSaving),
  isAutoSaveEnabled: useAppStore(state => state.isAutoSaveEnabled),
  dictionaryStatus: useAppStore(state => state.dictionaryStatus),
  isEditingTitle: useAppStore(state => state.isEditingTitle),
  selectedSuggestionId: useAppStore(state => state.selectedSuggestionId),
  
  // Actions
  updateSegmentContent: useAppStore(state => state.updateSegmentContent),
  addSegment: useAppStore(state => state.addSegment),
  removeSegment: useAppStore(state => state.removeSegment),
  reorderEditorSegments: useAppStore(state => state.reorderEditorSegments),
  setActiveSegment: useAppStore(state => state.setActiveSegment),
  runSpellCheck: useAppStore(state => state.runSpellCheck),
  runGrammarCheck: useAppStore(state => state.runGrammarCheck),
  runAllChecks: useAppStore(state => state.runAllChecks),
  runSingleSegmentCheck: useAppStore(state => state.runSingleSegmentCheck),
  applySuggestion: useAppStore(state => state.applySuggestion),
  applySuggestions: useAppStore(state => state.applySuggestions),
  dismissSuggestion: useAppStore(state => state.dismissSuggestion),
  fixAllSuggestions: useAppStore(state => state.fixAllSuggestions),
  clearSuggestions: useAppStore(state => state.clearSuggestions),
  saveImmediately: useAppStore(state => state.saveImmediately),
  enableAutoSave: useAppStore(state => state.enableAutoSave),
  disableAutoSave: useAppStore(state => state.disableAutoSave),
  initializeDictionary: useAppStore(state => state.initializeDictionary),
  setEditingTitle: useAppStore(state => state.setEditingTitle),
  selectSuggestion: useAppStore(state => state.selectSuggestion),
  resetEditor: useAppStore(state => state.resetEditor),
  initializeEditor: useAppStore(state => state.initializeEditor),
  debouncedSaveAndCheck: useAppStore(state => state.debouncedSaveAndCheck),
  debouncedSaveAll: useAppStore(state => state.debouncedSaveAll),
})

// Utility functions for development
export const useStoreDevtools = () => {
  if (process.env.NODE_ENV === 'development') {
    return {
      getState: useAppStore.getState,
      setState: useAppStore.setState,
      subscribe: useAppStore.subscribe,
    }
  }
  return null
}

// Performance monitoring (development only) - disabled to prevent infinite loops
// if (process.env.NODE_ENV === 'development') {
//   let lastStateUpdate = Date.now()
//   useAppStore.subscribe((state, prevState) => {
//     const now = Date.now()
//     const timeSinceLastUpdate = now - lastStateUpdate
    
//     if (timeSinceLastUpdate < 16) { // Less than 16ms between updates
//       console.warn('⚠️ High frequency state updates detected. Consider debouncing.', {
//         timeSinceLastUpdate,
//         timestamp: now
//       })
//     }
    
//     lastStateUpdate = now
//   })
// }

// Export the main store for direct access when needed
export { useAppStore as useStore }
export default useAppStore 