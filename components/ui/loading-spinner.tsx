import { Loader2, Feather } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl"
  variant?: "default" | "branded" | "minimal"
  text?: string
  className?: string
}

export function LoadingSpinner({ 
  size = "md", 
  variant = "default", 
  text,
  className 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8",
    xl: "h-12 w-12"
  }

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg", 
    xl: "text-xl"
  }

  if (variant === "branded") {
    return (
      <div className={cn("flex flex-col items-center justify-center space-y-4", className)}>
        <div className="bg-blue-600 p-3 rounded-lg animate-spin">
          <Feather className={cn(sizeClasses[size], "text-white")} />
        </div>
        {text && (
          <div className="text-center">
            <span className={cn("font-medium text-gray-900", textSizeClasses[size])}>
              {text}
            </span>
          </div>
        )}
      </div>
    )
  }

  if (variant === "minimal") {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <Loader2 className={cn(sizeClasses[size], "animate-spin text-blue-600")} />
      </div>
    )
  }

  // Default variant
  return (
    <div className={cn("flex flex-col items-center justify-center space-y-2", className)}>
      <Loader2 className={cn(sizeClasses[size], "animate-spin text-blue-600")} />
      {text && (
        <span className={cn("text-gray-600", textSizeClasses[size])}>
          {text}
        </span>
      )}
    </div>
  )
}

// Full page loading component
export function PageLoading({ 
  text = "Loading...",
  variant = "branded" 
}: Pick<LoadingSpinnerProps, "text" | "variant">) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <LoadingSpinner variant={variant} size="lg" text={text} />
    </div>
  )
} 