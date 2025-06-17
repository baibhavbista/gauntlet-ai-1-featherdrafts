"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CharacterCounter } from "./character-counter"
import type { TweetSegment, Suggestion } from "@/types/editor"
import { cn } from "@/lib/utils"
import { X, Plus, AlertCircle, BookOpen } from "lucide-react"

interface TweetSegmentProps {
  segment: TweetSegment
  isActive: boolean
  onContentChange: (id: string, content: string) => void
  onFocus: (id: string) => void
  onDelete: (id: string) => void
  onAddSegment: (afterId: string) => void
  suggestions: Suggestion[]
  onSuggestionApply: (suggestionId: string, replacement: string) => void
  isSpellCheckLoading?: boolean
}

export function TweetSegmentComponent({
  segment,
  isActive,
  onContentChange,
  onFocus,
  onDelete,
  onAddSegment,
  suggestions,
  onSuggestionApply,
  isSpellCheckLoading = false,
}: TweetSegmentProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [localContent, setLocalContent] = useState(segment.content)

  useEffect(() => {
    setLocalContent(segment.content)
  }, [segment.content])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px"
    }
  }, [localContent])

  const handleContentChange = (value: string) => {
    setLocalContent(value)
    onContentChange(segment.id, value)
  }

  const segmentSuggestions = suggestions.filter((s) => s.segmentId === segment.id)
  const spellingSuggestions = segmentSuggestions.filter((s) => s.type === "spelling")
  const grammarSuggestions = segmentSuggestions.filter((s) => s.type === "grammar")

  return (
    <Card
      className={cn("transition-all duration-200", isActive ? "ring-2 ring-blue-500 shadow-md" : "hover:shadow-sm")}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-500">Tweet {segment.index + 1}</span>
            {segment.index > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(segment.id)}
                className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          <CharacterCounter count={segment.charCount} />
        </div>

        <div className="relative">
          <textarea
            ref={textareaRef}
            value={localContent}
            onChange={(e) => handleContentChange(e.target.value)}
            onFocus={() => onFocus(segment.id)}
            onBlur={() => {
              // Trigger immediate save when user stops editing
              if (onContentChange) {
                onContentChange(segment.id, localContent)
              }
            }}
            placeholder={segment.index === 0 ? "What's happening?" : "Continue your thread..."}
            className={cn(
              "w-full resize-none border-none outline-none text-lg leading-relaxed",
              "placeholder:text-gray-400 min-h-[100px]",
              segment.charCount > 280 ? "text-red-500" : "",
            )}
            style={{ overflow: "hidden" }}
          />

          {/* Overlay for highlighting errors */}
          {segmentSuggestions.length > 0 && (
            <div className="absolute inset-0 pointer-events-none text-lg leading-relaxed whitespace-pre-wrap break-words">
              {localContent.split("").map((char, index) => {
                const isInSpellingError = spellingSuggestions.some(
                  (suggestion) => index >= suggestion.start && index < suggestion.end,
                )
                const isInGrammarError = grammarSuggestions.some(
                  (suggestion) => index >= suggestion.start && index < suggestion.end,
                )

                let className = "text-transparent"

                if (isInSpellingError) {
                  // Red underline for spelling errors (Grammarly style)
                  className = "bg-red-50 text-red-600 underline decoration-wavy decoration-red-400"
                } else if (isInGrammarError) {
                  // Blue underline for grammar errors (Grammarly style)
                  className = "bg-blue-50 text-blue-600 underline decoration-wavy decoration-blue-400"
                }

                return (
                  <span key={index} className={className}>
                    {char}
                  </span>
                )
              })}
            </div>
          )}

          {/* Spelling suggestions */}
          {spellingSuggestions.length > 0 && (
            <div className="mt-3 space-y-2">
              <div className="text-xs font-medium text-red-600 mb-2 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {spellingSuggestions.length} spelling issue{spellingSuggestions.length !== 1 ? "s" : ""} found:
              </div>
              {spellingSuggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className="flex items-center gap-2 text-sm bg-red-50 p-2 rounded border-l-2 border-red-200"
                >
                  <span className="font-medium text-red-700">"{suggestion.word}"</span>
                  <span className="text-gray-400">→</span>
                  <div className="flex gap-1 flex-wrap">
                    {suggestion.suggestions.length === 0 && (
                      <span className="text-gray-400">Unknown</span>
                    )}
                    {suggestion.suggestions.map((replacement, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs border-red-200 text-red-700 hover:bg-red-100"
                        onClick={() => onSuggestionApply(suggestion.id, replacement)}
                      >
                        {replacement}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Grammar suggestions */}
          {grammarSuggestions.length > 0 && (
            <div className="mt-3 space-y-2">
              <div className="text-xs font-medium text-blue-600 mb-2 flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                {grammarSuggestions.length} grammar suggestion{grammarSuggestions.length !== 1 ? "s" : ""} found:
              </div>
              {grammarSuggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className="flex flex-col gap-2 text-sm bg-blue-50 p-3 rounded border-l-2 border-blue-200"
                >
                  <div className="flex items-start gap-2">
                    <span className="font-medium text-blue-700">"{suggestion.text}"</span>
                    <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">{suggestion.reason}</span>
                  </div>
                  {suggestion.suggestions.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 text-xs">Suggestions:</span>
                      <div className="flex gap-1 flex-wrap">
                        {suggestion.suggestions.map((replacement, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs border-blue-200 text-blue-700 hover:bg-blue-100"
                            onClick={() => onSuggestionApply(suggestion.id, replacement)}
                          >
                            {replacement === ""
                              ? "Remove"
                              : replacement === "[consider rephrasing]"
                                ? "Rephrase"
                                : replacement}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end mt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAddSegment(segment.id)}
            className="text-blue-500 hover:text-blue-600"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add tweet
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
