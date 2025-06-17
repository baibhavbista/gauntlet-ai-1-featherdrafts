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
