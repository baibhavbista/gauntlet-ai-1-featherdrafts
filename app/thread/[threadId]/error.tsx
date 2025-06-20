"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileX, ArrowLeft, Home, RefreshCw, Feather } from "lucide-react"

interface ThreadErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ThreadError({ error, reset }: ThreadErrorProps) {
  useEffect(() => {
    console.error('Thread error:', error)
  }, [error])

  // Determine error type from message
  const isNotFound = error.message.includes('not found') || error.message.includes('404')
  const isUnauthorized = error.message.includes('unauthorized') || error.message.includes('403')

  const getErrorContent = () => {
    if (isNotFound) {
      return {
        title: "Thread Not Found",
        description: "The thread you're looking for doesn't exist or has been deleted.",
        icon: <FileX className="h-16 w-16 text-orange-500" />,
        bgColor: "from-orange-50 via-white to-yellow-50"
      }
    }

    if (isUnauthorized) {
      return {
        title: "Access Denied",
        description: "You don't have permission to view this thread.",
        icon: <FileX className="h-16 w-16 text-red-500" />,
        bgColor: "from-red-50 via-white to-pink-50"
      }
    }

    return {
      title: "Thread Error",
      description: "Something went wrong while loading this thread.",
      icon: <FileX className="h-16 w-16 text-gray-500" />,
      bgColor: "from-gray-50 via-white to-slate-50"
    }
  }

  const { title, description, icon, bgColor } = getErrorContent()

  return (
    <div className={`min-h-screen bg-gradient-to-br ${bgColor} flex items-center justify-center p-4`}>
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Feather className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">FeatherDrafts</span>
          </div>
          <div className="flex items-center justify-center mb-4">
            {icon}
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
            {title}
          </CardTitle>
          <p className="text-gray-600">
            {description}
          </p>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {process.env.NODE_ENV === 'development' && (
            <div className="text-left bg-gray-100 p-3 rounded-md">
              <p className="text-sm font-mono text-red-600">
                {error.message}
              </p>
              {error.digest && (
                <p className="text-xs text-gray-500 mt-1">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          )}
          
          <div className="space-y-3">
            {!isNotFound && !isUnauthorized && (
              <Button 
                className="w-full" 
                onClick={reset}
                variant="default"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}
            
            <Link href="/threads" className="block">
              <Button className="w-full" variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Threads
              </Button>
            </Link>
            
            <Link href="/" className="block">
              <Button className="w-full" variant="ghost">
                <Home className="h-4 w-4 mr-2" />
                Go to Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 