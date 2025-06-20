"use client"

import { useEffect, Suspense } from "react"
import { useRouter, useParams, usePathname, useSearchParams } from "next/navigation"
import { ThreadDetail } from "@/components/thread-detail"
import { useAuth } from "@/store"
import { PageLoading } from "@/components/ui/loading-spinner"
import { notFound } from "next/navigation"

function ThreadDetailPageContent() {
  const { user, isInitialized } = useAuth()
  const router = useRouter()
  const params = useParams()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const threadId = params.threadId as string
  const isAiGenerated = searchParams.get('ai') === 'success'

  // Validate threadId format (UUID)
  useEffect(() => {
    if (!threadId || typeof threadId !== 'string') {
      notFound()
    }

    // Basic UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(threadId)) {
      notFound()
    }
  }, [threadId])

  // Handle redirect for unauthenticated users
  useEffect(() => {
    if (isInitialized && !user) {
      const redirectTo = encodeURIComponent(pathname)
      router.replace(`/login?redirectTo=${redirectTo}`)
    }
  }, [isInitialized, user, router, pathname])

  // Show loading while auth is initializing
  if (!isInitialized) {
    return <PageLoading />
  }

  // Show loading while redirecting if not authenticated
  if (!user) {
    return <PageLoading />
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <ThreadDetail 
        threadId={threadId}
        isAiGenerated={isAiGenerated}
        onBackToThreads={() => router.push('/threads')}
      />
    </main>
  )
}

export default function ThreadDetailPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <ThreadDetailPageContent />
    </Suspense>
  )
} 