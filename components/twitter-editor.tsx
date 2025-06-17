"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TweetSegmentComponent } from "./tweet-segment"
import type { TweetSegment, EditorState } from "@/types/editor"
import { checkSpelling, countCharacters, getSpellCheckStatus, preloadDictionary } from "@/utils/spellcheck"
import { checkGrammar } from "@/utils/grammar"
import { useDebounce } from "@/hooks/use-debounce"
import {
  Wand2,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Edit2,
  CheckCircle,
  Feather,
  ChevronDown,
  Archive,
  FileText,
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import {
  getThread,
  createThread,
  updateThread,
  updateSegment,
  createSegment,
  deleteSegment,
  type ThreadWithSegments,
} from "@/lib/database"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface TwitterEditorProps {
  threadId?: string | null
  onBackToThreads?: () => void
  onBackToLanding?: () => void
}

export function TwitterEditor({ threadId, onBackToThreads, onBackToLanding }: TwitterEditorProps = {}) {
  const { user, signOut, loading } = useAuth()
  const [currentThread, setCurrentThread] = useState<ThreadWithSegments | null>(null)
  const [threadTitle, setThreadTitle] = useState("")
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isLoadingThread, setIsLoadingThread] = useState(false)

  const [editorState, setEditorState] = useState<EditorState>({
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
  })

  const [isSpellCheckLoading, setIsSpellCheckLoading] = useState(false)
  const [dictionaryStatus, setDictionaryStatus] = useState({ isInitialized: false, isLoading: false })
  const spellCheckAbortController = useRef<AbortController | null>(null)

  // Load thread data if threadId is provided
  useEffect(() => {
    // console.log("useEffect: threadId", threadId)
    if (threadId) {
      loadThread(threadId)
    } else {
      // Reset to default state for new thread
      setCurrentThread(null)
      setThreadTitle("Untitled Thread")
      setEditorState({
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
      })
    }
  }, [threadId])

  const loadThread = async (id: string) => {
    console.log("loadThread", id)
    setIsLoadingThread(true)
    try {
      const thread = await getThread(id)
      if (thread) {
        setCurrentThread(thread)
        setThreadTitle(thread.title)

        if (thread.segments.length > 0) {
          setEditorState({
            segments: thread.segments,
            activeSegmentId: thread.segments[0].id,
            suggestions: [],
          })
        }
      }
    } catch (error) {
      console.error("Failed to load thread:", error)
    } finally {
      setIsLoadingThread(false)
    }
  }

  useEffect(() => {
    console.log("useEffect: isLoadingThread", isLoadingThread)
    if (!isLoadingThread) {
      // Give a small delay to ensure UI is ready
      //  hack: cursor broke this twice!
      setTimeout(() => {
        runAllChecks(editorState.segments)
      }, 100)
    }
  }, [isLoadingThread])

  // Auto-save functionality
  const debouncedSave = useDebounce(async (segments: TweetSegment[], title: string) => {
    if (!user) return

    setIsSaving(true)

    try {
      let threadToUpdate = currentThread

      // Create thread if it doesn't exist
      if (!threadToUpdate) {
        const newThread = await createThread(title || "Untitled Thread")
        if (newThread) {
          threadToUpdate = { ...newThread, segments: [] }
          setCurrentThread(threadToUpdate)
        } else {
          return
        }
      } else if (threadToUpdate.title !== title) {
        // Update thread title if changed
        await updateThread(threadToUpdate.id, { title })
        setCurrentThread({ ...threadToUpdate, title })
      }

      // Update segments and track changes
      const updatedSegments = [...segments]
      let hasChanges = false

      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i]
        if (segment.id.startsWith("temp-")) {
          // Create new segment and get the real ID
          const newSegment = await createSegment(threadToUpdate.id, segment.content, segment.index)
          if (newSegment) {
            updatedSegments[i] = newSegment
            hasChanges = true
          }
        } else {
          // Update existing segment
          await updateSegment(segment.id, segment.content)
        }
      }

      // Update the editor state with real IDs if we have changes
      if (hasChanges) {
        setEditorState((prev) => ({
          ...prev,
          segments: updatedSegments,
        }))
      }

      setLastSaved(new Date())
    } catch (error) {
      console.error("Auto-save failed:", error)
    } finally {
      setIsSaving(false)
    }
  }, 2000)

  // Save only a single segment (much more efficient)
  const debouncedSaveSingle = useDebounce(async (segmentId: string, content: string, threadTitle: string) => {
    if (!user) return

    console.log("debouncedSaveSingle", segmentId, content.substring(0, 20) + "...")

    try {
      let threadToUpdate = currentThread

      // Create thread if it doesn't exist
      if (!threadToUpdate) {
        const newThread = await createThread(threadTitle || "Untitled Thread")
        if (newThread) {
          threadToUpdate = { ...newThread, segments: [] }
          setCurrentThread(threadToUpdate)
        } else {
          return
        }
      }

      // Update title if changed
      if (threadToUpdate.title !== threadTitle) {
        await updateThread(threadToUpdate.id, { title: threadTitle })
        setCurrentThread({ ...threadToUpdate, title: threadTitle })
      }

      // Save only the specific segment
      if (segmentId.startsWith("temp-")) {
        // Find the segment to get its index
        const segment = editorState.segments.find(s => s.id === segmentId)
        if (segment) {
          // Create new segment and get the real ID
          const newSegment = await createSegment(threadToUpdate.id, content, segment.index)
          if (newSegment) {
            // Update the editor state with the real ID
            setEditorState((prev) => ({
              ...prev,
              segments: prev.segments.map(s => 
                s.id === segmentId ? newSegment : s
              ),
            }))
          }
        }
      } else {
        // Update existing segment
        await updateSegment(segmentId, content)
      }

      setLastSaved(new Date())
    } catch (error) {
      console.error("Single segment save failed:", error)
    }
  }, 2000)

  // Preload dictionary on component mount
  useEffect(() => {
    const loadDictionary = async () => {
      try {
        await preloadDictionary()
        setDictionaryStatus(getSpellCheckStatus())
      } catch (error) {
        console.error("Failed to preload dictionary:", error)
      }
    }

    loadDictionary()

    const statusInterval = setInterval(() => {
      const status = getSpellCheckStatus()
      setDictionaryStatus(status)

      if (status.isInitialized || (!status.isLoading && !status.isInitialized)) {
        clearInterval(statusInterval)
      }
    }, 500)

    return () => clearInterval(statusInterval)
  }, [])

  const runAllChecks = useCallback(
    async (segments: TweetSegment[]) => {

      console.log("runAllChecks", segments)

      if (spellCheckAbortController.current) {
        spellCheckAbortController.current.abort()
      }

      spellCheckAbortController.current = new AbortController()
      const currentController = spellCheckAbortController.current

      setIsSpellCheckLoading(true)

      try {
        const allChecks = await Promise.all(
          segments.map(async (segment) => {
            const [spellingSuggestions, grammarSuggestions] = await Promise.all([
              dictionaryStatus.isInitialized ? checkSpelling(segment.content, segment.id) : Promise.resolve([]),
              checkGrammar(segment.content, segment.id),
            ])

            return [...spellingSuggestions, ...grammarSuggestions]
          }),
        )

        if (currentController.signal.aborted) {
          return
        }

        const flatSuggestions = allChecks.flat()

        setEditorState((prev) => ({
          ...prev,
          suggestions: flatSuggestions,
        }))
      } catch (error) {
        if (!currentController.signal.aborted) {
          console.error("Check error:", error)
        }
      } finally {
        if (!currentController.signal.aborted) {
          setIsSpellCheckLoading(false)
        }
      }
    },
    [dictionaryStatus.isInitialized],
  )

  // Check only a single segment (much more efficient)
  const runSingleSegmentCheck = useCallback(
    async (segment: TweetSegment) => {

      if (spellCheckAbortController.current) {
        spellCheckAbortController.current.abort()
      }

      spellCheckAbortController.current = new AbortController()
      const currentController = spellCheckAbortController.current

      setIsSpellCheckLoading(true)

      try {
        const [spellingSuggestions, grammarSuggestions] = await Promise.all([
          dictionaryStatus.isInitialized ? checkSpelling(segment.content, segment.id) : Promise.resolve([]),
          checkGrammar(segment.content, segment.id),
        ])

        if (currentController.signal.aborted) {
          return
        }

        const newSuggestions = [...spellingSuggestions, ...grammarSuggestions]

        // Update suggestions by removing old ones for this segment and adding new ones
        setEditorState((prev) => ({
          ...prev,
          suggestions: [
            ...prev.suggestions.filter(s => s.segmentId !== segment.id),
            ...newSuggestions
          ],
        }))
      } catch (error) {
        if (!currentController.signal.aborted) {
          console.error("Single segment check error:", error)
        }
      } finally {
        if (!currentController.signal.aborted) {
          setIsSpellCheckLoading(false)
        }
      }
    },
    [dictionaryStatus.isInitialized],
  )

  const debouncedCheck = useDebounce(runAllChecks, 800)
  const debouncedSingleCheck = useDebounce(runSingleSegmentCheck, 800)

  const updateSegmentContent = useCallback(
    (id: string, content: string) => {
      
      const newSegments = editorState.segments.map((segment) =>
        segment.id === id ? { ...segment, content, charCount: countCharacters(content) } : segment,
      )

      console.log("updateSegmentContent", id, ":", content.substring(0, 20) + "...")

      setEditorState((prev) => ({
        ...prev,
        segments: newSegments,
      }))

      // Only check and save the specific segment that changed (much more efficient!)
      const changedSegment = newSegments.find(s => s.id === id)
      if (changedSegment) {
        debouncedSingleCheck(changedSegment)
        debouncedSaveSingle(id, content, threadTitle)
      }
    },
    [editorState.segments, debouncedSingleCheck, debouncedSaveSingle, threadTitle],
  )

  // Add immediate save function
  const saveImmediately = useCallback(
    async (segments: TweetSegment[], title: string) => {
      console.log("saveImmediately");
      if (!user) return

      setIsSaving(true)

      try {
        let threadToUpdate = currentThread

        // Create thread if it doesn't exist
        if (!threadToUpdate) {
          const newThread = await createThread(title || "Untitled Thread")
          if (newThread) {
            threadToUpdate = { ...newThread, segments: [] }
            setCurrentThread(threadToUpdate)
          } else {
            return
          }
        } else if (threadToUpdate.title !== title) {
          // Update thread title if changed
          await updateThread(threadToUpdate.id, { title })
          setCurrentThread({ ...threadToUpdate, title })
        }

        // Update segments and track changes
        const updatedSegments = [...segments]
        let hasChanges = false

        for (let i = 0; i < segments.length; i++) {
          const segment = segments[i]
          if (segment.id.startsWith("temp-")) {
            // Create new segment and get the real ID
            const newSegment = await createSegment(threadToUpdate.id, segment.content, segment.index)
            if (newSegment) {
              updatedSegments[i] = newSegment
              hasChanges = true
            }
          } else {
            // Update existing segment
            await updateSegment(segment.id, segment.content)
          }
        }

        // Update the editor state with real IDs if we have changes
        if (hasChanges) {
          setEditorState((prev) => ({
            ...prev,
            segments: updatedSegments,
          }))
        }

        setLastSaved(new Date())
      } catch (error) {
        console.error("Save failed:", error)
      } finally {
        setIsSaving(false)
      }
    },
    [user, currentThread],
  )

  // Update title change handler to save immediately on blur
  const handleTitleChange = useCallback(
    (newTitle: string) => {
      setThreadTitle(newTitle)
      // Save immediately when title changes (on blur)
      saveImmediately(editorState.segments, newTitle)
    },
    [editorState.segments, saveImmediately],
  )

  const setActiveSegment = useCallback((id: string) => {
    setEditorState((prev) => ({ ...prev, activeSegmentId: id }))
  }, [])

  const addSegment = useCallback(
    (afterId: string) => {
      setEditorState((prev) => {
        const afterIndex = prev.segments.findIndex((s) => s.id === afterId)
        const newSegment: TweetSegment = {
          id: `temp-segment-${Date.now()}`,
          content: "",
          charCount: 0,
          index: afterIndex + 1,
        }

        const newSegments = [
          ...prev.segments.slice(0, afterIndex + 1),
          newSegment,
          ...prev.segments.slice(afterIndex + 1).map((s) => ({ ...s, index: s.index + 1 })),
        ]

        debouncedSave(newSegments, threadTitle)

        return {
          ...prev,
          segments: newSegments,
          activeSegmentId: newSegment.id,
        }
      })
    },
    [debouncedSave, threadTitle],
  )

  const deleteSegmentHandler = useCallback(
    async (id: string) => {
      if (editorState.segments.length <= 1) return

      // Delete from database if it's not a temp segment
      if (!id.startsWith("temp-") && currentThread) {
        await deleteSegment(id)
      }

      setEditorState((prev) => {
        const newSegments = prev.segments.filter((s) => s.id !== id).map((s, index) => ({ ...s, index }))
        const newActiveId = newSegments[0]?.id || ""

        debouncedSave(newSegments, threadTitle)

        return {
          ...prev,
          segments: newSegments,
          activeSegmentId: newActiveId,
          suggestions: prev.suggestions.filter((s) => s.segmentId !== id),
        }
      })
    },
    [editorState.segments, currentThread, debouncedSave, threadTitle],
  )

  const applySuggestion = useCallback(
    (suggestionId: string, replacement: string) => {
      const suggestion = editorState.suggestions.find((s) => s.id === suggestionId)
      if (!suggestion) return

      const segment = editorState.segments.find((s) => s.id === suggestion.segmentId)
      if (!segment) return

      const newContent =
        segment.content.substring(0, suggestion.start) + replacement + segment.content.substring(suggestion.end)

      updateSegmentContent(suggestion.segmentId, newContent)
    },
    [editorState.suggestions, editorState.segments, updateSegmentContent],
  )

  const fixAllSuggestions = useCallback(async () => {
    const updatedSegments = [...editorState.segments]

    const sortedSuggestions = [...editorState.suggestions].sort((a, b) => b.start - a.start)

    sortedSuggestions.forEach((suggestion) => {
      const segmentIndex = updatedSegments.findIndex((s) => s.id === suggestion.segmentId)
      if (segmentIndex === -1 || suggestion.suggestions.length === 0) return

      const segment = updatedSegments[segmentIndex]
      const bestSuggestion = suggestion.suggestions[0]

      if (bestSuggestion === "" || bestSuggestion.startsWith("[")) return

      const newContent =
        segment.content.substring(0, suggestion.start) + bestSuggestion + segment.content.substring(suggestion.end)

      updatedSegments[segmentIndex] = {
        ...segment,
        content: newContent,
        charCount: countCharacters(newContent),
      }
    })

    setEditorState((prev) => ({
      ...prev,
      segments: updatedSegments,
    }))

    await runAllChecks(updatedSegments)
    debouncedSave(updatedSegments, threadTitle)
  }, [editorState.segments, editorState.suggestions, runAllChecks, debouncedSave, threadTitle])

  useEffect(() => {
    return () => {
      if (spellCheckAbortController.current) {
        spellCheckAbortController.current.abort()
      }
      ;(debouncedCheck as any).cancel?.()
      ;(debouncedSave as any).cancel?.()
      ;(debouncedSingleCheck as any).cancel?.()
      ;(debouncedSaveSingle as any).cancel?.()
    }
  }, [debouncedCheck, debouncedSave, debouncedSingleCheck, debouncedSaveSingle])

  const totalCharacters = editorState.segments.reduce((sum, segment) => sum + segment.charCount, 0)
  const spellingSuggestions = editorState.suggestions.filter((s) => s.type === "spelling")
  const grammarSuggestions = editorState.suggestions.filter((s) => s.type === "grammar")
  const totalSuggestions = editorState.suggestions.length

  const handleStatusChange = async (newStatus: "draft" | "published" | "archived") => {
    if (!user) return

    console.log("handleStatusChange", newStatus)

    setIsSaving(true)

    try {
      let threadToUpdate = currentThread

      // Create thread if it doesn't exist
      if (!threadToUpdate) {
        const newThread = await createThread(threadTitle || "Untitled Thread")
        if (newThread) {
          threadToUpdate = { ...newThread, segments: [] }
          setCurrentThread(threadToUpdate)
        } else {
          return
        }
      }

      // Save all segments first and track changes
      const updatedSegments = [...editorState.segments]
      let hasChanges = false

      for (let i = 0; i < editorState.segments.length; i++) {
        const segment = editorState.segments[i]
        if (segment.id.startsWith("temp-")) {
          // Create new segment and get the real ID
          const newSegment = await createSegment(threadToUpdate.id, segment.content, segment.index)
          if (newSegment) {
            updatedSegments[i] = newSegment
            hasChanges = true
          }
        } else {
          // Update existing segment
          await updateSegment(segment.id, segment.content)
        }
      }

      // Update the editor state with real IDs if we have changes
      if (hasChanges) {
        setEditorState((prev) => ({
          ...prev,
          segments: updatedSegments,
        }))
      }

      // Update status
      const updateData: any = {
        title: threadTitle,
        status: newStatus,
      }

      // Set published_at when marking as published
      if (newStatus === "published") {
        updateData.published_at = new Date().toISOString()
      }

      await updateThread(threadToUpdate.id, updateData)

      setCurrentThread({
        ...threadToUpdate,
        title: threadTitle,
        status: newStatus,
        ...(newStatus === "published" && { published_at: new Date().toISOString() }),
      })
      setLastSaved(new Date())
    } catch (error) {
      console.error("Status change failed:", error)
    } finally {
      setIsSaving(false)
    }
  }

  // Show loading spinner while loading thread
  if (isLoadingThread) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="bg-blue-600 p-3 rounded-lg mb-4 mx-auto w-fit">
            <Feather className="h-8 w-8 text-white animate-spin" />
          </div>
          <p className="text-gray-600">Loading thread...</p>
        </div>
      </main>
    )
  }

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="bg-blue-600 p-3 rounded-lg mb-4 mx-auto w-fit">
            <Feather className="h-8 w-8 text-white animate-spin" />
          </div>
          <p className="text-gray-600">Loading thread...</p>
        </div>
      </main>
    )
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
                  onChange={(e) => setThreadTitle(e.target.value)}
                  onBlur={() => {
                    setIsEditingTitle(false)
                    handleTitleChange(threadTitle)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setIsEditingTitle(false)
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
                    onClick={() => setIsEditingTitle(true)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>


          <div className="flex items-center gap-2">
            {lastSaved && !isSaving && (
              <span className="text-gray-400 text-xs">Auto-saved {lastSaved.toLocaleTimeString()}</span>
            )}
            {isSaving && (
              <span className="text-gray-400 text-xs">Saving ...</span>
            )}
            {/* {totalSuggestions > 0 && (
              <Button
                variant="outline"
                onClick={fixAllSuggestions}
                className="text-purple-600 border-purple-200 hover:bg-purple-50"
                disabled={isSpellCheckLoading}
              >
                {isSpellCheckLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Wand2 className="h-4 w-4 mr-2" />
                )}
                Fix All ({totalSuggestions})
              </Button>
            )} */}
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
                  disabled={isSaving}
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
            {editorState.segments.length} tweet{editorState.segments.length !== 1 ? "s" : ""} • {totalCharacters}{" "}
            characters total
          </span>

          {dictionaryStatus.isLoading && (
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

          {/* {dictionaryStatus.isInitialized && !isSpellCheckLoading && (
            <div className="flex items-center gap-1 text-green-600">
              <span className="text-xs">✓ Grammar & spell check ready</span>
            </div>
          )}

          {isSpellCheckLoading && (
            <div className="flex items-center gap-1 text-blue-600">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span className="text-xs">Checking writing...</span>
            </div>
          )} */}
        </div>
      </div>

      <div className="space-y-4">
        {editorState.segments.map((segment) => (
          <TweetSegmentComponent
            key={segment.id}
            segment={segment}
            isActive={segment.id === editorState.activeSegmentId}
            onContentChange={updateSegmentContent}
            onFocus={setActiveSegment}
            onDelete={deleteSegmentHandler}
            onAddSegment={addSegment}
            suggestions={editorState.suggestions}
            onSuggestionApply={applySuggestion}
            isSpellCheckLoading={isSpellCheckLoading}
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
