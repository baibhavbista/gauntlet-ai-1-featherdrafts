export interface TweetSegment {
  id: string
  content: string
  charCount: number
  index: number
}

export interface SpellcheckSuggestion {
  id: string
  word: string
  suggestions: string[]
  start: number
  end: number
  segmentId: string
  type: "spelling"
}

export interface GrammarSuggestion {
  id: string
  text: string
  reason: string
  suggestions: string[]
  start: number
  end: number
  segmentId: string
  type: "grammar"
}

export type Suggestion = SpellcheckSuggestion | GrammarSuggestion

export interface EditorState {
  segments: TweetSegment[]
  activeSegmentId: string
  suggestions: Suggestion[]
}

export interface UserPreferences {
  id: string
  user_id: string
  auto_save_enabled: boolean
  spell_check_enabled: boolean
  grammar_check_enabled: boolean
  auto_fix_enabled: boolean
  preferred_tone: 'casual' | 'professional' | 'neutral' | 'friendly'
  custom_dictionary: string[]
  created_at: string
  updated_at: string
}
