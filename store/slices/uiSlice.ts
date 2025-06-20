import type { StateCreator } from 'zustand'
import type { AppStore, UISlice } from '@/types/store'

export const createUISlice: StateCreator<AppStore, [], [], UISlice> = (set, get) => ({
  // ====================
  // STATE
  // ====================
  
  // Modal states
  isCreateThreadDialogOpen: false,
  isDeleteThreadDialogOpen: false,
  isSettingsDialogOpen: false,
  
  // Loading states
  isGlobalLoading: false,
  
  // Notification/toast state
  notifications: [],
  
  // Global error state
  globalError: null,

  // ====================
  // MODAL ACTIONS
  // ====================

  openCreateThreadDialog: () => {
    set({ isCreateThreadDialogOpen: true })
  },

  closeCreateThreadDialog: () => {
    set({ isCreateThreadDialogOpen: false })
  },

  openDeleteThreadDialog: () => {
    set({ isDeleteThreadDialogOpen: true })
  },

  closeDeleteThreadDialog: () => {
    set({ isDeleteThreadDialogOpen: false })
  },

  openSettingsDialog: () => {
    set({ isSettingsDialogOpen: true })
  },

  closeSettingsDialog: () => {
    set({ isSettingsDialogOpen: false })
  },

  // ====================
  // LOADING ACTIONS
  // ====================

  setGlobalLoading: (loading: boolean) => {
    set({ isGlobalLoading: loading })
  },

  // ====================
  // NOTIFICATION ACTIONS
  // ====================

  addNotification: (notification) => {
    const { notifications } = get()
    const newNotification = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    }

    set({ 
      notifications: [...notifications, newNotification] 
    })

    // Auto-remove notification after duration (default 5 seconds)
    const duration = notification.duration || 5000
    if (duration > 0) {
      setTimeout(() => {
        get().removeNotification(newNotification.id)
      }, duration)
    }
  },

  removeNotification: (id: string) => {
    const { notifications } = get()
    set({ 
      notifications: notifications.filter(n => n.id !== id) 
    })
  },

  clearNotifications: () => {
    set({ notifications: [] })
  },

  // ====================
  // ERROR HANDLING
  // ====================

  setGlobalError: (error: string | null) => {
    set({ globalError: error })
  },

  clearGlobalError: () => {
    set({ globalError: null })
  },

  // ====================
  // UTILITY METHODS
  // ====================

  // Show a success notification
  showSuccessNotification: (title: string, message?: string, duration?: number) => {
    get().addNotification({
      type: 'success',
      title,
      message,
      duration,
    })
  },

  // Show an error notification
  showErrorNotification: (title: string, message?: string, duration?: number) => {
    get().addNotification({
      type: 'error',
      title,
      message,
      duration: duration || 7000, // Errors stay longer by default
    })
  },

  // Show a warning notification
  showWarningNotification: (title: string, message?: string, duration?: number) => {
    get().addNotification({
      type: 'warning',
      title,
      message,
      duration,
    })
  },

  // Show an info notification
  showInfoNotification: (title: string, message?: string, duration?: number) => {
    get().addNotification({
      type: 'info',
      title,
      message,
      duration,
    })
  },

  // Handle async operation with loading and notifications
  withGlobalLoading: async <T>(
    operation: () => Promise<T>,
    successMessage?: string,
    errorMessage?: string
  ): Promise<T | null> => {
    try {
      get().setGlobalLoading(true)
      get().clearGlobalError()
      
      const result = await operation()
      
      if (successMessage) {
        get().showSuccessNotification(successMessage)
      }
      
      return result
    } catch (error) {
      const message = errorMessage || 'An error occurred'
      get().showErrorNotification(message, error instanceof Error ? error.message : undefined)
      get().setGlobalError(error instanceof Error ? error.message : 'Unknown error')
      return null
    } finally {
      get().setGlobalLoading(false)
    }
  },

  // Batch close all modals
  closeAllModals: () => {
    set({
      isCreateThreadDialogOpen: false,
      isDeleteThreadDialogOpen: false,
      isSettingsDialogOpen: false,
    })
  },

  // Check if any modal is open
  hasOpenModals: (): boolean => {
    const state = get()
    return state.isCreateThreadDialogOpen || 
           state.isDeleteThreadDialogOpen || 
           state.isSettingsDialogOpen
  },
}) 