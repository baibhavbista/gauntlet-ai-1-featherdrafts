import type { User } from "@supabase/supabase-js"
import type { TweetSegment, Suggestion } from "./editor"

// ==================== AUTH SLICE ====================
export interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
  isInitialized: boolean
}

export interface AuthActions {
  // Auth methods
  initialize: () => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName?: string) => Promise<void>
  signInWithOAuth: (provider: 'google') => Promise<void>
  signOut: () => Promise<void>
  clearError: () => void
  // Internal methods
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export type AuthSlice = AuthState & AuthActions

// ==================== THREAD SLICE ====================
export interface Thread {
  id: string
  user_id: string
  title: string
  description?: string
  status: "draft" | "published" | "archived"
  total_characters: number
  total_tweets: number
  created_at: string
  updated_at: string
  published_at?: string
}

export interface ThreadWithSegments extends Thread {
  segments: TweetSegment[]
}

export interface ThreadsState {
  threads: Thread[]
  currentThread: ThreadWithSegments | null
  isLoading: boolean
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
  error: string | null
  lastSaved: Date | null
  
  // Filters and search
  searchQuery: string
  statusFilter: "all" | "draft" | "published" | "archived"
  sortBy: string
  sortOrder: "asc" | "desc"
}

export interface ThreadsActions {
  // CRUD operations
  loadThreads: () => Promise<void>
  createThread: (title: string, description?: string) => Promise<Thread | null>
  loadThread: (threadId: string) => Promise<ThreadWithSegments | null>
  updateThread: (threadId: string, updates: Partial<Thread>) => Promise<boolean>
  deleteThread: (threadId: string) => Promise<boolean>
  
  // Segment operations
  createSegment: (threadId: string, content: string, index: number) => Promise<TweetSegment | null>
  updateSegment: (segmentId: string, content: string) => Promise<boolean>
  deleteSegment: (segmentId: string) => Promise<boolean>
  reorderSegments: (threadId: string, segments: TweetSegment[]) => Promise<boolean>
  
  // UI state
  setSearchQuery: (query: string) => void
  setStatusFilter: (filter: "all" | "draft" | "published" | "archived") => void
  setSortBy: (sortBy: string) => void
  setSortOrder: (order: "asc" | "desc") => void
  clearError: () => void
  clearCurrentThread: () => void
  
  // Utility methods
  optimisticUpdateThread: (threadId: string, updates: Partial<Thread>) => void
  getFilteredThreads: () => Thread[]
}

export type ThreadsSlice = ThreadsState & ThreadsActions

// ==================== EDITOR SLICE ====================
export interface EditorState {
  // Core editor state
  segments: TweetSegment[]
  activeSegmentId: string
  suggestions: Suggestion[]
  
  // Async operation states
  isSpellCheckLoading: boolean
  isGrammarCheckLoading: boolean
  isSaving: boolean
  isAutoSaveEnabled: boolean
  
  // Dictionary/spell check status
  dictionaryStatus: {
    isInitialized: boolean
    isLoading: boolean
  }
  
  // UI states
  isEditingTitle: boolean
  selectedSuggestionId: string | null
}

export interface EditorActions {
  // Segment operations (editor-specific, different from threads CRUD)
  updateSegmentContent: (segmentId: string, content: string) => void
  addSegment: (afterSegmentId: string) => void
  removeSegment: (segmentId: string) => void
  reorderEditorSegments: (segments: TweetSegment[]) => void
  setActiveSegment: (segmentId: string) => void
  
  // Content checking
  runSpellCheck: (segments?: TweetSegment[]) => Promise<void>
  runGrammarCheck: (segments?: TweetSegment[]) => Promise<void>
  runAllChecks: (segments?: TweetSegment[]) => Promise<void>
  runSingleSegmentCheck: (segment: TweetSegment) => Promise<void>
  
  // Suggestions management
  applySuggestion: (suggestionId: string, replacement: string) => void
  dismissSuggestion: (suggestionId: string) => void
  fixAllSuggestions: () => Promise<void>
  clearSuggestions: () => void
  
  // Auto-save functionality
  saveImmediately: () => Promise<void>
  enableAutoSave: () => void
  disableAutoSave: () => void
  
  // Dictionary management
  initializeDictionary: () => Promise<void>
  
  // UI actions
  setEditingTitle: (isEditing: boolean) => void
  selectSuggestion: (suggestionId: string | null) => void
  
