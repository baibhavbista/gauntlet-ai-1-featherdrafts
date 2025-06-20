"use client"

import { useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AuthForm } from "@/components/auth/auth-form"
import { useAuth } from "@/store"
import { PageLoading } from "@/components/ui/loading-spinner"
import { validateRedirectUrl } from "@/lib/utils"

function LoginPageContent() {
  const { user, isInitialized } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Get and validate redirect URL
  const redirectToParam = searchParams.get('redirectTo')
  const validatedRedirectTo = validateRedirectUrl(redirectToParam)
  const error = searchParams.get('error')

  // Handle redirect for authenticated users
  useEffect(() => {
    if (isInitialized && user) {
      const destination = validatedRedirectTo || '/threads'
      router.replace(destination) // Use replace to avoid adding to history
    }
  }, [isInitialized, user, router, validatedRedirectTo])

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
          const destination = validatedRedirectTo || '/threads'
          router.push(destination)
        }}
        error={error}
      />
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <LoginPageContent />
    </Suspense>
  )
} 