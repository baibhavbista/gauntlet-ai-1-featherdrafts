"use client"

import { Button } from "@/components/ui/button"
import { BookOpen, Plus } from "lucide-react"
import { useDictionary } from "@/store"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface AddToDictionaryButtonProps {
  word: string
  className?: string
  size?: "sm" | "default" | "lg"
  variant?: "default" | "secondary" | "ghost" | "outline"
  onAddSuccess?: () => void
  onAddError?: (error: string) => void
}

export function AddToDictionaryButton({
  word,
  className,
  size = "sm",
  variant = "ghost",
  onAddSuccess,
  onAddError,
}: AddToDictionaryButtonProps) {
  const { addWordToDictionary, customDictionary } = useDictionary()
  const [isAdding, setIsAdding] = useState(false)

  // Check if word is already in dictionary
  const normalizedWord = word.toLowerCase().trim()
  const isAlreadyAdded = customDictionary.includes(normalizedWord)

  const handleAddToDictionary = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (isAlreadyAdded || isAdding) return

    setIsAdding(true)
    
    try {
      const success = await addWordToDictionary(word)
      
      if (success) {
        onAddSuccess?.()
      } else {
        onAddError?.("Failed to add word to dictionary")
      }
    } catch (error) {
      console.error("Error adding word to dictionary:", error)
      onAddError?.("An error occurred while adding the word")
    } finally {
      setIsAdding(false)
    }
  }

  if (isAlreadyAdded) {
    return (
      <Button
        variant="ghost"
        size={size}
        className={cn("text-green-600 cursor-default", className)}
        disabled
      >
        <BookOpen className="h-3 w-3 mr-1" />
        In Dictionary
      </Button>
    )
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleAddToDictionary}
      disabled={isAdding}
      className={cn(
        "text-blue-600 hover:text-blue-700 hover:bg-blue-50",
        className
      )}
    >
      {isAdding ? (
        <>
          <div className="h-3 w-3 mr-1 animate-spin rounded-full border-2 border-current border-r-transparent" />
          Adding...
        </>
      ) : (
        <>
          <Plus className="h-3 w-3" />
          Add to Dictionary
        </>
      )}
    </Button>
  )
} 