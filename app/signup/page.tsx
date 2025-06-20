"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AuthForm } from "@/components/auth/auth-form"
import { useAuth } from "@/store"
import { PageLoading } from "@/components/ui/loading-spinner"

export default function SignupPage() {
  const { user, isInitialized } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo')

  // Handle redirect for authenticated users
  useEffect(() => {
    if (isInitialized && user) {
      const destination = redirectTo || '/threads'
      router.replace(destination) // Use replace to avoid adding to history
    }
  }, [isInitialized, user, router, redirectTo])

  // Show loading while auth is initializing
  if (!isInitialized) {
    return <PageLoading />
  }

  // Don't render anything if user is authenticated (useEffect will handle redirect)
  if (user) {
    return null
  }

  return (
    <main className="min-h-screen">
      <AuthForm 
        onSuccess={() => {
          const destination = redirectTo || '/threads'
          router.push(destination)
        }}
      />
    </main>
  )
} 