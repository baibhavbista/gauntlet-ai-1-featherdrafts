"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CharacterCounter } from "./character-counter"
import type { TweetSegment, Suggestion, SpellcheckSuggestion, GrammarSuggestion } from "@/types/editor"
import { cn } from "@/lib/utils"
import { X, Plus, AlertCircle, BookOpen } from "lucide-react"
import { AddToDictionaryButton } from "@/components/ui/add-to-dictionary-button"

type GroupedSpellingSuggestion = SpellcheckSuggestion & {
  occurrences: number
  allSuggestions: string[]
  allIds: string[]
}

interface TweetSegmentProps {
  segment: TweetSegment
  isActive: boolean
  onContentChange: (id: string, content: string) => void
  onFocus: (id: string) => void
  onDelete: (id: string) => void
  onAddSegment: (afterId: string) => void
  suggestions: Suggestion[]
  onSuggestionApply: (suggestionId: string, replacement: string) => void
  onSuggestionsApply: (suggestionIds: string[], replacement: string) => void
  onWordAddedToDictionary?: (word: string) => void
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
  onSuggestionsApply,
  onWordAddedToDictionary,
  isSpellCheckLoading = false,
}: TweetSegmentProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [localContent, setLocalContent] = useState(segment.content)
  const [showAllSpellingSuggestions, setShowAllSpellingSuggestions] = useState(false)

  // Only sync localContent with segment.content if they differ and we're not actively editing
  useEffect(() => {
    // Only update local content if it's different from the segment content
    // This prevents the infinite loop when the user is actively typing
    if (segment.content !== localContent && document.activeElement !== textareaRef.current) {
      setLocalContent(segment.content)
    }
  }, [segment.content, localContent])

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

  const handleGroupedSuggestionApply = (groupedSuggestion: GroupedSpellingSuggestion, replacement: string) => {
    // Apply the replacement to all occurrences of this word using batch operation
    if (groupedSuggestion.allIds.length === 1) {
      // Single occurrence - use regular apply
      onSuggestionApply(groupedSuggestion.allIds[0], replacement)
    } else {
      // Multiple occurrences - use batch apply to handle position shifts correctly
      onSuggestionsApply(groupedSuggestion.allIds, replacement)
    }
  }

  const segmentSuggestions = suggestions.filter((s) => s.segmentId === segment.id)
  const rawSpellingSuggestions = segmentSuggestions.filter((s) => s.type === "spelling")

  // Group spelling suggestions by word to deduplicate
  const spellingSuggestionsMap = rawSpellingSuggestions.reduce((acc, suggestion) => {
    const word = (suggestion as SpellcheckSuggestion).word
    if (!acc[word]) {
      acc[word] = {
        ...suggestion,
        occurrences: 1,
        allSuggestions: [...suggestion.suggestions],
        allIds: [suggestion.id]
      } as GroupedSpellingSuggestion
    } else {
      acc[word].occurrences += 1
      acc[word].allIds.push(suggestion.id)
      // Merge unique suggestions
      suggestion.suggestions.forEach(s => {
        if (!acc[word].allSuggestions.includes(s)) {
          acc[word].allSuggestions.push(s)
        }
      })
    }
    return acc
  }, {} as Record<string, GroupedSpellingSuggestion>)

  const spellingSuggestions = Object.values(spellingSuggestionsMap).sort((a, b) => {
    // First sort by number of occurrences (descending - most occurrences first)
    if (a.occurrences !== b.occurrences) {
      return b.occurrences - a.occurrences
    }
    // If same number of occurrences, sort by position in text (ascending - earlier appearance first)
    return a.start - b.start
  })

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
            spellCheck={false}
            onChange={(e) => handleContentChange(e.target.value)}
            onFocus={() => onFocus(segment.id)}
            onBlur={() => {
              // Only trigger save if the local content differs from segment content
              // This prevents duplicate calls and potential infinite loops
              if (localContent !== segment.content) {
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
                  // Red underline for spelling errors (Grammarly style) - keep text transparent
                  className = "text-transparent underline decoration-wavy decoration-red-400 decoration-2"
                } else if (isInGrammarError) {
                  // Blue underline for grammar errors (Grammarly style) - keep text transparent
                  className = "text-transparent underline decoration-wavy decoration-blue-400 decoration-2"
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
                {spellingSuggestions.length > 5 && (
                  <span className="font-normal">
                    ({showAllSpellingSuggestions ? "All displayed. " : "5 displayed below. "}
                    <button
                      onClick={() => setShowAllSpellingSuggestions(!showAllSpellingSuggestions)}
                      className="underline hover:no-underline cursor-pointer"
                    >
                      {showAllSpellingSuggestions ? "Show Less" : "Show More"}
                    </button>)
                  </span>
                )}
              </div>
              {(showAllSpellingSuggestions ? spellingSuggestions : spellingSuggestions.slice(0, 5)).map((suggestion) => {
                const groupedSuggestion = suggestion as GroupedSpellingSuggestion
                return (
                  <div
                    key={suggestion.id}
                    className="group flex items-center gap-2 text-sm bg-red-50 p-2 rounded border-l-2 border-red-200 hover:bg-red-100/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <span className="font-medium text-red-700">"{groupedSuggestion.word}"</span>
                      <span className="text-gray-400">→</span>
                      <div className="flex gap-1 flex-wrap">
                        {groupedSuggestion.allSuggestions.length === 0 && <span className="text-gray-400 flex items-center h-7 px-2 text-xs">Unknown</span>}
                        {groupedSuggestion.allSuggestions.map((replacement: string, index: number) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs border-red-200 text-red-700 hover:bg-red-100"
                            onClick={() => handleGroupedSuggestionApply(groupedSuggestion, replacement)}
                          >
                            {replacement}
                          </Button>
                        ))}
                        <AddToDictionaryButton
                          word={groupedSuggestion.word}
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs border-green-200 text-green-700 hover:bg-green-100 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          onAddSuccess={() => {
                            // Trigger re-check for segments containing this word
                            onWordAddedToDictionary?.(groupedSuggestion.word)
                          }}
                          onAddError={(error) => {
                            console.error("Failed to add word to dictionary:", error)
                          }}
                        />
                      </div>
                    </div>
                    {groupedSuggestion.occurrences > 1 && (
                      <span className="text-xs text-gray-400 ml-auto">
                        {groupedSuggestion.occurrences} occurrences
                      </span>
                    )}
                  </div>
                )
              })}

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
                    <span className="font-medium text-blue-700">"{(suggestion as GrammarSuggestion).text}"</span>
                    <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">{(suggestion as GrammarSuggestion).reason}</span>
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
                            disabled={replacement.startsWith("[")}
                            className="h-7 px-2 text-xs border-blue-200 text-blue-700 hover:bg-blue-100"
                            onClick={() => onSuggestionApply(suggestion.id, replacement)}
                          >
                            {replacement === ""
                              ? "Remove"
                              : replacement === "[consider rephrasing]"
                                ? "Rephrase (AI not available yet)"
                                : replacement === "[consider revising]"
                                  ? "Revise (AI not available yet)"
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
            Add tweet below
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
