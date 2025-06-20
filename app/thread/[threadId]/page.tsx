"use client"

import { useRouter, useParams } from "next/navigation"
import { useEffect } from "react"
import { ThreadDetail } from "@/components/thread-detail"
import { useAuth } from "@/store"
import { PageLoading } from "@/components/ui/loading-spinner"
import { notFound } from "next/navigation"

export default function ThreadDetailPage() {
  const { user, isInitialized } = useAuth()
  const router = useRouter()
  const params = useParams()
  const threadId = params.threadId as string

  // Handle redirect for unauthenticated users
  useEffect(() => {
    if (isInitialized && !user) {
      router.replace('/login') // Use replace to avoid adding to history
    }
  }, [isInitialized, user, router])

  // Validate threadId format
  useEffect(() => {
    if (!threadId || typeof threadId !== 'string') {
      notFound()
    }

    // Basic UUID format validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(threadId)) {
      notFound()
    }
  }, [threadId])

  // Show loading while auth is initializing
  if (!isInitialized) {
    return <PageLoading />
  }

  // Don't render anything if user is not authenticated (useEffect will handle redirect)
  if (!user) {
    return null
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <ThreadDetail 
        threadId={threadId}
        onBackToThreads={() => router.push('/threads')}
        onBackToLanding={() => router.push('/')}
      />
    </main>
  )
} 