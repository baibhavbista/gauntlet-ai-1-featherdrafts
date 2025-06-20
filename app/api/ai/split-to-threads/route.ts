import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { z } from "zod"

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Request validation schema
const SplitThreadsSchema = z.object({
  text: z.string().min(10, "Text must be at least 10 characters").max(10000, "Text is too long"),
  title: z.string().min(1, "Title is required").max(100, "Title is too long"),
  tone: z.enum(["professional", "casual", "witty", "persuasive", "informative"]).optional().default("informative"),
  targetTweetCount: z.number().min(3, "Must have at least 3 tweets").max(10, "Cannot exceed 10 tweets").optional().default(5),
})

// Response schema for type safety
interface TweetSegment {
  order: number
  content: string
  characterCount: number
}

interface SplitThreadsResponse {
  success: boolean
  data?: {
    segments: TweetSegment[]
    totalTweets: number
    originalLength: number
  }
  error?: string
}

export async function POST(request: NextRequest): Promise<NextResponse<SplitThreadsResponse>> {
  try {
    // Parse and validate request body
    const body = await request.json()
    const { text, title, tone, targetTweetCount } = SplitThreadsSchema.parse(body)

    // Rate limiting check (basic implementation)
    const userAgent = request.headers.get("user-agent") || ""
    // TODO: Implement proper rate limiting with Redis or similar

    // Construct the prompt for OpenAI
    const systemPrompt = `You are an expert social media content creator specializing in Twitter threads. Your task is to split long-form content into engaging, coherent tweet segments that work well as a thread.

REQUIREMENTS:
- Each tweet must be 280 characters or less
- Maintain narrative flow and logical progression
- Keep each tweet engaging and valuable on its own
- Use thread numbering format (1/n, 2/n, etc.)
- Preserve important hashtags, mentions, and links
- Maintain the original tone and style
- Ensure smooth transitions between tweets
- Start strong with a hook in the first tweet
- End with a compelling conclusion or call-to-action
- Create EXACTLY ${targetTweetCount} tweets - no more, no fewer

TONE: ${tone}
TARGET COUNT: ${targetTweetCount} tweets

Format your response as a JSON array of objects with this structure:
[
  {
    "order": 1,
    "content": "Tweet content here (1/${targetTweetCount})",
    "characterCount": 45
  }
]

IMPORTANT: 
- Do NOT include any markdown formatting or code blocks
- Return ONLY the JSON array
- Ensure character counts are accurate
- Number tweets sequentially (1/${targetTweetCount}, 2/${targetTweetCount}, etc.)
- Must create exactly ${targetTweetCount} tweets
- Distribute content evenly across all ${targetTweetCount} tweets`

    const userPrompt = `Title: ${title}

Content to split:
${text}

Please split this content into an engaging Twitter thread following all the requirements above.`

    // Make the OpenAI API call
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    })

    const responseContent = completion.choices[0]?.message?.content
    if (!responseContent) {
      throw new Error("No response from OpenAI")
    }

    // Parse the JSON response
    let segments: TweetSegment[]
    try {
      segments = JSON.parse(responseContent)
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", responseContent)
      throw new Error("Invalid response format from AI")
    }

    // Validate the response structure
    if (!Array.isArray(segments) || segments.length === 0) {
      throw new Error("AI returned invalid thread structure")
    }

    // Validate that we have the exact number of tweets requested
    if (segments.length !== targetTweetCount) {
      throw new Error(`AI returned ${segments.length} tweets but ${targetTweetCount} were requested`)
    }

    // Validate each segment
    for (const segment of segments) {
      if (!segment.content || !segment.order || segment.characterCount > 280) {
        throw new Error("AI returned invalid tweet segment")
      }
    }

    // Sort segments by order to ensure correct sequence
    segments.sort((a, b) => a.order - b.order)

    // Return successful response
    return NextResponse.json({
      success: true,
      data: {
        segments,
        totalTweets: segments.length,
        originalLength: text.length,
      },
    })

  } catch (error) {
    console.error("Error in split-to-threads API:", error)

    // Handle specific error types
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: `Validation error: ${error.errors.map(e => e.message).join(", ")}`,
        },
        { status: 400 }
      )
    }

    if (error instanceof Error) {
      // Handle OpenAI API errors
      if (error.message.includes("insufficient_quota")) {
        return NextResponse.json(
          {
            success: false,
            error: "AI service temporarily unavailable. Please try again later.",
          },
          { status: 503 }
        )
      }

      if (error.message.includes("rate_limit")) {
        return NextResponse.json(
          {
            success: false,
            error: "Too many requests. Please wait a moment and try again.",
          },
          { status: 429 }
        )
      }

      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      )
    }

    // Generic error fallback
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred. Please try again.",
      },
      { status: 500 }
    )
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { success: false, error: "Method not allowed" },
    { status: 405 }
  )
} 