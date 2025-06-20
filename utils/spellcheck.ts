import nspell from "nspell"
import type { SpellcheckSuggestion } from "@/types/editor"

// eslint-disable-next-line @typescript-eslint/no-require-imports
const twitterText = require('twitter-text')

const affUrl = "https://cdn.jsdelivr.net/npm/dictionary-en@4.0.0/index.aff"
const dicUrl = "https://cdn.jsdelivr.net/npm/dictionary-en@4.0.0/index.dic"

let spellChecker: any = null
let isInitialized = false
let isLoading = false

// Simple caches for performance
const wordCache = new Map<string, boolean>()
const suggestionCache = new Map<string, string[]>()

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

// Common social media abbreviations and slang (moved outside function for reuse)
const socialMediaWords = new Set([
  "lol", "omg", "wtf", "tbh", "imo", "imho", "fyi", "btw", "dm", "rt", "mt", 
  "ff", "tbt", "ootd", "yolo", "fomo", "selfie", "hashtag", "tweet", "retweet",
  "covid", "covid19", "coronavirus", "pandemic", "lockdown", "quarantine",
  "app", "apps", "smartphone", "iphone", "android", "ios", "wifi", "bluetooth",
])

// Check if a word is correctly spelled
function isWordCorrect(word: string, customDictionary: string[] = []): boolean {
  if (!spellChecker) return true

  const cleanWord = word.replace(/[^\w']/g, "")

  // Empty or very short words
  if (cleanWord.length <= 1) return true

  // Numbers are always correct
  if (/^\d+$/.test(cleanWord)) return true

  // URLs, emails, hashtags, mentions
  if (/^(https?:\/\/|www\.|@|#)/.test(cleanWord)) return true

  // Social media words
  if (socialMediaWords.has(cleanWord.toLowerCase())) return true

  // Check custom dictionary first (normalized to lowercase)
  const normalizedWord = cleanWord.toLowerCase()
  if (customDictionary.includes(normalizedWord)) return true

  // Check cache first
  const cacheKey = normalizedWord
  if (wordCache.has(cacheKey)) {
    return wordCache.get(cacheKey)!
  }

  // Simple spell check - just check lowercase version (covers 95% of cases)
  const isCorrect = spellChecker.correct(cleanWord) || spellChecker.correct(cleanWord.toLowerCase())
  
  // Cache the result
  wordCache.set(cacheKey, isCorrect)
  
  return isCorrect
}

// Generate suggestions for misspelled words
function generateSuggestions(word: string): string[] {
  if (!spellChecker) return []

  const cleanWord = word.replace(/[^\w']/g, "")
  const cacheKey = cleanWord.toLowerCase()

  // Check cache first
  if (suggestionCache.has(cacheKey)) {
    return suggestionCache.get(cacheKey)!
  }

  try {
    // Simple approach - just get suggestions for lowercase version
    const suggestions = spellChecker.suggest(cleanWord.toLowerCase()).slice(0, 3)
    
    // Cache the result
    suggestionCache.set(cacheKey, suggestions)
    
    return suggestions
  } catch (error) {
    console.error("Error generating suggestions:", error)
    return []
  }
}

export async function checkSpelling(text: string, segmentId: string, customDictionary: string[] = []): Promise<SpellcheckSuggestion[]> {
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

    if (!isWordCorrect(word, customDictionary)) {
      const wordSuggestions = generateSuggestions(word)

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
  // Use Twitter's official character counting logic
  // parseTweet returns an object with weightedLength which is the accurate character count
  // This accounts for URLs (count as 23 chars), mentions, hashtags, emojis, etc.
  const result = twitterText.default.parseTweet(text)
  
  // Return the weighted length which follows Twitter's official counting rules
  return result.weightedLength
}

// Clear caches (useful for memory management)
export function clearSpellCheckCaches(): void {
  wordCache.clear()
  suggestionCache.clear()
}
