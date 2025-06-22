"use client"

import type { ReactNode } from "react"
import { AuthContextProvider } from "./auth-context"

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <AuthContextProvider>
      {children}
    </AuthContextProvider>
  )
} 