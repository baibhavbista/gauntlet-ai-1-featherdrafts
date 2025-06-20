"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TweetSegmentComponent } from "./tweet-segment"
import {
  Wand2,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Edit2,
  CheckCircle,
  ChevronDown,
  Archive,
  FileText,
  Sparkles,
  X,
  RefreshCw,
} from "lucide-react"
import { useAuth, useEditor, useThreads } from "@/store"
import type { Thread } from "@/types/store"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { PageLoading } from "@/components/ui/loading-spinner"
import { splitTextToThreads } from "@/lib/ai"
import { createBulkSegments } from "@/lib/database"

interface ThreadDetailProps {
  threadId?: string | null
  isAiGenerated?: boolean
  onBackToThreads?: () => void
  onBackToLanding?: () => void
}

export function ThreadDetail({ threadId, isAiGenerated = false, onBackToThreads, onBackToLanding }: ThreadDetailProps = {}) {
  const { user, signOut, isInitialized } = useAuth()
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
  const [editingTitleValue, setEditingTitleValue] = useState("")
  
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
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4 flex-1">
            {onBackToThreads && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBackToThreads}
                className="text-gray-600 hover:text-gray-900"
                title="Back to Threads"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            {onBackToLanding && !onBackToThreads && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBackToLanding}
                className="text-gray-600 hover:text-gray-900"
                title="Back to Home"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}

            <div className="flex-1">
              {isEditingTitle ? (
                <Input
                  value={editingTitleValue}
                  onChange={(e) => setEditingTitleValue(e.target.value)}
                  onBlur={() => {
                    setEditingTitle(false)
                    if (editingTitleValue.trim() && editingTitleValue !== threadTitle) {
                      handleTitleChange(editingTitleValue.trim())
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setEditingTitle(false)
                      if (editingTitleValue.trim() && editingTitleValue !== threadTitle) {
                        handleTitleChange(editingTitleValue.trim())
                      }
                    }
                    if (e.key === "Escape") {
                      setEditingTitle(false)
                      setEditingTitleValue(threadTitle) // Reset to original value
                    }
                  }}
                  className="text-2xl font-bold border-none p-0 h-auto focus-visible:ring-0"
                  autoFocus
                />
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">{threadTitle}</h1>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingTitleValue(threadTitle)
                      setEditingTitle(true)
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Show primary loading state with highest priority */}
            {primaryLoadingState ? (
              <span className="text-gray-400 text-xs flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                {isSaving && "Saving..."}
                {isUpdating && !isSaving && "Updating..."}
                {(isSpellCheckLoading || isGrammarCheckLoading) && !isSaving && !isUpdating && "Processing..."}
              </span>
            ) : (
              threadLastSaved && (
                <span className="text-gray-400 text-xs">Auto-saved {threadLastSaved.toLocaleTimeString()}</span>
              )
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "min-w-[120px]",
                    currentThread?.status === "published" && "bg-green-50 text-green-700 border-green-200",
                    currentThread?.status === "archived" && "bg-gray-50 text-gray-700 border-gray-200",
                    currentThread?.status === "draft" && "bg-blue-50 text-blue-700 border-blue-200",
                  )}
                  disabled={primaryLoadingState}
                >
                  {currentThread?.status === "published" && <CheckCircle className="h-4 w-4 mr-2" />}
                  {currentThread?.status === "archived" && <Archive className="h-4 w-4 mr-2" />}
                  {currentThread?.status === "draft" && <FileText className="h-4 w-4 mr-2" />}
                  {currentThread?.status
                    ? currentThread.status.charAt(0).toUpperCase() + currentThread.status.slice(1)
                    : "Draft"}
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleStatusChange("draft")}>
                  <FileText className="h-4 w-4 mr-2" />
                  Draft
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange("published")}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Published
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange("archived")}>
                  <Archive className="h-4 w-4 mr-2" />
                  Archived
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

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

      {totalSuggestions > 0 && (
        <div className="mt-6 p-4 bg-gradient-to-r from-red-50 to-blue-50 rounded-lg border">
          <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
            <Wand2 className="h-4 w-4" />
            Writing suggestions found
          </h3>
          <div className="flex items-center gap-4 text-sm">
            {spellingSuggestions.length > 0 && (
              <div className="flex items-center gap-1 text-red-600">
                <AlertCircle className="h-3 w-3" />
                <span>{spellingSuggestions.length} spelling</span>
              </div>
            )}
            {grammarSuggestions.length > 0 && (
              <div className="flex items-center gap-1 text-blue-600">
                <AlertCircle className="h-3 w-3" />
                <span>{grammarSuggestions.length} grammar</span>
              </div>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1">Click on highlighted text above to see suggestions.</p>
        </div>
      )}
    </div>
  )
} 