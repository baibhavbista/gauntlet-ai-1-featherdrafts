"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Mail, Lock, User, Feather } from "lucide-react"
import { useAuth } from "@/store"

interface AuthFormProps {
  onSuccess: () => void
  onBackToHome?: () => void
  error?: string | null
}

export function AuthForm({ onSuccess, onBackToHome, error: urlError }: AuthFormProps) {
  const { 
    loading: authLoading, 
    error: authError, 
    signIn, 
    signUp, 
    signInWithOAuth, 
    clearError 
  } = useAuth()
  
  const [mode, setMode] = useState<"signin" | "signup">("signin")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [localLoading, setLocalLoading] = useState(false)
  const [message, setMessage] = useState("")

  // Clear auth error when component mounts or mode changes
  useEffect(() => {
    clearError()
  }, [mode, clearError])

  const isLoading = authLoading || localLoading

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalLoading(true)
    setMessage("")
    clearError()

    try {
      if (mode === "signup") {
        await signUp(email, password, fullName)
        setMessage("Check your email for the confirmation link!")
      } else {
        await signIn(email, password)
        // Wait a bit for auth state to update before calling onSuccess
        setTimeout(() => {
          onSuccess()
        }, 100)
      }
    } catch (error: unknown) {
      // Error is already handled in the store
      console.error('Auth error:', error)
    } finally {
      setLocalLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setLocalLoading(true)
    clearError()

    try {
      await signInWithOAuth("google")
      // OAuth will redirect, so no need to call onSuccess here
    } catch (error: unknown) {
      // Error is already handled in the store
      console.error('OAuth error:', error)
    } finally {
      setLocalLoading(false)
    }
  }

  const handleBackToHome = () => {
    if (onBackToHome) {
      onBackToHome()
    } else {
      window.location.href = "/"
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Feather className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">FeatherDrafts</span>
          </div>
          <CardTitle className="text-2xl">{mode === "signin" ? "Welcome back" : "Create your account"}</CardTitle>
          <CardDescription>
            {mode === "signin"
              ? "Sign in to your account to continue"
              : "Sign up to start improving your Twitter writing"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(authError || urlError) && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {authError || urlError}
            </div>
          )}

          {message && (
            <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md">{message}</div>
          )}

          {/* FIXME: Need to set things up to get google to work
            https://supabase.com/dashboard/project/hqqznfgdpnysyjudjmgg/auth/providers?provider=Google
            https://supabase.com/docs/guides/auth/social-login/auth-google */}
          {/* <Button type="button" variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Or continue with</span>
            </div>
          </div> */}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : mode === "signin" ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <div className="text-center text-sm">
            <span className="text-gray-600">
              {mode === "signin" ? "Don't have an account?" : "Already have an account?"}
            </span>{" "}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin")
                clearError()
                setMessage("")
              }}
              className="text-blue-600 hover:underline font-medium"
            >
              {mode === "signin" ? "Sign up" : "Sign in"}
            </button>
          </div>
          <div className="text-center text-sm mt-4 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={handleBackToHome}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              ← Back to Home
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
