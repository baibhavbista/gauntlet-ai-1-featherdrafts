import nspell from "nspell"
import type { SpellcheckSuggestion } from "@/types/editor"

const affUrl = "https://cdn.jsdelivr.net/npm/dictionary-en-us@2.0.0/index.aff"
const dicUrl = "https://cdn.jsdelivr.net/npm/dictionary-en-us@2.0.0/index.dic"

let spellChecker: any = null
let isInitialized = false
let isLoading = false

// Load dictionary files from CDN
async function loadDictionaryFiles(): Promise<{ aff: string; dic: string }> {
  try {
    const [affResponse, dicResponse] = await Promise.all([fetch(affUrl), fetch(dicUrl)])

    if (!affResponse.ok || !dicResponse.ok) {
      throw new Error(`Failed to load dictionary files: ${affResponse.status}, ${dicResponse.status}`)
    }

    const [aff, dic] = await Promise.all([affResponse.text(), dicResponse.text()])

    return { aff, dic }
  } catch (error) {
    console.error("Error loading dictionary files:", error)
    throw error
  }
}

// Initialize the spell checker with CDN dictionary
async function initializeSpellChecker() {
  if (isInitialized) return spellChecker
  if (isLoading) {
    // Wait for existing initialization to complete
    while (isLoading) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    return spellChecker
  }

  isLoading = true

  try {
    console.log("Loading dictionary from CDN...")
    const { aff, dic } = await loadDictionaryFiles()

    console.log("Initializing spell checker...")
    spellChecker = nspell({ aff, dic })

    isInitialized = true
    console.log("Spell checker initialized successfully!")

    return spellChecker
  } catch (error) {
    console.error("Failed to initialize spell checker:", error)

    // Fallback to a basic spell checker or return null
    spellChecker = null
    return null
  } finally {
    isLoading = false
  }
}

// Check if a word is correctly spelled
function isWordCorrect(word: string): boolean {
  if (!spellChecker) return true

  const cleanWord = word.replace(/[^\w']/g, "")

  // Empty or very short words
  if (cleanWord.length <= 1) return true

  // Numbers are always correct
  if (/^\d+$/.test(cleanWord)) return true

  // URLs, emails, hashtags, mentions
  if (/^(https?:\/\/|www\.|@|#)/.test(cleanWord)) return true

  // Common social media abbreviations and slang
  const socialMediaWords = [
    "lol",
    "omg",
    "wtf",
    "tbh",
    "imo",
    "imho",
    "fyi",
    "btw",
    "dm",
    "rt",
    "mt",
    "ff",
    "tbt",
    "ootd",
    "yolo",
    "fomo",
    "selfie",
    "hashtag",
    "tweet",
    "retweet",
    "covid",
    "covid19",
    "coronavirus",
    "pandemic",
    "lockdown",
    "quarantine",
    "app",
    "apps",
    "smartphone",
    "iphone",
    "android",
    "ios",
    "wifi",
    "bluetooth",
  ]

  if (socialMediaWords.includes(cleanWord.toLowerCase())) return true

  // Check the word in multiple case variations
  // 1. Check as-is (preserves original case)
  if (spellChecker.correct(cleanWord)) return true

  // 2. Check lowercase (for common words)
  if (spellChecker.correct(cleanWord.toLowerCase())) return true

  // 3. Check with first letter capitalized (for proper nouns)
  const capitalized = cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1).toLowerCase()
  if (spellChecker.correct(capitalized)) return true

  // 4. Check all uppercase (for acronyms)
  if (spellChecker.correct(cleanWord.toUpperCase())) return true

  return false
}

// Generate suggestions for misspelled words
function generateSuggestions(word: string): string[] {
  if (!spellChecker) return []

  const cleanWord = word.replace(/[^\w']/g, "")

  try {
    // Get suggestions for the original case
    let suggestions = spellChecker.suggest(cleanWord)

    // If no suggestions, try lowercase
    if (suggestions.length === 0) {
      suggestions = spellChecker.suggest(cleanWord.toLowerCase())
    }

    // If still no suggestions, try capitalized
    if (suggestions.length === 0) {
      const capitalized = cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1).toLowerCase()
      suggestions = spellChecker.suggest(capitalized)
    }

    // If still no suggestions, try uppercase
    if (suggestions.length === 0) {
      suggestions = spellChecker.suggest(cleanWord.toUpperCase())
    }

    return suggestions.slice(0, 3) // Return top 3 suggestions
  } catch (error) {
    console.error("Error generating suggestions:", error)
    return []
  }
}

export async function checkSpelling(text: string, segmentId: string): Promise<SpellcheckSuggestion[]> {
  // Initialize spell checker if not already done
  if (!isInitialized && !isLoading) {
    await initializeSpellChecker()
  }

  // Wait for initialization if it's in progress
  while (isLoading) {
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  if (!spellChecker) {
    console.warn("Spell checker not available")
    return []
  }

  const suggestions: SpellcheckSuggestion[] = []

  // Split text into words while preserving positions
  const wordRegex = /\b[\w']+\b/g
  let match

  while ((match = wordRegex.exec(text)) !== null) {
    const word = match[0]
    const start = match.index
    const end = start + word.length

    if (!isWordCorrect(word)) {
      const wordSuggestions = generateSuggestions(word)

      if (wordSuggestions.length > 0) {
        suggestions.push({
          id: `spelling-${segmentId}-${start}-${word}`,
          word: word,
          suggestions: wordSuggestions,
          start: start,
          end: end,
          segmentId,
          type: "spelling" as const,
        })
      }
    }
  }

  return suggestions
}

// Get initialization status
export function getSpellCheckStatus(): { isInitialized: boolean; isLoading: boolean } {
  return { isInitialized, isLoading }
}

// Preload dictionary (can be called on app startup)
export async function preloadDictionary(): Promise<void> {
  if (!isInitialized && !isLoading) {
    await initializeSpellChecker()
  }
}

export function countCharacters(text: string): number {
  // Basic character counting - in a real app you'd use twitter-text
  return text.length
}
