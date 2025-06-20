import type { StateCreator } from 'zustand'
import type { AppStore, NavigationSlice } from '@/types/store'

export const createNavigationSlice: StateCreator<AppStore, [], [], NavigationSlice> = (set, get) => ({
  // ====================
  // STATE
  // ====================
  currentView: 'landing',
  currentThreadId: null,
  previousView: null,
  navigationHistory: [],

  // ====================
  // NAVIGATION ACTIONS
  // ====================

  navigateTo: (view: "landing" | "threads" | "editor" | "auth", threadId?: string) => {
    const { currentView, currentThreadId, navigationHistory } = get()
    
    // Add current state to history
    const newHistory = [
      ...navigationHistory,
      { view: currentView, threadId: currentThreadId, timestamp: Date.now() }
    ].slice(-10) // Keep only last 10 entries

    set({
      previousView: currentView,
      currentView: view,
      currentThreadId: threadId || null,
      navigationHistory: newHistory,
    })
  },

  navigateToThreads: () => {
    get().navigateTo('threads')
  },

  navigateToEditor: (threadId?: string) => {
    get().navigateTo('editor', threadId)
  },

  navigateToAuth: () => {
    get().navigateTo('auth')
  },

  navigateToLanding: () => {
    get().navigateTo('landing')
  },

  navigateBack: () => {
    const { previousView, navigationHistory } = get()
    
    if (navigationHistory.length > 0) {
      const lastEntry = navigationHistory[navigationHistory.length - 1]
      set({
        currentView: lastEntry.view,
        currentThreadId: lastEntry.threadId,
        previousView: null,
        navigationHistory: navigationHistory.slice(0, -1),
      })
    } else if (previousView) {
      set({
        currentView: previousView,
        currentThreadId: null,
        previousView: null,
      })
    } else {
      // Default fallback
      get().navigateToLanding()
    }
  },

  // ====================
  // THREAD-SPECIFIC NAVIGATION
  // ====================

  selectThread: (threadId: string) => {
    get().navigateToEditor(threadId)
  },

  createNewThread: () => {
    get().navigateToEditor()
  },

  returnToThreads: () => {
    get().navigateToThreads()
  },

  // ====================
  // UTILITY METHODS
  // ====================

  getCurrentRoute: () => {
    const { currentView, currentThreadId } = get()
    return {
      view: currentView,
      threadId: currentThreadId,
    }
  },

  canGoBack: () => {
    const { previousView, navigationHistory } = get()
    return previousView !== null || navigationHistory.length > 0
  },

  clearHistory: () => {
    set({
      navigationHistory: [],
      previousView: null,
    })
  },

  // ====================
  // AUTH-AWARE NAVIGATION
  // ====================

  handleAuthenticatedNavigation: (targetView: "landing" | "threads" | "editor" | "auth") => {
    const { user } = get()
    
    if (!user && (targetView === 'threads' || targetView === 'editor')) {
      // Redirect unauthenticated users to auth
      get().navigateToAuth()
      return
    }
    
    if (user && targetView === 'auth') {
      // Redirect authenticated users away from auth
      get().navigateToThreads()
      return
    }
    
    get().navigateTo(targetView)
  },

  // Smart navigation that respects authentication
  smartNavigateTo: (view: "landing" | "threads" | "editor" | "auth", threadId?: string) => {
    const { user } = get()
    
    // Handle auth requirements
    if (!user && (view === 'threads' || view === 'editor')) {
      get().navigateToAuth()
      return
    }
    
    // Handle already authenticated users
    if (user && view === 'auth') {
      get().navigateToThreads()
      return
    }
    
    get().navigateTo(view, threadId)
  },
}) 