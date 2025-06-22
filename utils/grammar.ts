// ============================================================================
// LANGUAGETOOL INTEGRATION - NEW IMPLEMENTATION
// ============================================================================
import { checkGrammarLT } from "@/lib/languageTool"
import type { GrammarSuggestion } from "@/types/editor"

// New LanguageTool-based implementation
export async function checkGrammar(text: string, segmentId: string): Promise<GrammarSuggestion[]> {
  return await checkGrammarLT(text, segmentId)
}

// Note: Original write-good implementation has been replaced with LanguageTool.
// The old code is preserved in version control history for rollback if needed.
