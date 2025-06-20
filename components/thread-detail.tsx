"use client"

import { useCallback, useEffect } from "react"
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
} from "lucide-react"
import { useAuth, useEditor, useThreads } from "@/store"
import type { Thread } from "@/types/store"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { PageLoading } from "@/components/ui/loading-spinner"

interface ThreadDetailProps {
  threadId?: string | null
  onBackToThreads?: () => void
  onBackToLanding?: () => void
}

export function ThreadDetail({ threadId, onBackToThreads, onBackToLanding }: ThreadDetailProps = {}) {
  const { user, signOut, isInitialized } = useAuth()
  const { 
    currentThread, 
    updateThread,
    lastSaved: threadLastSaved,
    isLoading: isThreadLoading,
    isUpdating,
  } = useThreads()
  
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
    fixAllSuggestions,
    setEditingTitle,
    initializeEditor,
    saveImmediately,
  } = useEditor()

  // Initialize editor when component mounts or threadId changes
  useEffect(() => {
    initializeEditor(threadId || undefined)
  }, [threadId, initializeEditor])

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
                  value={threadTitle}
                  onChange={() => {}} // Title is handled by the store
                  onBlur={() => {
                    setEditingTitle(false)
                    handleTitleChange(threadTitle)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setEditingTitle(false)
                      handleTitleChange(threadTitle)
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
                    onClick={() => setEditingTitle(true)}
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
            {totalSuggestions > 0 && (
              <Button
                variant="outline"
                onClick={fixAllSuggestions}
                className="text-purple-600 border-purple-200 hover:bg-purple-50"
                disabled={primaryLoadingState}
              >
                {primaryLoadingState && (isSpellCheckLoading || isGrammarCheckLoading) ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Wand2 className="h-4 w-4 mr-2" />
                )}
                Fix All ({totalSuggestions})
              </Button>
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