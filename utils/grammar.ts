import writeGood from "write-good"
import type { GrammarSuggestion } from "@/types/editor"

// Custom grammar rules for social media writing (using Sets for O(1) lookup)
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

// Check if text should be ignored for grammar checking
function shouldIgnoreText(text: string): boolean {
  const lowerText = text.toLowerCase()

  // Ignore URLs
  if (/https?:\/\//.test(text)) return true

  // Ignore hashtags and mentions
  if (/^[#@]/.test(text)) return true

  // Ignore common social media abbreviations
  if (SOCIAL_MEDIA_RULES.allowedInformal.has(lowerText)) return true

  // Ignore if it's part of an allowed phrase
  for (const phrase of SOCIAL_MEDIA_RULES.allowedPhrases) {
    if (lowerText.includes(phrase) || phrase.includes(lowerText)) {
      return true
    }
  }
  
  return false
}

// Convert write-good suggestions to our format
function convertWriteGoodSuggestions(suggestions: any[], text: string, segmentId: string): GrammarSuggestion[] {
  return suggestions
    .filter((suggestion) => {
      // Filter out suggestions for social media content
      const suggestionText = text.substring(suggestion.index, suggestion.index + suggestion.offset)
      return !shouldIgnoreText(suggestionText)
    })
    .map((suggestion, index) => {
      const suggestionText = text.substring(suggestion.index, suggestion.index + suggestion.offset)

      // Generate suggestions based on the reason
      let suggestions_array: string[] = []

      switch (suggestion.reason) {
        case '"So" at the beginning of the sentence':
          suggestions_array = [suggestionText.replace(/^So,?\s*/i, "")]
          break
        case "is wordy or unneeded":
          suggestions_array = [""] // Suggest removal
          break
        case '"There is" is unnecessary verbiage':
          suggestions_array = [suggestionText.replace(/There\s+(is|are)\s+/i, "")]
          break
        case "can weaken meaning":
          // For words like "really", "very", "quite"
          suggestions_array = [suggestionText.replace(/\b(really|very|quite|rather|pretty)\s+/gi, "")]
          break
        case "is a cliche":
          suggestions_array = ["[consider rephrasing]"]
          break
        case "may be passive voice":
          suggestions_array = ["[consider active voice]"]
          break
        default:
          suggestions_array = ["[consider revising]"]
      }

      return {
        id: `grammar-${segmentId}-${suggestion.index}-${index}`,
        text: suggestionText,
        reason: suggestion.reason,
        suggestions: suggestions_array.filter((s) => s !== suggestionText), // Don't suggest the same text
        start: suggestion.index,
        end: suggestion.index + suggestion.offset,
        segmentId,
        type: "grammar" as const,
      }
    })
}

export async function checkGrammar(text: string, segmentId: string): Promise<GrammarSuggestion[]> {
  try {
    // Skip empty or very short text
    if (!text || text.trim().length < 3) {
      return []
    }

    // Use write-good to analyze the text
    const suggestions = writeGood(text.trim(), {
      passive: true,
      illusion: true,
      so: true,
      thereIs: true,
      weasel: true,
      adverb: true,
      tooWordy: true,
      cliches: true,
    })

    return convertWriteGoodSuggestions(suggestions, text, segmentId)
  } catch (error) {
    console.error("Grammar check error:", error)
    return []
  }
}
