"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Loader2,
  ArrowLeft,
  Edit2,
  CheckCircle,
  ChevronDown,
  Archive,
  FileText,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import type { Thread } from "@/types/store"

interface ThreadHeaderProps {
  threadTitle: string
  currentThread: Thread | null
  onBackToThreads?: () => void
  onBackToLanding?: () => void
  isEditingTitle: boolean
  primaryLoadingState: boolean
  isSaving: boolean
  isUpdating: boolean
  isSpellCheckLoading: boolean
  isGrammarCheckLoading: boolean
  threadLastSaved: Date | null
  onTitleChange: (newTitle: string) => void
  onStatusChange: (newStatus: "draft" | "published" | "archived") => void
  onSetEditingTitle: (editing: boolean) => void
}

export function ThreadHeader({
  threadTitle,
  currentThread,
  onBackToThreads,
  onBackToLanding,
  isEditingTitle,
  primaryLoadingState,
  isSaving,
  isUpdating,
  isSpellCheckLoading,
  isGrammarCheckLoading,
  threadLastSaved,
  onTitleChange,
  onStatusChange,
  onSetEditingTitle,
}: ThreadHeaderProps) {
  const [editingTitleValue, setEditingTitleValue] = useState("")

  const handleTitleSubmit = () => {
    onSetEditingTitle(false)
    if (editingTitleValue.trim() && editingTitleValue !== threadTitle) {
      onTitleChange(editingTitleValue.trim())
    }
  }

  const handleTitleCancel = () => {
    onSetEditingTitle(false)
    setEditingTitleValue(threadTitle) // Reset to original value
  }

  const startEditing = () => {
    setEditingTitleValue(threadTitle)
    onSetEditingTitle(true)
  }

  return (
    <div className="w-screen flex items-center justify-between mb-4 px-6 -ml-[50vw] left-1/2 relative pt-4 pb-4 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm top-0 z-10">
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
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleTitleSubmit()
                }
                if (e.key === "Escape") {
                  handleTitleCancel()
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
                onClick={startEditing}
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
            <DropdownMenuItem onClick={() => onStatusChange("draft")}>
              <FileText className="h-4 w-4 mr-2" />
              Draft
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStatusChange("published")}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Published
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStatusChange("archived")}>
              <Archive className="h-4 w-4 mr-2" />
              Archived
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
} 