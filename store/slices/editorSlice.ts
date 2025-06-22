import type { StateCreator } from 'zustand'
import type { AppStore, EditorSlice } from '@/types/store'
import type { TweetSegment, Suggestion } from '@/types/editor'
import { checkSpelling, countCharacters, getSpellCheckStatus, preloadDictionary } from '@/utils/spellcheck'
import { checkGrammar } from '@/utils/grammar'
import { createClient } from '@/utils/supabase/client'

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(func: T, delay: number): T & { cancel: () => void } {
  let timeoutId: NodeJS.Timeout | null = null
  
  const debouncedFunc = ((...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }) as T & { cancel: () => void }
  
  debouncedFunc.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }
  
  return debouncedFunc
}

export const createEditorSlice: StateCreator<AppStore, [], [], EditorSlice> = (set, get) => {
  // Internal refs for debounced operations
  let spellCheckAbortController: AbortController | null = null
  let debouncedSaveRef: ReturnType<typeof debounce> | null = null
  let debouncedCheckRef: ReturnType<typeof debounce> | null = null

  return {
    // ====================
    // STATE
    // ====================
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

    // ====================
    // SEGMENT OPERATIONS
    // ====================

    updateSegmentContent: (segmentId: string, content: string) => {
      const { segments, isAutoSaveEnabled } = get()
      
      // Update local state immediately for responsive UI
      const newSegments = segments.map((segment) =>
        segment.id === segmentId 
          ? { ...segment, content, charCount: countCharacters(content) } 
          : segment
      )

      set({ segments: newSegments })

      // Only trigger save and check if auto-save is enabled
      if (isAutoSaveEnabled) {
        const changedSegment = newSegments.find(s => s.id === segmentId)
        if (changedSegment) {
          // Trigger debounced save and check for this specific segment
          get().debouncedSaveAndCheck(segmentId, content)
        }
      }
    },

    addSegment: (afterSegmentId: string) => {
      const { segments } = get()
      
      const afterIndex = segments.findIndex((s) => s.id === afterSegmentId)
      const newSegment: TweetSegment = {
        id: `temp-segment-${Date.now()}`,
        content: "",
        charCount: 0,
        index: afterIndex + 1,
      }

      const newSegments = [
        ...segments.slice(0, afterIndex + 1),
        newSegment,
        ...segments.slice(afterIndex + 1).map((s) => ({ ...s, index: s.index + 1 })),
      ]

      set({ 
        segments: newSegments,
        activeSegmentId: newSegment.id,
      })

      // Auto-save the new structure
      if (get().isAutoSaveEnabled) {
        get().debouncedSaveAll()
      }
    },

    removeSegment: (segmentId: string) => {
      const { segments } = get()
      
      if (segments.length <= 1) return

      // Remove suggestions for this segment
      const { suggestions } = get()
      const filteredSuggestions = suggestions.filter((s) => s.segmentId !== segmentId)

      // Update segments and re-index
      const newSegments = segments
        .filter((s) => s.id !== segmentId)
        .map((s, index) => ({ ...s, index }))

      const newActiveId = newSegments[0]?.id || ""

      set({ 
        segments: newSegments,
        activeSegmentId: newActiveId,
        suggestions: filteredSuggestions,
      })

      // Delete from database if it's not a temp segment
      if (!segmentId.startsWith("temp-")) {
        get().deleteSegment(segmentId)
      }

      // Auto-save the new structure
      if (get().isAutoSaveEnabled) {
        get().debouncedSaveAll()
      }
    },

    reorderEditorSegments: (segments: TweetSegment[]) => {
      set({ segments })
      
      // Auto-save the new order
      if (get().isAutoSaveEnabled) {
        get().debouncedSaveAll()
      }
    },

    setActiveSegment: (segmentId: string) => {
      set({ activeSegmentId: segmentId })
    },

    // ====================
    // CONTENT CHECKING
    // ====================

    runSpellCheck: async (segments?: TweetSegment[]) => {
      const { dictionaryStatus } = get()
      const segmentsToCheck = segments || get().segments

      if (!dictionaryStatus.isInitialized || segmentsToCheck.length === 0) return

      set({ isSpellCheckLoading: true })

      try {
        const { customDictionary } = get()
        const spellCheckPromises = segmentsToCheck.map(segment =>
          checkSpelling(segment.content, segment.id, customDictionary)
        )

        const allSpellingSuggestions = await Promise.all(spellCheckPromises)
        const flatSpellingSuggestions = allSpellingSuggestions.flat()

        // Update suggestions, replacing old spelling suggestions
        const { suggestions } = get()
        const nonSpellingSuggestions = suggestions.filter(s => s.type !== 'spelling')
        
        set({ 
          suggestions: [...nonSpellingSuggestions, ...flatSpellingSuggestions],
          isSpellCheckLoading: false 
        })
      } catch (error) {
        console.error('Spell check error:', error)
        set({ isSpellCheckLoading: false })
      }
    },

    runGrammarCheck: async (segments?: TweetSegment[]) => {
      const segmentsToCheck = segments || get().segments

      if (segmentsToCheck.length === 0) return

      set({ isGrammarCheckLoading: true })

      try {
        const grammarCheckPromises = segmentsToCheck.map(segment =>
          checkGrammar(segment.content, segment.id)
        )

        const allGrammarSuggestions = await Promise.all(grammarCheckPromises)
        const flatGrammarSuggestions = allGrammarSuggestions.flat()

        // Update suggestions, replacing old grammar suggestions
        const { suggestions } = get()
        const nonGrammarSuggestions = suggestions.filter(s => s.type !== 'grammar')
        
        set({ 
          suggestions: [...nonGrammarSuggestions, ...flatGrammarSuggestions],
          isGrammarCheckLoading: false 
        })
      } catch (error) {
        console.error('Grammar check error:', error)
        set({ isGrammarCheckLoading: false })
      }
    },

    runAllChecks: async (segments?: TweetSegment[]) => {
      // Abort any existing spell check operations
      if (spellCheckAbortController) {
        spellCheckAbortController.abort()
      }

      spellCheckAbortController = new AbortController()
      const currentController = spellCheckAbortController

      const segmentsToCheck = segments || get().segments
      const { dictionaryStatus } = get()

      if (segmentsToCheck.length === 0) return

      set({ 
        isSpellCheckLoading: true,
        isGrammarCheckLoading: true 
      })

      try {
        const allChecks = await Promise.all(
          segmentsToCheck.map(async (segment) => {
            const { customDictionary } = get()
            const [spellingSuggestions, grammarSuggestions] = await Promise.all([
              dictionaryStatus.isInitialized 
                ? checkSpelling(segment.content, segment.id, customDictionary) 
                : Promise.resolve([]),
              checkGrammar(segment.content, segment.id),
            ])

            return [...spellingSuggestions, ...grammarSuggestions]
          })
        )

        // Check if operation was aborted
        if (currentController.signal.aborted) {
          return
        }

        const flatSuggestions = allChecks.flat()

        set({
          suggestions: flatSuggestions,
          isSpellCheckLoading: false,
          isGrammarCheckLoading: false,
        })
      } catch (error) {
        if (!currentController.signal.aborted) {
          console.error('Check error:', error)
          set({ 
            isSpellCheckLoading: false,
            isGrammarCheckLoading: false,
          })
        }
      }
    },

    runSingleSegmentCheck: async (segment: TweetSegment) => {
      // Abort any existing operations
      if (spellCheckAbortController) {
        spellCheckAbortController.abort()
      }

      spellCheckAbortController = new AbortController()
      const currentController = spellCheckAbortController

      const { dictionaryStatus } = get()

      set({ 
        isSpellCheckLoading: true,
        isGrammarCheckLoading: true 
      })

      try {
        const { customDictionary } = get()
        const [spellingSuggestions, grammarSuggestions] = await Promise.all([
          dictionaryStatus.isInitialized 
            ? checkSpelling(segment.content, segment.id, customDictionary) 
            : Promise.resolve([]),
          checkGrammar(segment.content, segment.id),
        ])

        if (currentController.signal.aborted) {
          return
        }

        const newSuggestions = [...spellingSuggestions, ...grammarSuggestions]

        // Update suggestions by removing old ones for this segment and adding new ones
        const { suggestions } = get()
        const filteredSuggestions = suggestions.filter(s => s.segmentId !== segment.id)

        set({
          suggestions: [...filteredSuggestions, ...newSuggestions],
          isSpellCheckLoading: false,
          isGrammarCheckLoading: false,
        })
      } catch (error) {
        if (!currentController.signal.aborted) {
          console.error('Single segment check error:', error)
          set({ 
            isSpellCheckLoading: false,
            isGrammarCheckLoading: false,
          })
        }
      }
    },

    // ====================
    // SUGGESTIONS MANAGEMENT
    // ====================

    applySuggestion: (suggestionId: string, replacement: string) => {
      const { suggestions, segments } = get()
      
      const suggestion = suggestions.find((s) => s.id === suggestionId)
      if (!suggestion) return

      const segment = segments.find((s) => s.id === suggestion.segmentId)
      if (!segment) return

      // Special handling for AI suggestions that start with [
      if (replacement.startsWith('[')) {
        // TODO: Implement AI suggestion handling
        console.log('AI suggestion detected:', replacement)
        return
      }

      const newContent =
        segment.content.substring(0, suggestion.start) + 
        replacement + 
        segment.content.substring(suggestion.end)

      // Update the segment content
      get().updateSegmentContent(suggestion.segmentId, newContent)
    },

    applySuggestions: (suggestionIds: string[], replacement: string) => {
      const { suggestions, segments } = get()
      
      if (suggestionIds.length === 0) return

      // Special handling for AI suggestions that start with [
      if (replacement.startsWith('[')) {
        // TODO: Implement AI suggestion handling
        console.log('AI suggestion detected:', replacement)
        return
      }

      // Get all suggestions and group by segment
      const suggestionsToApply = suggestions.filter(s => suggestionIds.includes(s.id))
      const suggestionsBySegment = suggestionsToApply.reduce((acc, suggestion) => {
        if (!acc[suggestion.segmentId]) {
          acc[suggestion.segmentId] = []
        }
        acc[suggestion.segmentId].push(suggestion)
        return acc
      }, {} as Record<string, typeof suggestions>)

      // Apply replacements for each segment
      Object.entries(suggestionsBySegment).forEach(([segmentId, segmentSuggestions]) => {
        const segment = segments.find(s => s.id === segmentId)
        if (!segment) return

        // Sort suggestions by position (descending - rightmost first)
        // This ensures that applying replacements doesn't affect positions of earlier suggestions
        const sortedSuggestions = segmentSuggestions.sort((a, b) => b.start - a.start)

        let newContent = segment.content

        // Apply all replacements from right to left
        sortedSuggestions.forEach(suggestion => {
          newContent = 
            newContent.substring(0, suggestion.start) + 
            replacement + 
            newContent.substring(suggestion.end)
        })

        // Update the segment content
        get().updateSegmentContent(segmentId, newContent)
      })
    },

    dismissSuggestion: (suggestionId: string) => {
      const { suggestions } = get()
      const filteredSuggestions = suggestions.filter(s => s.id !== suggestionId)
      set({ suggestions: filteredSuggestions })
    },

    fixAllSuggestions: async () => {
      const { segments, suggestions } = get()
      let updatedSegments = [...segments]

      // Sort suggestions by position (reverse order to maintain positions)
      const sortedSuggestions = [...suggestions].sort((a, b) => b.start - a.start)

      sortedSuggestions.forEach((suggestion) => {
        const segmentIndex = updatedSegments.findIndex((s) => s.id === suggestion.segmentId)
        if (segmentIndex === -1 || suggestion.suggestions.length === 0) return

        const segment = updatedSegments[segmentIndex]
        const bestSuggestion = suggestion.suggestions[0]

        // Skip empty suggestions or AI suggestions
        if (bestSuggestion === "" || bestSuggestion.startsWith("[")) return

        const newContent =
          segment.content.substring(0, suggestion.start) + 
          bestSuggestion + 
          segment.content.substring(suggestion.end)

        updatedSegments[segmentIndex] = {
          ...segment,
          content: newContent,
          charCount: countCharacters(newContent),
        }
      })

      set({ segments: updatedSegments })

      // Re-run checks on updated segments and save
      await get().runAllChecks(updatedSegments)
      get().debouncedSaveAll()
    },

    clearSuggestions: () => {
      set({ suggestions: [] })
    },

    // ====================
    // AUTO-SAVE FUNCTIONALITY
    // ====================

    saveImmediately: async () => {
      const { segments, currentThread } = get()
      
      // Check authentication using Supabase client
      const supabase = createClient()
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        console.error('User not authenticated for save:', error)
        set({ isSaving: false })
        return
      }

      // Get the current thread title from threads store
      const currentThreadTitle = currentThread?.title || 'Untitled Thread'

      set({ isSaving: true })

      try {
        let threadToUpdate = currentThread

        // Create thread if it doesn't exist
        if (!threadToUpdate) {
          const newThread = await get().createThread(currentThreadTitle)
          if (newThread) {
            threadToUpdate = { ...newThread, segments: [] }
            // Update currentThread in threads store
            // This will be handled by the threads store action
          } else {
            console.error('Failed to create thread')
            set({ isSaving: false })
            return
          }
        } else if (threadToUpdate.title !== currentThreadTitle) {
          // Update thread title if changed
          const updateSuccess = await get().updateThread(threadToUpdate.id, { title: currentThreadTitle })
          if (!updateSuccess) {
            console.error('Failed to update thread title')
            set({ isSaving: false })
            return
          }
        }

        // Update segments
        const updatedSegments = [...segments]
        let hasChanges = false

        for (let i = 0; i < segments.length; i++) {
          const segment = segments[i]
          if (segment.id.startsWith("temp-")) {
            // Create new segment and get the real ID
            const newSegment = await get().createSegment(
              threadToUpdate.id, 
              segment.content, 
              segment.index
            )
            if (newSegment) {
              updatedSegments[i] = newSegment
              hasChanges = true
            }
            // Note: If createSegment fails, we continue with other segments
            // rather than failing the entire save operation
          } else {
            // Update existing segment
            const updateSuccess = await get().updateSegment(segment.id, segment.content)
            // Note: If updateSegment fails, we continue with other segments
            // rather than failing the entire save operation
          }
        }

        // Update segments with real IDs if we have changes
        if (hasChanges) {
          set({ segments: updatedSegments })
        }

        set({ isSaving: false })
      } catch (error) {
        console.error('Save failed:', error)
        set({ isSaving: false })
      }
    },

    enableAutoSave: () => {
      set({ isAutoSaveEnabled: true })
    },

    disableAutoSave: () => {
      set({ isAutoSaveEnabled: false })
    },

    // ====================
    // DICTIONARY MANAGEMENT
    // ====================

    initializeDictionary: async () => {
      try {
        set({ 
          dictionaryStatus: { isInitialized: false, isLoading: true } 
        })

        await preloadDictionary()
        
        const status = getSpellCheckStatus()
        set({ dictionaryStatus: status })
      } catch (error) {
        console.error('Failed to initialize dictionary:', error)
        set({ 
          dictionaryStatus: { isInitialized: false, isLoading: false } 
        })
      }
    },

    // ====================
    // UI ACTIONS
    // ====================

    setEditingTitle: (isEditing: boolean) => {
      set({ isEditingTitle: isEditing })
    },

    selectSuggestion: (suggestionId: string | null) => {
      set({ selectedSuggestionId: suggestionId })
    },

    // ====================
    // INTERNAL STATE SETTERS
    // ====================

    setSegments: (segments: TweetSegment[]) => {
      set({ segments })
    },

    setSuggestions: (suggestions: Suggestion[]) => {
      set({ suggestions })
    },

    setSpellCheckLoading: (loading: boolean) => {
      set({ isSpellCheckLoading: loading })
    },

    setGrammarCheckLoading: (loading: boolean) => {
      set({ isGrammarCheckLoading: loading })
    },

    setSaving: (saving: boolean) => {
      set({ isSaving: saving })
    },

    setDictionaryStatus: (status: { isInitialized: boolean; isLoading: boolean }) => {
      set({ dictionaryStatus: status })
    },

    // ====================
    // RESET FUNCTIONALITY
    // ====================

    resetEditor: () => {
      // Cancel any pending operations
      if (debouncedSaveRef) debouncedSaveRef.cancel()
      if (debouncedCheckRef) debouncedCheckRef.cancel()
      if (spellCheckAbortController) spellCheckAbortController.abort()

      set({
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
        isEditingTitle: false,
        selectedSuggestionId: null,
      })
    },

    initializeEditor: async (threadId?: string) => {
      // Reset to clean state
      get().resetEditor()

      // Initialize dictionary if not already done
      const { dictionaryStatus } = get()
      if (!dictionaryStatus.isInitialized && !dictionaryStatus.isLoading) {
        await get().initializeDictionary()
      }

      // Load thread if threadId provided
      if (threadId) {
        const thread = await get().loadThread(threadId)
        if (thread && thread.segments.length > 0) {
          set({
            segments: thread.segments,
            activeSegmentId: thread.segments[0].id,
          })

          // Run initial checks
          setTimeout(() => {
            get().runAllChecks(thread.segments)
          }, 100)
        }
      }
    },

    // ====================
    // DEBOUNCED OPERATIONS
    // ====================

    debouncedSaveAndCheck: (segmentId: string, content: string) => {
      const { segments } = get()
      
      // Initialize debounced functions if needed
      if (!debouncedSaveRef) {
        debouncedSaveRef = debounce(async () => {
          await get().saveImmediately()
        }, 2000)
      }

      if (!debouncedCheckRef) {
        debouncedCheckRef = debounce(async (segmentToCheck: TweetSegment) => {
          await get().runSingleSegmentCheck(segmentToCheck)
        }, 800)
      }

      // Find the segment to check
      const segment = segments.find(s => s.id === segmentId)
      if (segment) {
        // Trigger both debounced save and check
        debouncedSaveRef()
        debouncedCheckRef(segment)
      }
    },

    debouncedSaveAll: () => {
      if (!debouncedSaveRef) {
        debouncedSaveRef = debounce(async () => {
          await get().saveImmediately()
        }, 2000)
      }

      debouncedSaveRef()
    },
  }
} 