import type { StateCreator } from 'zustand'
import type { AppStore, ThreadsSlice } from '@/types/store'
import type { TweetSegment } from '@/types/editor'
import { createClient } from '@/utils/supabase/client'
import { splitTextToThreads } from '@/lib/ai'
import { createBulkSegments } from '@/lib/database'

export const createThreadsSlice: StateCreator<AppStore, [], [], ThreadsSlice> = (set, get) => ({
  // State
  threads: [],
  currentThread: null,
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  error: null,
  lastSaved: null,
  
  // Filters and search
  searchQuery: '',
  statusFilter: 'draft',
  sortBy: 'updated_at',
  sortOrder: 'desc',

  // ====================
  // THREAD CRUD OPERATIONS
  // ====================

  loadThreads: async () => {
    set({ isLoading: true, error: null })

    try {
      const supabase = createClient()
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await supabase
        .from('threads')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      if (error) throw error

      set({ 
        threads: data || [],
        isLoading: false 
      })
    } catch (error) {
      console.error('Failed to load threads:', error)
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load threads. Please try again.',
        isLoading: false 
      })
    }
  },

  loadThread: async (threadId: string) => {
    set({ isLoading: true, error: null })

    try {
      const supabase = createClient()
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      // Load thread details
      const { data: thread, error: threadError } = await supabase
        .from('threads')
        .select('*')
        .eq('id', threadId)
        .eq('user_id', user.id)
        .single()

      if (threadError) throw threadError

      // Load segments
      const { data: segments, error: segmentsError } = await supabase
        .from('tweet_segments')
        .select('*')
        .eq('thread_id', threadId)
        .order('segment_index', { ascending: true })

      if (segmentsError) throw segmentsError

      // Format segments
      const formattedSegments: TweetSegment[] = (segments || []).map((segment: any) => ({
        id: segment.id,
        content: segment.content,
        charCount: segment.char_count,
        index: segment.segment_index,
      }))

      const threadWithSegments = {
        ...thread,
        segments: formattedSegments,
      }

      set({ 
        currentThread: threadWithSegments,
        isLoading: false 
      })

      return threadWithSegments
    } catch (error) {
      console.error('Failed to load thread:', error)
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load thread. Please try again.',
        isLoading: false 
      })
      return null
    }
  },

  createThread: async (title: string, description?: string, longText?: string, targetTweetCount?: number) => {
    set({ isCreating: true, error: null })

    try {
      const supabase = createClient()
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      // First create the thread
      const { data: thread, error: threadError } = await supabase
        .from('threads')
        .insert({
          title: title.trim(),
          description: description?.trim(),
          status: 'draft',
          user_id: user.id,
        })
        .select()
        .single()

      if (threadError) throw threadError

      // If longText is provided, split it into segments using AI
      if (longText?.trim()) {
        const aiResponse = await splitTextToThreads({
          text: longText.trim(),
          title: title.trim(),
          tone: 'informative', // Default tone, could be made configurable
          targetTweetCount: targetTweetCount || 5, // Use provided count or default to 5
        })

        if (!aiResponse.success || !aiResponse.data) {
          // If AI fails, still return the thread but show error
          console.error('AI splitting failed:', aiResponse.error)
          set({ 
            error: `Thread created, but AI splitting failed: ${aiResponse.error}. You can manually add content.`,
            isCreating: false 
          })
        } else {
          // Create segments from AI response
          const segmentsToCreate = aiResponse.data.segments.map(segment => ({
            content: segment.content,
            index: segment.order - 1, // Convert 1-based to 0-based indexing
          }))

          const createdSegments = await createBulkSegments(thread.id, segmentsToCreate)
          
          if (createdSegments.length === 0) {
            set({ 
              error: 'Thread created, but failed to create segments. You can manually add content.',
              isCreating: false 
            })
          }

          // Update thread stats
          const totalCharacters = createdSegments.reduce((sum, seg) => sum + seg.charCount, 0)
          await supabase
            .from('threads')
            .update({
              total_characters: totalCharacters,
              total_tweets: createdSegments.length,
            })
            .eq('id', thread.id)

          // Update local thread data
          thread.total_characters = totalCharacters
          thread.total_tweets = createdSegments.length
        }
      }

      // Add to threads list with optimistic update
      const { threads } = get()
      set({ 
        threads: [thread, ...threads],
        isCreating: false 
      })

      return thread
    } catch (error) {
      console.error('Failed to create thread:', error)
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create thread. Please try again.',
        isCreating: false 
      })
      return null
    }
  },

  updateThread: async (threadId: string, updates: Partial<any>) => {
    set({ isUpdating: true, error: null })

    try {
      const supabase = createClient()
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      const { error } = await supabase
        .from('threads')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', threadId)
        .eq('user_id', user.id)

      if (error) throw error

      // Update in local state with optimistic update
      const { threads, currentThread } = get()
      const updatedThreads = threads.map(thread => 
        thread.id === threadId ? { ...thread, ...updates } : thread
      )
      
      const updatedCurrentThread = currentThread?.id === threadId 
        ? { ...currentThread, ...updates }
        : currentThread

      set({ 
        threads: updatedThreads,
        currentThread: updatedCurrentThread,
        lastSaved: new Date(),
        isUpdating: false 
      })

      return true
    } catch (error) {
      console.error('Failed to update thread:', error)
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update thread. Please try again.',
        isUpdating: false 
      })
      return false
    }
  },

  deleteThread: async (threadId: string) => {
    set({ isDeleting: true, error: null })

    try {
      const supabase = createClient()
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      const { error } = await supabase
        .from('threads')
        .delete()
        .eq('id', threadId)
        .eq('user_id', user.id)

      if (error) throw error

      // Remove from local state
      const { threads, currentThread } = get()
      const updatedThreads = threads.filter(thread => thread.id !== threadId)
      
      set({ 
        threads: updatedThreads,
        currentThread: currentThread?.id === threadId ? null : currentThread,
        isDeleting: false 
      })

      return true
    } catch (error) {
      console.error('Failed to delete thread:', error)
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete thread. Please try again.',
        isDeleting: false 
      })
      return false
    }
  },

  // ====================
  // SEGMENT CRUD OPERATIONS
  // ====================

  createSegment: async (threadId: string, content: string, index: number) => {
    try {
      const supabase = createClient()
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      // Verify thread ownership
      const { data: thread, error: threadError } = await supabase
        .from('threads')
        .select('id')
        .eq('id', threadId)
        .eq('user_id', user.id)
        .single()

      if (threadError || !thread) {
        throw new Error('Thread not found or access denied')
      }

      const { data, error } = await supabase
        .from('tweet_segments')
        .insert({
          thread_id: threadId,
          content,
          segment_index: index,
          char_count: content.length,
        })
        .select()
        .single()

      if (error) throw error

      // Format for our TweetSegment type
      const newSegment: TweetSegment = {
        id: data.id,
        content: data.content,
        charCount: data.char_count,
        index: data.segment_index,
      }

      // Update current thread if it matches
      const { currentThread } = get()
      if (currentThread?.id === threadId) {
        const updatedSegments = [...(currentThread.segments || []), newSegment]
          .sort((a, b) => a.index - b.index)
        
        set({
          currentThread: {
            ...currentThread,
            segments: updatedSegments,
          }
        })
      }

      return newSegment
    } catch (error) {
      console.error('Failed to create segment:', error)
      set({ error: error instanceof Error ? error.message : 'Failed to create segment. Please try again.' })
      return null
    }
  },

  updateSegment: async (segmentId: string, content: string) => {
    try {
      const supabase = createClient()
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      const { error } = await supabase
        .from('tweet_segments')
        .update({
          content,
          char_count: content.length,
        })
        .eq('id', segmentId)

      if (error) throw error

      // Update in current thread if present
      const { currentThread } = get()
      if (currentThread?.segments) {
        const updatedSegments = currentThread.segments.map(segment =>
          segment.id === segmentId 
            ? { ...segment, content, charCount: content.length }
            : segment
        )
        
        set({
          currentThread: {
            ...currentThread,
            segments: updatedSegments,
          },
          lastSaved: new Date(),
        })
      }

      return true
    } catch (error) {
      console.error('Failed to update segment:', error)
      set({ error: error instanceof Error ? error.message : 'Failed to update segment. Please try again.' })
      return false
    }
  },

  deleteSegment: async (segmentId: string) => {
    try {
      const supabase = createClient()
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      const { error } = await supabase
        .from('tweet_segments')
        .delete()
        .eq('id', segmentId)

      if (error) throw error

      // Remove from current thread if present
      const { currentThread } = get()
      if (currentThread?.segments) {
        const updatedSegments = currentThread.segments
          .filter(segment => segment.id !== segmentId)
          .map((segment, index) => ({ ...segment, index })) // Re-index

        set({
          currentThread: {
            ...currentThread,
            segments: updatedSegments,
          }
        })
      }

      return true
    } catch (error) {
      console.error('Failed to delete segment:', error)
      set({ error: error instanceof Error ? error.message : 'Failed to delete segment. Please try again.' })
      return false
    }
  },

  reorderSegments: async (threadId: string, segments: TweetSegment[]) => {
    try {
      const supabase = createClient()
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      // Update all segments with new indices
      const updates = segments.map(segment => ({
        id: segment.id,
        segment_index: segment.index,
      }))

      // Note: Supabase doesn't support bulk updates, so we'll do individual updates
      const updatePromises = updates.map(update =>
        supabase
          .from('tweet_segments')
          .update({ segment_index: update.segment_index })
          .eq('id', update.id)
      )

      const results = await Promise.all(updatePromises)
      const hasError = results.some((result: any) => result.error)

      if (hasError) {
        throw new Error('Some segments failed to reorder')
      }

      // Update current thread if it matches
      const { currentThread } = get()
      if (currentThread?.id === threadId) {
        set({
          currentThread: {
            ...currentThread,
            segments: segments.sort((a, b) => a.index - b.index),
          }
        })
      }

      return true
    } catch (error) {
      console.error('Failed to reorder segments:', error)
      set({ error: error instanceof Error ? error.message : 'Failed to reorder segments. Please try again.' })
      return false
    }
  },

  // ====================
  // UTILITY ACTIONS
  // ====================

  setSearchQuery: (query: string) => {
    set({ searchQuery: query })
  },

  setStatusFilter: (filter: 'all' | 'draft' | 'published' | 'archived') => {
    set({ statusFilter: filter })
  },

  setSortBy: (sortBy: string) => {
    set({ sortBy })
  },

  setSortOrder: (order: 'asc' | 'desc') => {
    set({ sortOrder: order })
  },

  clearError: () => {
    set({ error: null })
  },

  clearCurrentThread: () => {
    set({ currentThread: null })
  },

  // ====================
  // COMPUTED VALUES
  // ====================

  getFilteredThreads: () => {
    const { threads, searchQuery, statusFilter } = get()
    
    let filtered = threads

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(thread => 
        thread.title.toLowerCase().includes(query) ||
        (thread.description && thread.description.toLowerCase().includes(query))
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(thread => thread.status === statusFilter)
    }

    return filtered
  },

  // ====================
  // OPTIMISTIC UPDATES
  // ====================

  optimisticUpdateThread: (threadId: string, updates: Partial<any>) => {
    const { threads, currentThread } = get()
    
    const updatedThreads = threads.map(thread => 
      thread.id === threadId ? { ...thread, ...updates } : thread
    )
    
    const updatedCurrentThread = currentThread?.id === threadId 
      ? { ...currentThread, ...updates }
      : currentThread

    set({ 
      threads: updatedThreads,
      currentThread: updatedCurrentThread,
    })
  },

  optimisticUpdateSegment: (segmentId: string, updates: Partial<TweetSegment>) => {
    const { currentThread } = get()
    
    if (currentThread?.segments) {
      const updatedSegments = currentThread.segments.map(segment =>
        segment.id === segmentId ? { ...segment, ...updates } : segment
      )
      
      set({
        currentThread: {
          ...currentThread,
          segments: updatedSegments,
        }
      })
    }
  },
}) 