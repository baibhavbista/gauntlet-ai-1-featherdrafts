"use client"

import { LandingPage } from "@/components/landing-page"
import { useAuthContext } from "@/components/auth/auth-context"
import { useRouter } from "next/navigation"

export default function Home() {
  const { user } = useAuthContext()
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