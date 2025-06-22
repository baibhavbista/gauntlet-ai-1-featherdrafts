"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { TweetSegmentComponent } from "./tweet-segment"
import { ThreadHeader } from "./thread-header"
import {
  Wand2,
  Loader2,
  AlertCircle,
  Sparkles,
  X,
  RefreshCw,
} from "lucide-react"
import { useAuthContext } from "./auth/auth-context"
import { useEditor, useThreads } from "@/store"
import { useRouter } from "next/navigation"
import type { Thread } from "@/types/store"
import { PageLoading } from "@/components/ui/loading-spinner"
import { splitTextToThreads } from "@/lib/ai"
import { createBulkSegments } from "@/lib/database"

interface ThreadDetailProps {
  threadId?: string | null
  isAiGenerated?: boolean
}

interface ThreadContentProps {
  segments: any[]
  totalCharacters: number
  isAiGenerated: boolean
  showAiSuccessBanner: boolean
  primaryLoadingState: boolean
  dictionaryStatus: any
  handleAiResplit: () => Promise<void>
  isAiResplitting: boolean
  setShowAiSuccessBanner: (show: boolean) => void
  activeSegmentId: string | null
  updateSegmentContent: (id: string, content: string) => void
  setActiveSegment: (id: string) => void
  removeSegment: (id: string) => void
  addSegment: (afterId: string) => void
  suggestions: any[]
  applySuggestion: (suggestionId: string, replacement: string) => void
  applySuggestions: (suggestionIds: string[], replacement: string) => void
  handleWordAddedToDictionary: (word: string) => void
  totalSuggestions: number
  spellingSuggestions: any[]
  grammarSuggestions: any[]
}

interface ThreadSidebarProps {
  segments: any[]
  totalCharacters: number
  totalSuggestions: number
  spellingSuggestions: any[]
  grammarSuggestions: any[]
  currentThread: any
  isAiGenerated: boolean
  showAiSuccessBanner: boolean
}

