"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { ThreadList } from "@/components/thread-list"
import { useAuth } from "@/store"
import { PageLoading } from "@/components/ui/loading-spinner"

export default function ThreadsPage() {
  const { user, isInitialized } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

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
      <ThreadList 
        onSelectThread={(threadId: string) => router.push(`/thread/${threadId}`)}
        onCreateNew={() => {}} // Handled internally by ThreadList
      />
    </main>
  )
} 