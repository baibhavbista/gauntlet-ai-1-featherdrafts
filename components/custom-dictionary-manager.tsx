"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useAuthContext } from "./auth/auth-context"
import { useDictionary } from "@/store"
import { BookOpen, X, Plus, Search, Trash2 } from "lucide-react"

export function CustomDictionaryManager() {
  const { user } = useAuthContext()
  const { customDictionary, isDictionaryLoaded, addWordToDictionary, removeWordFromDictionary } = useDictionary()
  const [newWord, setNewWord] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddingWord, setIsAddingWord] = useState(false)

  const filteredWords = customDictionary.filter(word =>
    word.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddWord = async () => {
    if (!newWord.trim()) return

    setIsAddingWord(true)
    try {
      const success = await addWordToDictionary(newWord.trim())
      if (success) {
        setNewWord("")
      }
    } catch (error) {
      console.error("Error adding word:", error)
    } finally {
      setIsAddingWord(false)
    }
  }

  const handleRemoveWord = async (word: string) => {
    try {
      await removeWordFromDictionary(word)
    } catch (error) {
      console.error("Error removing word:", error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddWord()
    }
  }

  if (!isDictionaryLoaded) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Custom Dictionary
          </CardTitle>
          <CardDescription>
            Loading your custom dictionary...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-r-transparent" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Custom Dictionary
        </CardTitle>
        <CardDescription>
          Manage words that should not be flagged as spelling errors. You have {customDictionary.length} custom words.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new word */}
        <div className="flex gap-2">
          <Input
            placeholder="Add a word to your dictionary..."
            value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button
            onClick={handleAddWord}
            disabled={!newWord.trim() || isAddingWord}
            size="sm"
          >
            {isAddingWord ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>
        </div>

        {customDictionary.length > 0 && (
          <>
            <Separator />
            
            {/* Search words */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search your dictionary..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Words list */}
            <div className="space-y-2">
              {filteredWords.length > 0 ? (
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {filteredWords.map((word) => (
                    <div
                      key={word}
                      className="flex items-center justify-between p-2 border rounded-lg hover:bg-muted/50"
                    >
                      <Badge variant="secondary" className="font-mono">
                        {word}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveWord(word)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? "No words match your search." : "No custom words yet."}
                </div>
              )}
            </div>

            {customDictionary.length > 0 && (
              <>
                <Separator />
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>
                    {searchTerm ? `${filteredWords.length} of ${customDictionary.length}` : `${customDictionary.length}`} words
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm("Are you sure you want to clear all custom words?")) {
                        customDictionary.forEach(word => handleRemoveWord(word))
                      }
                    }}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
} 