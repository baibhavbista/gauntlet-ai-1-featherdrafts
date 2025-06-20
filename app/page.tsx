"use client"

import { useEffect, useCallback } from "react"
import { TwitterEditor } from "@/components/twitter-editor"
import { LandingPage } from "@/components/landing-page"
import { ThreadList } from "@/components/thread-list"
import { AuthForm } from "@/components/auth/auth-form"
import { useAuth, useNavigation, useAppStore } from "@/store"
import { Loader2 } from "lucide-react"

export default function Home() {
  const { user, loading, isInitialized } = useAuth()
  const { 
    currentView, 
    currentThreadId,
  } = useNavigation()

  // Initialize auth on component mount - use store directly to avoid function reference issues
  useEffect(() => {
    if (!isInitialized) {
      const store = useAppStore.getState()
      store.initialize().catch(console.error)
    }
  }, [isInitialized])

  // Navigation functions - create stable references
  const handleNavigateToThreads = useCallback(() => {
    const store = useAppStore.getState()
    store.navigateToThreads()
  }, [])

  const handleNavigateToLanding = useCallback(() => {
    const store = useAppStore.getState()
    store.navigateToLanding()
  }, [])

  const handleNavigateToAuth = useCallback(() => {
    const store = useAppStore.getState()
    store.navigateToAuth()
  }, [])

  const handleSelectThread = useCallback((threadId: string) => {
    const store = useAppStore.getState()
    store.selectThread(threadId)
  }, [])

  const handleCreateNewThread = useCallback(() => {
    const store = useAppStore.getState()
    store.createNewThread()
  }, [])

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </main>
    )
  }

  // Show auth form only when explicitly requested
  if (currentView === "auth") {
    return (
      <main className="min-h-screen">
        <AuthForm onSuccess={handleNavigateToThreads} />
      </main>
    )
  }

  // Show editor if user is authenticated and wants to use editor
  if (currentView === "editor" && user) {
    return (
      <main className="min-h-screen bg-gray-50">
        <TwitterEditor 
          threadId={currentThreadId} 
          onBackToThreads={handleNavigateToThreads}
          onBackToLanding={handleNavigateToLanding}
        />
      </main>
    )
  }

  // Show thread list for authenticated users
  if (currentView === "threads" && user) {
    return (
      <main className="min-h-screen bg-gray-50">
        <ThreadList 
          onSelectThread={handleSelectThread}
          onCreateNew={handleCreateNewThread}
        />
      </main>
    )
  }

  // Show landing page (for both authenticated and unauthenticated users)
  return (
    <main className="min-h-screen">
      <LandingPage onGetStarted={() => {
        if (user) {
          handleNavigateToThreads()
        } else {
          handleNavigateToAuth()
        }
      }} />
    </main>
  )
} 