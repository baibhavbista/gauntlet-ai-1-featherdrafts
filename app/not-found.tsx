"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Home, ArrowLeft, Search, Feather } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Feather className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">FeatherDrafts</span>
          </div>
          <CardTitle className="text-6xl font-bold text-gray-900 mb-2">404</CardTitle>
          <p className="text-xl text-gray-600">Page Not Found</p>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            The page you're looking for doesn't exist or has been moved.
          </p>
          
          <div className="space-y-3">
            <Link href="/" className="block">
              <Button className="w-full" variant="default">
                <Home className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            
            <Link href="/threads" className="block">
              <Button className="w-full" variant="outline">
                <Search className="h-4 w-4 mr-2" />
                View Your Threads
              </Button>
            </Link>
            
            <Button 
              variant="ghost" 
              className="w-full"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
          
          <p className="text-sm text-gray-500">
            If you think this is a mistake, please contact support.
          </p>
        </CardContent>
      </Card>
    </div>
  )
} 