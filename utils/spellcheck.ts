import { checkSpellingLT } from "@/lib/languageTool"
import type { SpellcheckSuggestion } from "@/types/editor"

// eslint-disable-next-line @typescript-eslint/no-require-imports
const twitterText = require('twitter-text')

// New LanguageTool-based implementation
export async function checkSpelling(text: string, segmentId: string, customDictionary: string[] = []): Promise<SpellcheckSuggestion[]> {
  return await checkSpellingLT(text, segmentId, customDictionary)
}

// Status functions for LanguageTool (always ready)
export function getSpellCheckStatus(): { isInitialized: boolean; isLoading: boolean } {
  return { isInitialized: true, isLoading: false }
}

// No preloading needed for LanguageTool
export async function preloadDictionary(): Promise<void> {
  // LanguageTool doesn't require preloading
  return Promise.resolve()
}

// Twitter character counting (preserved from original)
export function countCharacters(text: string): number {
  // Use Twitter's official character counting logic
  // parseTweet returns an object with weightedLength which is the accurate character count
  // This accounts for URLs (count as 23 chars), mentions, hashtags, emojis, etc.
  const result = twitterText.default.parseTweet(text)
  
  // Return the weighted length which follows Twitter's official counting rules
  return result.weightedLength
}

// Clear caches - now delegates to LanguageTool cache
export function clearSpellCheckCaches(): void {
  // Import dynamically to avoid circular dependency
  import("@/lib/languageTool").then(({ clearLanguageToolCaches }) => {
    clearLanguageToolCaches()
  })
}
