import type { StateCreator } from 'zustand'
import type { AppStore, NavigationSlice } from '@/types/store'

export const createNavigationSlice: StateCreator<AppStore, [], [], NavigationSlice> = (set, get) => ({
  // ====================
  // STATE (Simplified)
  // ====================
  navigationHistory: [],

  // ====================
  // NAVIGATION HELPERS
  // ====================
  
  // These are client-side navigation helpers
  // They don't manage state but provide consistent navigation patterns
  // The actual navigation state is managed by Next.js router
  
  navigateToThreads: () => {
    // This is a helper that can be called from components
    // The actual navigation is handled by Next.js router in components
    console.log('Navigate to threads - use router.push("/threads") in component')
  },

  navigateToThread: (threadId: string) => {
    console.log(`Navigate to thread ${threadId} - use router.push("/thread/${threadId}") in component`)
  },

  navigateToLogin: () => {
    console.log('Navigate to login - use router.push("/login") in component')
  },

  navigateToLanding: () => {
    console.log('Navigate to landing - use router.push("/") in component')
  },

  // ====================
  // NAVIGATION UTILITIES
  // ====================

  addToHistory: (entry: { path: string; timestamp: number }) => {
    const { navigationHistory } = get()
    const newHistory = [
      ...navigationHistory,
      entry
    ].slice(-10) // Keep only last 10 entries

    set({ navigationHistory: newHistory })
  },

  clearHistory: () => {
    set({ navigationHistory: [] })
  },

  getHistory: () => {
    return get().navigationHistory
  },

  // ====================
  // THREAD-SPECIFIC HELPERS
  // ====================

  // These provide consistent patterns for thread navigation
  selectThread: (threadId: string) => {
    console.log(`Select thread ${threadId} - use router.push("/thread/${threadId}") in component`)
  },

  createNewThread: () => {
    console.log('Create new thread - handle in ThreadList component with router navigation')
  },

  returnToThreads: () => {
    console.log('Return to threads - use router.push("/threads") in component')
  },

  // ====================
  // LEGACY METHODS (Deprecated)
  // ====================
  
  // These methods are kept for backward compatibility but will be removed
  // They now just log warnings and don't perform any navigation
  
  navigateTo: (view: string, threadId?: string) => {
    console.warn('navigateTo is deprecated. Use Next.js router directly in components.')
    console.warn(`Attempted navigation to: ${view}${threadId ? ` with threadId: ${threadId}` : ''}`)
  },

  navigateToEditor: (threadId?: string) => {
    console.warn('navigateToEditor is deprecated. Use router.push("/thread/[id]") in components.')
    if (threadId) {
      console.warn(`Use: router.push("/thread/${threadId}")`)
    }
  },

  navigateToAuth: () => {
    console.warn('navigateToAuth is deprecated. Use router.push("/login") in components.')
  },

  navigateBack: () => {
    console.warn('navigateBack is deprecated. Use router.back() or router.push() in components.')
  },

  // ====================
  // REMOVED STATE GETTERS
  // ====================
  
  getCurrentRoute: () => {
    console.warn('getCurrentRoute is deprecated. Use useRouter() and useParams() hooks in components.')
    return { view: 'unknown', threadId: null }
  },

  canGoBack: () => {
    console.warn('canGoBack is deprecated. Use window.history or router state in components.')
    return false
  },

  handleAuthenticatedNavigation: () => {
    console.warn('handleAuthenticatedNavigation is deprecated. Auth checks are now handled by middleware.')
  },

  smartNavigateTo: () => {
    console.warn('smartNavigateTo is deprecated. Auth checks are now handled by middleware.')
  },
})