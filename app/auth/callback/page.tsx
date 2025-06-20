"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { PageLoading } from "@/components/ui/loading-spinner"

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Handle hash-based auth callback for OAuth
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error("Auth callback error:", error)
          router.push("/login?error=" + encodeURIComponent(error.message))
          return
        }

        if (data.session) {
          // Give a moment for the auth state to propagate
          setTimeout(() => {
            router.push("/threads")
          }, 200)
        } else {
          router.push("/login")
        }
      } catch (error) {
        console.error("Unexpected error in auth callback:", error)
        router.push("/login")
      }
    }

    handleAuthCallback()
  }, [router])

  return <PageLoading />
}
