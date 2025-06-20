import { supabase } from "./supabase"
import type { TweetSegment, Suggestion, UserPreferences } from "@/types/editor"

export interface Thread {
  id: string
  user_id: string
  title: string
  description?: string
  status: "draft" | "published" | "archived"
  total_characters: number
  total_tweets: number
  created_at: string
  updated_at: string
  published_at?: string
}

export interface ThreadWithSegments extends Thread {
  segments: TweetSegment[]
}

// Thread operations
export async function createThread(title: string, description?: string): Promise<Thread | null> {
  // Get the current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error("User not authenticated:", userError)
    return null
  }

  const { data, error } = await supabase
    .from("threads")
    .insert({
      title,
      description,
      status: "draft",
      user_id: user.id, // Explicitly set the user_id
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating thread:", error)
    return null
  }

  return data
}

export async function getThreads(): Promise<Thread[]> {
  // Get the current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error("User not authenticated:", userError)
    return []
  }

  const { data, error } = await supabase
    .from("threads")
    .select("*")
    .eq("user_id", user.id) // Explicitly filter by user_id
    .order("updated_at", { ascending: false })

  if (error) {
    console.error("Error fetching threads:", error)
    return []
  }

  return data || []
}

export async function getThread(threadId: string): Promise<ThreadWithSegments | null> {
  // Get the current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error("User not authenticated:", userError)
    return null
  }

  const { data: thread, error: threadError } = await supabase
    .from("threads")
    .select("*")
    .eq("id", threadId)
    .eq("user_id", user.id) // Ensure user owns the thread
    .single()

  if (threadError) {
    console.error("Error fetching thread:", threadError)
    return null
  }

  const { data: segments, error: segmentsError } = await supabase
    .from("tweet_segments")
    .select("*")
    .eq("thread_id", threadId)
    .order("segment_index", { ascending: true })

  if (segmentsError) {
    console.error("Error fetching segments:", segmentsError)
    return null
  }

  // Convert database segments to our TweetSegment format
  const formattedSegments: TweetSegment[] = segments.map((segment) => ({
    id: segment.id,
    content: segment.content,
    charCount: segment.char_count,
    index: segment.segment_index,
  }))

  return {
    ...thread,
    segments: formattedSegments,
  }
}

export async function updateThread(threadId: string, updates: Partial<Thread>): Promise<boolean> {
  // Get the current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error("User not authenticated:", userError)
    return false
  }

  const { error } = await supabase.from("threads").update(updates).eq("id", threadId).eq("user_id", user.id) // Ensure user owns the thread

  if (error) {
    console.error("Error updating thread:", error)
    return false
  }

  return true
}

export async function deleteThread(threadId: string): Promise<boolean> {
  // Get the current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error("User not authenticated:", userError)
    return false
  }

  const { error } = await supabase.from("threads").delete().eq("id", threadId).eq("user_id", user.id) // Ensure user owns the thread

  if (error) {
    console.error("Error deleting thread:", error)
    return false
  }

  return true
}

// Segment operations
export async function createSegment(threadId: string, content: string, index: number): Promise<TweetSegment | null> {
  // Get the current user to verify thread ownership
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error("User not authenticated:", userError)
    return null
  }

  // Verify the user owns the thread
  const { data: thread, error: threadError } = await supabase
    .from("threads")
    .select("id")
    .eq("id", threadId)
    .eq("user_id", user.id)
    .single()

  if (threadError || !thread) {
    console.error("Thread not found or user doesn't own it:", threadError)
    return null
  }

  const { data, error } = await supabase.from("tweet_segments").insert({
    thread_id: threadId,
    content,
    char_count: content.length,
    segment_index: index,
  })
  .select()
  .single()

  if (error) {
    console.error("Error creating segment:", error)
    return null
  }

  // Convert database segment to our TweetSegment format
  return {
    id: data.id,
    content: data.content,
    charCount: data.char_count,
    index: data.segment_index,
  }
}

export async function createBulkSegments(threadId: string, segments: { content: string; index: number }[]): Promise<TweetSegment[]> {
  // Get the current user to verify thread ownership
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error("User not authenticated:", userError)
    return []
  }

  // Verify the user owns the thread
  const { data: thread, error: threadError } = await supabase
    .from("threads")
    .select("id")
    .eq("id", threadId)
    .eq("user_id", user.id)
    .single()

  if (threadError || !thread) {
    console.error("Thread not found or user doesn't own it:", threadError)
    return []
  }

  // Prepare bulk insert data
  const insertData = segments.map(segment => ({
    thread_id: threadId,
    content: segment.content,
    char_count: segment.content.length,
    segment_index: segment.index,
  }))

  const { data, error } = await supabase
    .from("tweet_segments")
    .insert(insertData)
    .select()

  if (error) {
    console.error("Error creating bulk segments:", error)
    return []
  }

  // Convert database segments to our TweetSegment format
  return data.map(segment => ({
    id: segment.id,
    content: segment.content,
    charCount: segment.char_count,
    index: segment.segment_index,
  }))
}

