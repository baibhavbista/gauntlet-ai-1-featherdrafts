"use client"

import { useEffect, type ReactNode } from "react"
import { useAppStore } from "@/store"
import { PageLoading } from "@/components/ui/loading-spinner"

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const isInitialized = useAppStore(state => state.isInitialized)
  const initialize = useAppStore(state => state.initialize)

  useEffect(() => {
    let cancelled = false
    
    const initAuth = async () => {
      if (!isInitialized && !cancelled) {
        try {
          await initialize()
        } catch (error) {
          console.error('Auth initialization failed:', error)
        }
      }
    }

    initAuth()
    
    return () => {
      cancelled = true
    }
  }, []) // Remove dependencies to prevent infinite loop

  // Show loading screen until auth is initialized
  if (!isInitialized) {
    return <PageLoading />
  }

  return <>{children}</>
} 