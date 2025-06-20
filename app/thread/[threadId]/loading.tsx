import { Loader2, FileText, Feather } from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function ThreadLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header skeleton */}
      <div className="max-w-2xl mx-auto p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="flex-1">
                <div className="h-8 bg-gray-200 rounded w-3/4 animate-pulse"></div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-24 h-8 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
          
          {/* Stats skeleton */}
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Loading indicator - using single branded spinner */}
        <div className="text-center py-12">
          <LoadingSpinner variant="branded" size="lg" text="Loading..." />
        </div>

        {/* Content skeleton */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg border p-4">
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
                  <FileText className="h-4 w-4 text-gray-400" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-4/5 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/5 animate-pulse"></div>
                </div>
                <div className="w-12 h-6 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 