export async function updateSegment(segmentId: string, content: string): Promise<boolean> {
  // Get the current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error("User not authenticated:", userError)
    return false
  }

  // Update segment with additional verification through RLS
  const { error } = await supabase
    .from("tweet_segments")
    .update({
      content,
      char_count: content.length,
    })
    .eq("id", segmentId)

  if (error) {
    console.error("Error updating segment:", error)
    return false
  }

  return true
}

export async function deleteSegment(segmentId: string): Promise<boolean> {
  // Get the current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error("User not authenticated:", userError)
    return false
  }

  const { error } = await supabase.from("tweet_segments").delete().eq("id", segmentId)

  if (error) {
    console.error("Error deleting segment:", error)
    return false
  }

  return true
}

export async function reorderSegments(threadId: string, segments: TweetSegment[]): Promise<boolean> {
  // Get the current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error("User not authenticated:", userError)
    return false
  }

  // Verify the user owns the thread
  const { data: thread, error: threadError } = await supabase
    .from("threads")
    .select("id")
    .eq("id", threadId)
    .eq("user_id", user.id)
    .single()

  if (threadError || !thread) {
    console.error("Thread not found or user doesn't own it:", threadError)
    return false
  }

  const updates = segments.map((segment, index) => ({
    id: segment.id,
    segment_index: index,
  }))

  for (const update of updates) {
    const { error } = await supabase
      .from("tweet_segments")
      .update({ segment_index: update.segment_index })
      .eq("id", update.id)

    if (error) {
      console.error("Error reordering segments:", error)
      return false
    }
  }

  return true
}

// Suggestion operations
export async function saveSuggestion(
  segmentId: string,
  suggestion: Omit<Suggestion, "id" | "segmentId">,
): Promise<boolean> {
  // Get the current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error("User not authenticated:", userError)
    return false
  }

  const { error } = await supabase.from("suggestions").insert({
    segment_id: segmentId,
    suggestion_type: suggestion.type,
    original_text: suggestion.type === "spelling" ? (suggestion as any).word : (suggestion as any).text,
    suggested_text: suggestion.suggestions[0] || "",
    reason: suggestion.type === "grammar" ? (suggestion as any).reason : undefined,
    start_position: suggestion.start,
    end_position: suggestion.end,
    is_applied: false,
  })

  if (error) {
    console.error("Error saving suggestion:", error)
    return false
  }

  return true
}

export async function applySuggestion(suggestionId: string): Promise<boolean> {
  // Get the current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error("User not authenticated:", userError)
    return false
  }

  const { error } = await supabase.from("suggestions").update({ is_applied: true }).eq("id", suggestionId)

  if (error) {
    console.error("Error applying suggestion:", error)
    return false
  }

  return true
}

// User Preferences operations
export async function getUserPreferences(): Promise<UserPreferences | null> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error("User not authenticated:", userError)
    return null
  }

  const { data, error } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", user.id)
    .single()

  if (error) {
    // If no preferences exist, create default ones
    if (error.code === 'PGRST116') {
      return await createDefaultUserPreferences()
    }
    console.error("Error fetching user preferences:", error)
    return null
  }

  return data
}

export async function createDefaultUserPreferences(): Promise<UserPreferences | null> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error("User not authenticated:", userError)
    return null
  }

  const { data, error } = await supabase
    .from("user_preferences")
    .insert({
      user_id: user.id,
      custom_dictionary: [],
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating default user preferences:", error)
    return null
  }

  return data
}

export async function updateUserPreferences(updates: Partial<Omit<UserPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>>): Promise<boolean> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error("User not authenticated:", userError)
    return false
  }

  const { error } = await supabase
    .from("user_preferences")
    .update(updates)
    .eq("user_id", user.id)

  if (error) {
    console.error("Error updating user preferences:", error)
    return false
  }

  return true
}

// Custom Dictionary operations
export async function addWordToUserDictionary(word: string): Promise<boolean> {
  const preferences = await getUserPreferences()
  if (!preferences) return false

  // Normalize the word (lowercase, trim)
  const normalizedWord = word.toLowerCase().trim()
  
  // Check if word already exists
  if (preferences.custom_dictionary.includes(normalizedWord)) {
    return true // Already exists, consider it successful
  }

  // Add word to dictionary
  const updatedDictionary = [...preferences.custom_dictionary, normalizedWord]
  
  return await updateUserPreferences({
    custom_dictionary: updatedDictionary
  })
}

export async function removeWordFromUserDictionary(word: string): Promise<boolean> {
  const preferences = await getUserPreferences()
  if (!preferences) return false

  // Normalize the word (lowercase, trim)
  const normalizedWord = word.toLowerCase().trim()
  
  // Remove word from dictionary
  const updatedDictionary = preferences.custom_dictionary.filter(w => w !== normalizedWord)
  
  return await updateUserPreferences({
    custom_dictionary: updatedDictionary
  })
}

export async function getUserCustomDictionary(): Promise<string[]> {
  const preferences = await getUserPreferences()
  return preferences?.custom_dictionary || []
}
