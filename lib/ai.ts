// Types for AI thread splitting
export interface TweetSegment {
  order: number
  content: string
  characterCount: number
}

export interface SplitThreadsResponse {
  success: boolean
  data?: {
    segments: TweetSegment[]
    totalTweets: number
    originalLength: number
  }
  error?: string
}

export interface SplitThreadsRequest {
  text: string
  title: string
  tone?: "professional" | "casual" | "witty" | "persuasive" | "informative"
  targetTweetCount?: number
}

/**
 * Split long-form text into tweet thread segments using AI
 */
export async function splitTextToThreads(params: SplitThreadsRequest): Promise<SplitThreadsResponse> {
  try {
    const response = await fetch("/api/ai/split-to-threads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    })

    if (!response.ok) {
      // Try to parse error response
      try {
        const errorData = await response.json()
        return {
          success: false,
          error: errorData.error || `HTTP error ${response.status}`,
        }
      } catch {
        return {
          success: false,
          error: `Request failed with status ${response.status}`,
        }
      }
    }

    const data: SplitThreadsResponse = await response.json()
    return data

  } catch (error) {
    console.error("Failed to split text to threads:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error occurred",
    }
  }
}

/**
 * Validate if a string is a valid tweet length
 */
export function isValidTweetLength(text: string): boolean {
  return text.length <= 280 && text.length > 0
}

/**
 * Estimate number of tweets needed for given text (rough calculation)
 */
export function estimateTweetCount(text: string): number {
  if (!text.trim()) return 0
  
  const maxCharsPerTweet = 280
  const words = text.trim().split(/\s+/)
  let currentTweetLength = 0
  let tweetCount = 1
  
  for (const word of words) {
    const wordWithSpace = currentTweetLength === 0 ? word : ` ${word}`
    if (currentTweetLength + wordWithSpace.length > maxCharsPerTweet) {
      tweetCount++
      currentTweetLength = word.length
    } else {
      currentTweetLength += wordWithSpace.length
    }
  }
  
  return tweetCount
} 