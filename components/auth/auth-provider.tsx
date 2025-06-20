"use client"

import { useEffect, useState, type ReactNode } from "react"
import { useAuth } from "@/store"

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { initialize, isInitialized } = useAuth()
  const [initTimeout, setInitTimeout] = useState(false)

  useEffect(() => {
    if (!isInitialized) {
      initialize().catch(console.error)
      
      // Fallback timeout to prevent infinite loading
      const timeout = setTimeout(() => {
        if (!isInitialized) {
          console.warn("Auth initialization timed out")
          setInitTimeout(true)
        }
      }, 10000) // 10 second timeout

      return () => clearTimeout(timeout)
    }
  }, [initialize, isInitialized])

  // Render children if initialized or if timeout occurred
  if (isInitialized || initTimeout) {
    return <>{children}</>
  }

  return <>{children}</>
} 