function ThreadSidebar({
  segments,
  totalCharacters,
  totalSuggestions,
  spellingSuggestions,
  grammarSuggestions,
  currentThread,
  isAiGenerated,
  showAiSuccessBanner,
}: ThreadSidebarProps) {
  return (
    <div className="w-80 bg-gray-50 border-l border-gray-200 p-6">
      <div className="space-y-6">
        {/* Thread Stats */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Thread Stats
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Tweets:</span>
              <span className="font-medium">{segments.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Characters:</span>
              <span className="font-medium">{totalCharacters}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Avg per Tweet:</span>
              <span className="font-medium">
                {segments.length > 0 ? Math.round(totalCharacters / segments.length) : 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className="font-medium capitalize">
                {currentThread?.status || 'draft'}
              </span>
            </div>
          </div>
        </div>

        {/* AI Enhancement Status */}
        {(isAiGenerated || showAiSuccessBanner) && (
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h3 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              AI Enhanced
            </h3>
            <p className="text-sm text-blue-700">
              This thread was generated using AI to optimize tweet structure and flow.
            </p>
          </div>
        )}

        {/* Writing Suggestions Summary */}
        {totalSuggestions > 0 && (
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Wand2 className="h-4 w-4" />
              Writing Quality
            </h3>
            <div className="space-y-3">
              {spellingSuggestions.length > 0 && (
                <div className="flex items-center justify-between p-2 bg-red-50 rounded border border-red-200">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-red-700">Spelling</span>
                  </div>
                  <span className="text-sm font-medium text-red-700">
                    {spellingSuggestions.length}
                  </span>
                </div>
              )}
              {grammarSuggestions.length > 0 && (
                <div className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-blue-700">Grammar</span>
                  </div>
                  <span className="text-sm font-medium text-blue-700">
                    {grammarSuggestions.length}
                  </span>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-2">
                Click highlighted text in tweets to see suggestions
              </p>
            </div>
          </div>
        )}

        {/* Thread Information */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h3 className="font-medium text-gray-900 mb-3">Thread Info</h3>
          <div className="space-y-2 text-sm">
            {currentThread?.created_at && (
              <div>
                <span className="text-gray-600">Created:</span>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(currentThread.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            )}
            {currentThread?.updated_at && (
              <div>
                <span className="text-gray-600">Last Updated:</span>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(currentThread.updated_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            )}
            {currentThread?.published_at && currentThread?.status === 'published' && (
              <div>
                <span className="text-gray-600">Published:</span>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(currentThread.published_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ThreadContent({
  segments,
  totalCharacters,
  isAiGenerated,
  showAiSuccessBanner,
  primaryLoadingState,
  dictionaryStatus,
  handleAiResplit,
  isAiResplitting,
  setShowAiSuccessBanner,
  activeSegmentId,
  updateSegmentContent,
  setActiveSegment,
  removeSegment,
  addSegment,
  suggestions,
  applySuggestion,
  applySuggestions,
  handleWordAddedToDictionary,
  totalSuggestions,
  spellingSuggestions,
  grammarSuggestions,
}: ThreadContentProps) {
  return (
    <div className="flex-1 max-w-2xl p-6 pt-0">
      {/* Tweet thread */}
      <div className="mb-6">
        

        <div className="text-sm text-gray-600 mb-4 flex items-center gap-2 flex-wrap">
          <span>
            {segments.length} tweet{segments.length !== 1 ? "s" : ""} • {totalCharacters}{" "}
            characters total
          </span>
          
          {/* Show AI indicator if thread was AI-generated */}
          {(isAiGenerated || showAiSuccessBanner) && segments.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
              <Sparkles className="h-3 w-3" />
              AI Enhanced
            </span>
          )}

          {/* Only show dictionary loading if no primary loading state is active */}
          {!primaryLoadingState && dictionaryStatus.isLoading && (
            <div className="flex items-center gap-1 text-blue-600">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span className="text-xs">Loading dictionary...</span>
            </div>
          )}

          {!dictionaryStatus.isInitialized && !dictionaryStatus.isLoading && (
            <div className="flex items-center gap-1 text-yellow-600">
              <AlertCircle className="h-3 w-3" />
              <span className="text-xs">Spellcheck unavailable</span>
            </div>
          )}
        </div>

        {/* AI Success Banner */}
        {showAiSuccessBanner && (
          <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="font-medium text-gray-900">✨ AI Generated Thread</h3>
                  <p className="text-sm text-gray-600">
                    Your content has been intelligently split into {segments.length} tweet segments. 
                    Feel free to edit and refine each tweet!
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAiResplit}
                  disabled={isAiResplitting || segments.length === 0}
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  {isAiResplitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Re-splitting...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Re-split with AI
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAiSuccessBanner(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {segments.map((segment) => (
          <TweetSegmentComponent
            key={segment.id}
            segment={segment}
            isActive={segment.id === activeSegmentId}
            onContentChange={updateSegmentContent}
            onFocus={setActiveSegment}
            onDelete={removeSegment}
            onAddSegment={addSegment}
            suggestions={suggestions}
            onSuggestionApply={applySuggestion}
            onSuggestionsApply={applySuggestions}
            onWordAddedToDictionary={handleWordAddedToDictionary}
            isSpellCheckLoading={primaryLoadingState}
          />
        ))}
      </div>
    </div>
  )
}

export function ThreadDetail({ threadId, isAiGenerated = false }: ThreadDetailProps = {}) {
  const router = useRouter()
  const { user, signOut, isInitialized } = useAuthContext()
  const { 
    currentThread, 
    updateThread,
    lastSaved: threadLastSaved,
    isLoading: isThreadLoading,
    isUpdating,
  } = useThreads()
  
  // Local state for AI features
  const [showAiSuccessBanner, setShowAiSuccessBanner] = useState(isAiGenerated)
  const [isAiResplitting, setIsAiResplitting] = useState(false)
  
  const {
    segments,
    activeSegmentId,
    suggestions,
    isSpellCheckLoading,
    isGrammarCheckLoading,
    isSaving,
    dictionaryStatus,
    isEditingTitle,
    updateSegmentContent,
    addSegment,
    removeSegment,
    setActiveSegment,
    applySuggestion,
    applySuggestions,
    fixAllSuggestions,
    setEditingTitle,
    initializeEditor,
    saveImmediately,
    runSpellCheck,
  } = useEditor()

  // Initialize editor when component mounts or threadId changes
  useEffect(() => {
    initializeEditor(threadId || undefined)
  }, [threadId, initializeEditor])

  // Auto-hide AI success banner after 10 seconds
  useEffect(() => {
    if (showAiSuccessBanner) {
      const timer = setTimeout(() => {
        setShowAiSuccessBanner(false)
      }, 10000) // Hide after 10 seconds

      return () => clearTimeout(timer)
    }
  }, [showAiSuccessBanner])

  const threadTitle = currentThread?.title || "Untitled Thread"

  const handleTitleChange = useCallback(
    (newTitle: string) => {
      if (currentThread?.id) {
        updateThread(currentThread.id, { title: newTitle })
      }
    },
    [currentThread?.id, updateThread]
  )

  // Handle status changes
  const handleStatusChange = useCallback(
    async (newStatus: "draft" | "published" | "archived") => {
      if (!currentThread?.id) return

      // Save current state first
      await saveImmediately()

      // Update status
      const updateData: Partial<Thread> = {
        status: newStatus,
      }

      // Set published_at when marking as published
      if (newStatus === "published") {
        updateData.published_at = new Date().toISOString()
      }

      await updateThread(currentThread.id, updateData)
    },
    [currentThread?.id, saveImmediately, updateThread]
  )

  // Handle word added to dictionary - re-check segments containing that word
  const handleWordAddedToDictionary = useCallback(
    (word: string) => {
      // Find segments that contain the word (case insensitive)
      const segmentsToRecheck = segments.filter(segment =>
        segment.content.toLowerCase().includes(word.toLowerCase())
      )
      
      if (segmentsToRecheck.length > 0) {
        // Re-run spell check for these segments
        runSpellCheck(segmentsToRecheck)
      }
    },
    [segments, runSpellCheck]
  )

  // Handle AI re-split functionality
  const handleAiResplit = useCallback(async () => {
    if (!currentThread?.id || !currentThread?.title) return

    setIsAiResplitting(true)

    try {
      // Combine all current segments into long text
      const longText = segments.map(segment => segment.content).join(' ')
      
      if (!longText.trim()) {
        throw new Error('No content to re-split')
      }

      // Call AI to split the content
      const aiResponse = await splitTextToThreads({
        text: longText.trim(),
        title: currentThread.title,
        tone: 'informative',
        targetTweetCount: segments.length, // Use current segment count as target
      })

      if (!aiResponse.success || !aiResponse.data) {
        throw new Error(aiResponse.error || 'AI splitting failed')
      }

      // Clear existing segments (this should be done via the editor store)
      // For now, we'll create new segments and the user can manually remove old ones
      const segmentsToCreate = aiResponse.data.segments.map(segment => ({
        content: segment.content,
        index: segments.length + segment.order - 1, // Add after existing segments
      }))

      const createdSegments = await createBulkSegments(currentThread.id, segmentsToCreate)
      
      if (createdSegments.length === 0) {
        throw new Error('Failed to create new segments')
      }

      // Update thread stats
      const totalCharacters = [...segments, ...createdSegments].reduce((sum, seg) => sum + seg.charCount, 0)
      await updateThread(currentThread.id, {
        total_characters: totalCharacters,
        total_tweets: segments.length + createdSegments.length,
      })

      // Reload the editor to show new segments
      await initializeEditor(currentThread.id)
      
      setShowAiSuccessBanner(true)

    } catch (error) {
      console.error('AI re-split failed:', error)
      // The error will be shown via the threads store error state
    } finally {
      setIsAiResplitting(false)
    }
  }, [currentThread, segments, initializeEditor, updateThread])

  // Calculate totals
  const totalCharacters = segments.reduce((sum, segment) => sum + segment.charCount, 0)
  const spellingSuggestions = suggestions.filter((s) => s.type === "spelling")
  const grammarSuggestions = suggestions.filter((s) => s.type === "grammar")
  const totalSuggestions = suggestions.length

  // Prioritize loading states - show only the most important one at a time
  const primaryLoadingState = isSaving || isUpdating || isSpellCheckLoading || isGrammarCheckLoading

  // Show loading spinner while checking auth or loading thread
  if (!isInitialized || isThreadLoading) {
    return <PageLoading variant="branded" />
  }

  // Show loading spinner if we have a threadId but no currentThread yet (prevents flash of empty content)
  // This covers the case where we're transitioning between threads or the thread hasn't loaded yet
  if (threadId && !currentThread) {
    return <PageLoading variant="branded" />
  }

  return (
    <div>
      <ThreadHeader
          threadTitle={threadTitle}
          currentThread={currentThread}
          isEditingTitle={isEditingTitle}
          primaryLoadingState={primaryLoadingState}
          isSaving={isSaving}
          isUpdating={isUpdating}
          isSpellCheckLoading={isSpellCheckLoading}
          isGrammarCheckLoading={isGrammarCheckLoading}
          threadLastSaved={threadLastSaved}
          onTitleChange={handleTitleChange}
          onStatusChange={handleStatusChange}
          onSetEditingTitle={setEditingTitle}
        />
      <div className="flex min-h-screen">
        <ThreadContent
          segments={segments}
          totalCharacters={totalCharacters}
          isAiGenerated={isAiGenerated}
          showAiSuccessBanner={showAiSuccessBanner}
          primaryLoadingState={primaryLoadingState}
          dictionaryStatus={dictionaryStatus}
          handleAiResplit={handleAiResplit}
          isAiResplitting={isAiResplitting}
          setShowAiSuccessBanner={setShowAiSuccessBanner}
          activeSegmentId={activeSegmentId}
          updateSegmentContent={updateSegmentContent}
          setActiveSegment={setActiveSegment}
          removeSegment={removeSegment}
          addSegment={addSegment}
          suggestions={suggestions}
          applySuggestion={applySuggestion}
          applySuggestions={applySuggestions}
          handleWordAddedToDictionary={handleWordAddedToDictionary}
          totalSuggestions={totalSuggestions}
          spellingSuggestions={spellingSuggestions}
          grammarSuggestions={grammarSuggestions}
        />
        <ThreadSidebar
          segments={segments}
          totalCharacters={totalCharacters}
          totalSuggestions={totalSuggestions}
          spellingSuggestions={spellingSuggestions}
          grammarSuggestions={grammarSuggestions}
          currentThread={currentThread}
          isAiGenerated={isAiGenerated}
          showAiSuccessBanner={showAiSuccessBanner}
        />
      </div>
    </div>
  )
} 