"use client"

import { useState } from "react"
import { TwitterEditor } from "@/components/twitter-editor"
import { LandingPage } from "@/components/landing-page"
import { ThreadList } from "@/components/thread-list"
import { AuthForm } from "@/components/auth/auth-form"
import { useAuth } from "@/hooks/use-auth"
import { Loader2 } from "lucide-react"

type View = "landing" | "threads" | "editor" | "auth"

export default function Home() {
  const { user, loading } = useAuth()
  const [currentView, setCurrentView] = useState<View>("landing")
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null)

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
        <AuthForm onSuccess={() => setCurrentView("threads")} />
      </main>
    )
  }

  // Show editor if user is authenticated and wants to use editor
  if (currentView === "editor" && user) {
    return (
      <main className="min-h-screen bg-gray-50">
        <TwitterEditor
          threadId={currentThreadId}
          onBackToThreads={() => {
            setCurrentView("threads")
            setCurrentThreadId(null)
          }}
          onBackToLanding={() => setCurrentView("landing")}
        />
      </main>
    )
  }

  // Show thread list for authenticated users
  if (currentView === "threads" && user) {
    return (
      <main className="min-h-screen bg-gray-50">
        <ThreadList
          onSelectThread={(threadId) => {
            setCurrentThreadId(threadId)
            setCurrentView("editor")
          }}
          onCreateNew={() => {
            setCurrentThreadId(null)
            setCurrentView("editor")
          }}
        />
      </main>
    )
  }

  // Show landing page (for both authenticated and unauthenticated users)
  return (
    <main className="min-h-screen">
      <LandingPage
        onGetStarted={() => {
          if (user) {
            setCurrentView("threads")
          } else {
            setCurrentView("auth")
          }
        }}
      />
    </main>
  )
}
