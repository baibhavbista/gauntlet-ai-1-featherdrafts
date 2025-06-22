import type { SpellcheckSuggestion, GrammarSuggestion } from "@/types/editor"

// 1) Define the shape of the JSON response (from LanguageTool API)
export interface LTMatch {
  message: string;
  shortMessage: string;
  replacements: { value: string }[];
  offset: number;
  length: number;
  context: { text: string; offset: number; length: number };
  rule: { id: string; description: string; category?: { id: string; name: string } };
}

export interface LTResponse {
  software: { name: string; version: string };
  language: { code: string; name: string };
  matches: LTMatch[];
}

// Cache for performance (similar to existing spellcheck cache)
const responseCache = new Map<string, LTResponse>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
const cacheTimestamps = new Map<string, number>()

// Common social media abbreviations and slang (preserved from existing system)
const socialMediaWords = new Set([
  "lol", "omg", "wtf", "tbh", "imo", "imho", "fyi", "btw", "dm", "rt", "mt", 
  "ff", "tbt", "ootd", "yolo", "fomo", "selfie", "hashtag", "tweet", "retweet",
  "covid", "covid19", "coronavirus", "pandemic", "lockdown", "quarantine",
  "app", "apps", "smartphone", "iphone", "android", "ios", "wifi", "bluetooth",
])

// Social media rules (preserved from existing grammar system)
const SOCIAL_MEDIA_RULES = {
  // Allow informal contractions and abbreviations
  allowedInformal: new Set([
    "lol", "omg", "btw", "fyi", "imo", "imho", "tbh", "dm", "rt",
    "gonna", "wanna", "gotta", "kinda", "sorta", "dunno",
    "can't", "won't", "don't", "isn't", "aren't", "wasn't", "weren't",
    "haven't", "hasn't", "hadn't", "wouldn't", "couldn't", "shouldn't",
  ]),

  // Common social media phrases that are acceptable
  allowedPhrases: new Set([
    "so excited", "can't wait", "love this", "hate when", "just saying",
    "no way", "for real", "my bad", "nbd", "np", "yw", "ty", "thx",
  ]),
}

