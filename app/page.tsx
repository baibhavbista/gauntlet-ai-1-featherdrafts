"use client"

import { LandingPage } from "@/components/landing-page"
import { useAuth } from "@/store"
import { useRouter } from "next/navigation"

export default function Home() {
  const { user } = useAuth()
  const router = useRouter()

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