  // Internal state setters
  setSegments: (segments: TweetSegment[]) => void
  setSuggestions: (suggestions: Suggestion[]) => void
  setSpellCheckLoading: (loading: boolean) => void
  setGrammarCheckLoading: (loading: boolean) => void
  setSaving: (saving: boolean) => void
  setDictionaryStatus: (status: { isInitialized: boolean; isLoading: boolean }) => void
  
  // Reset functionality
  resetEditor: () => void
  initializeEditor: (threadId?: string) => Promise<void>
  
  // Debounced operations
  debouncedSaveAndCheck: (segmentId: string, content: string) => void
  debouncedSaveAll: () => void
}

export type EditorSlice = EditorState & EditorActions

// ==================== NAVIGATION SLICE ====================
export type ViewType = "landing" | "threads" | "editor" | "auth"

export interface NavigationHistoryEntry {
  view: ViewType
  threadId: string | null
  timestamp: number
}

export interface NavigationState {
  currentView: ViewType
  currentThreadId: string | null
  previousView: ViewType | null
  navigationHistory: NavigationHistoryEntry[]
}

export interface NavigationActions {
  // Primary navigation
  navigateTo: (view: ViewType, threadId?: string) => void
  navigateToThreads: () => void
  navigateToEditor: (threadId?: string) => void
  navigateToAuth: () => void
  navigateToLanding: () => void
  navigateBack: () => void
  
  // Thread-specific navigation
  selectThread: (threadId: string) => void
  createNewThread: () => void
  returnToThreads: () => void
  
  // Utility methods
  getCurrentRoute: () => { view: ViewType; threadId: string | null }
  canGoBack: () => boolean
  clearHistory: () => void
  
  // Auth-aware navigation
  handleAuthenticatedNavigation: (targetView: ViewType) => void
  smartNavigateTo: (view: ViewType, threadId?: string) => void
}

export type NavigationSlice = NavigationState & NavigationActions

// ==================== UI SLICE ====================
export interface UIState {
  // Modal states
  isCreateThreadDialogOpen: boolean
  isDeleteThreadDialogOpen: boolean
  isSettingsDialogOpen: boolean
  
  // Loading states
  isGlobalLoading: boolean
  
  // Notification/toast state
  notifications: Array<{
    id: string
    type: "success" | "error" | "warning" | "info"
    title: string
    message?: string
    duration?: number
  }>
  
  // Global error state
  globalError: string | null
}

export interface UIActions {
  // Modal actions
  openCreateThreadDialog: () => void
  closeCreateThreadDialog: () => void
  openDeleteThreadDialog: () => void
  closeDeleteThreadDialog: () => void
  openSettingsDialog: () => void
  closeSettingsDialog: () => void
  
  // Loading actions
  setGlobalLoading: (loading: boolean) => void
  
  // Notification actions
  addNotification: (notification: Omit<UIState['notifications'][0], 'id'>) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
  
  // Error handling
  setGlobalError: (error: string | null) => void
  clearGlobalError: () => void
  
  // Utility methods
  showSuccessNotification: (title: string, message?: string, duration?: number) => void
  showErrorNotification: (title: string, message?: string, duration?: number) => void
  showWarningNotification: (title: string, message?: string, duration?: number) => void
  showInfoNotification: (title: string, message?: string, duration?: number) => void
  withGlobalLoading: <T>(operation: () => Promise<T>, successMessage?: string, errorMessage?: string) => Promise<T | null>
  closeAllModals: () => void
  hasOpenModals: () => boolean
}

export type UISlice = UIState & UIActions

// ==================== MAIN STORE TYPE ====================
export type AppStore = AuthSlice & ThreadsSlice & EditorSlice & NavigationSlice & UISlice

// ==================== STORE PERSISTENCE CONFIG ====================
export interface PersistConfig {
  // Which parts of the store to persist
  auth: {
    user: boolean
    isInitialized: boolean
  }
  navigation: {
    currentView: boolean
    currentThreadId: boolean
  }
  editor: {
    isAutoSaveEnabled: boolean
    dictionaryStatus: boolean
  }
  ui: {
    // Generally don't persist UI state, but could persist user preferences
  }
}

// ==================== STORE INITIALIZATION ====================
export interface StoreInitialState {
  auth: AuthState
  threads: ThreadsState  
  editor: EditorState
  navigation: NavigationState
  ui: UIState
} 