// Check if text should be ignored for checking (preserved from existing system)
function shouldIgnoreText(text: string): boolean {
  const lowerText = text.toLowerCase()

  // Ignore URLs
  if (/https?:\/\//.test(text)) return true

  // Ignore hashtags and mentions
  if (/^[#@]/.test(text)) return true

  // Ignore common social media abbreviations
  if (SOCIAL_MEDIA_RULES.allowedInformal.has(lowerText)) return true
  if (socialMediaWords.has(lowerText)) return true

  // Ignore if it's part of an allowed phrase
  for (const phrase of SOCIAL_MEDIA_RULES.allowedPhrases) {
    if (lowerText.includes(phrase) || phrase.includes(lowerText)) {
      return true
    }
  }
  
  return false
}

// Check if a word should be ignored for spellcheck (preserved logic)
function shouldIgnoreWord(word: string, customDictionary: string[] = []): boolean {
  const cleanWord = word.replace(/[^\w']/g, "")
  const lowerWord = cleanWord.toLowerCase()

  // Empty or very short words
  if (cleanWord.length <= 1) return true

  // Numbers are always correct
  if (/^\d+$/.test(cleanWord)) return true

  // URLs, emails, hashtags, mentions
  if (/^(https?:\/\/|www\.|@|#)/.test(cleanWord)) return true

  // Social media words
  if (socialMediaWords.has(lowerWord)) return true

  // Check custom dictionary first (normalized to lowercase)
  if (customDictionary.includes(lowerWord)) return true

  return false
}

// Generate cache key for requests
function getCacheKey(text: string, language: string): string {
  return `${language}:${text.substring(0, 100)}:${text.length}`
}

// Check if cache entry is still valid
function isCacheValid(key: string): boolean {
  const timestamp = cacheTimestamps.get(key)
  if (!timestamp) return false
  return Date.now() - timestamp < CACHE_DURATION
}

// Core LanguageTool API function
export async function checkGrammar(
  text: string,
  language: string = "en-US"
): Promise<LTResponse> {
  // Check cache first
  const cacheKey = getCacheKey(text, language)
  if (isCacheValid(cacheKey)) {
    const cached = responseCache.get(cacheKey)
    if (cached) {
      return cached
    }
  }

  const url = "https://language-tool-731522c86492.herokuapp.com/v2/check"
  
  // Build form data
  const body = new URLSearchParams()
  body.append("language", language)
  body.append("text", text)

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        // LanguageTool expects url-encoded forms
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    })

    if (!res.ok) {
      throw new Error(`LanguageTool error: ${res.status} ${res.statusText}`)
    }

    // Parse JSON into our typed interface
    const response = (await res.json()) as LTResponse
    
    // Cache the response
    responseCache.set(cacheKey, response)
    cacheTimestamps.set(cacheKey, Date.now())
    
    return response
  } catch (error) {
    console.error("LanguageTool API error:", error)
    throw error
  }
}

// Convert LanguageTool matches to SpellcheckSuggestions
export function convertToSpellcheckSuggestions(
  matches: LTMatch[], 
  text: string, 
  segmentId: string,
  customDictionary: string[] = []
): SpellcheckSuggestion[] {
  const suggestions: SpellcheckSuggestion[] = []

  for (const match of matches) {
    // Only include spelling-related rules
    const isSpellingRule = match.rule.category?.id === 'TYPOS' || 
                          match.rule.id.includes('SPELLING') ||
                          match.rule.id.includes('MORFOLOGIK') ||
                          match.shortMessage.toLowerCase().includes('spelling')

    if (!isSpellingRule) continue

    const word = text.substring(match.offset, match.offset + match.length)
    
    // Apply our social media and custom dictionary filters
    if (shouldIgnoreWord(word, customDictionary)) continue
    if (shouldIgnoreText(word)) continue

    suggestions.push({
      id: `spelling-${segmentId}-${match.offset}-${word}`,
      word: word,
      suggestions: match.replacements.map(r => r.value).slice(0, 3), // Limit to 3 suggestions
      start: match.offset,
      end: match.offset + match.length,
      segmentId,
      type: "spelling" as const,
    })
  }

  return suggestions
}

// Convert LanguageTool matches to GrammarSuggestions  
export function convertToGrammarSuggestions(
  matches: LTMatch[], 
  text: string, 
  segmentId: string
): GrammarSuggestion[] {
  const suggestions: GrammarSuggestion[] = []

  for (const match of matches) {
    // Exclude spelling-related rules from grammar suggestions
    const isSpellingRule = match.rule.category?.id === 'TYPOS' || 
                          match.rule.id.includes('SPELLING') ||
                          match.rule.id.includes('MORFOLOGIK')

    if (isSpellingRule) continue

    const suggestionText = text.substring(match.offset, match.offset + match.length)
    
    // Apply our social media filters
    if (shouldIgnoreText(suggestionText)) continue

    suggestions.push({
      id: `grammar-${segmentId}-${match.offset}-${match.rule.id}`,
      text: suggestionText,
      reason: match.shortMessage || match.message,
      suggestions: match.replacements.map(r => r.value).slice(0, 3), // Limit to 3 suggestions
      start: match.offset,
      end: match.offset + match.length,
      segmentId,
      type: "grammar" as const,
    })
  }

  return suggestions
}

// Combined function to get both spelling and grammar suggestions
export async function checkSpellingAndGrammar(
  text: string, 
  segmentId: string,
  customDictionary: string[] = [],
  language: string = "en-US"
): Promise<{
  spellingSuggestions: SpellcheckSuggestion[]
  grammarSuggestions: GrammarSuggestion[]
}> {
  try {
    // Skip empty or very short text
    if (!text || text.trim().length < 3) {
      return {
        spellingSuggestions: [],
        grammarSuggestions: []
      }
    }

    const response = await checkGrammar(text.trim(), language)
    
    const spellingSuggestions = convertToSpellcheckSuggestions(
      response.matches, 
      text, 
      segmentId, 
      customDictionary
    )
    
    const grammarSuggestions = convertToGrammarSuggestions(
      response.matches, 
      text, 
      segmentId
    )

    return {
      spellingSuggestions,
      grammarSuggestions
    }
  } catch (error) {
    console.error("LanguageTool check error:", error)
    return {
      spellingSuggestions: [],
      grammarSuggestions: []
    }
  }
}

// Wrapper functions to maintain compatibility with existing API
export async function checkSpellingLT(
  text: string, 
  segmentId: string, 
  customDictionary: string[] = []
): Promise<SpellcheckSuggestion[]> {
  const { spellingSuggestions } = await checkSpellingAndGrammar(text, segmentId, customDictionary)
  return spellingSuggestions
}

export async function checkGrammarLT(
  text: string, 
  segmentId: string
): Promise<GrammarSuggestion[]> {
  const { grammarSuggestions } = await checkSpellingAndGrammar(text, segmentId)
  return grammarSuggestions
}

// Clear cache (useful for memory management)
export function clearLanguageToolCaches(): void {
  responseCache.clear()
  cacheTimestamps.clear()
}

// Get cache status
export function getLanguageToolCacheStatus(): { 
  size: number
  entries: number 
} {
  return {
    size: responseCache.size,
    entries: cacheTimestamps.size
  }
} 