"use client"

import { useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { AddToDictionaryButton } from "@/components/ui/add-to-dictionary-button"
import { CheckCircle2, X } from "lucide-react"
import type { SpellcheckSuggestion } from "@/types/editor"

interface SpellingErrorPopoverProps {
  suggestion: SpellcheckSuggestion
  children: React.ReactNode
  onApplySuggestion: (replacementText: string) => void
  onDismiss: () => void
  onAddToDictionary?: () => void
}

export function SpellingErrorPopover({
  suggestion,
  children,
  onApplySuggestion,
  onDismiss,
  onAddToDictionary,
}: SpellingErrorPopoverProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleApplySuggestion = (replacementText: string) => {
    onApplySuggestion(replacementText)
    setIsOpen(false)
  }

  const handleDismiss = () => {
    onDismiss()
    setIsOpen(false)
  }

  const handleAddToDictionary = () => {
    onAddToDictionary?.()
    setIsOpen(false)
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="start">
        <div className="p-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-red-600">
              Spelling Error: "{suggestion.word}"
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {suggestion.suggestions.length > 0 && (
            <>
              <div className="text-xs text-muted-foreground mb-2">Suggestions:</div>
              {suggestion.suggestions.map((suggestionText, index) => (
                <DropdownMenuItem
                  key={index}
                  onClick={() => handleApplySuggestion(suggestionText)}
                  className="cursor-pointer"
                >
                  <CheckCircle2 className="h-3 w-3 mr-2 text-green-600" />
                  {suggestionText}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
            </>
          )}

          <div className="px-2 py-1">
            <AddToDictionaryButton
              word={suggestion.word}
              className="w-full justify-start p-0 h-8"
              variant="ghost"
              size="sm"
              onAddSuccess={handleAddToDictionary}
              onAddError={(error) => {
                console.error("Failed to add word to dictionary:", error)
              }}
            />
          </div>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem
            onClick={handleDismiss}
            className="cursor-pointer text-muted-foreground"
          >
            Ignore
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 