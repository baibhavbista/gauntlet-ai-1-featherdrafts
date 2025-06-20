"use client"

import { LandingPage } from "@/components/landing-page"
import { useAuth } from "@/store"
import { useRouter } from "next/navigation"
import { PageLoading } from "@/components/ui/loading-spinner"

export default function Home() {
  const { user, loading, isInitialized } = useAuth()
  const router = useRouter()

  // Show loading spinner while auth is initializing
  if (!isInitialized) {
    return <PageLoading />
  }

  // Landing page with navigation to appropriate routes
  return (
    <main className="min-h-screen">
      <LandingPage onGetStarted={() => {
        if (user) {
          router.push('/threads')
        } else {
          router.push('/login')
        }
      }} />
    </main>
  )
} 