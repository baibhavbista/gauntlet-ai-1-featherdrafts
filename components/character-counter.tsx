import { cn } from "@/lib/utils"

interface CharacterCounterProps {
  count: number
  maxCount?: number
  warningThreshold?: number
}

export function CharacterCounter({ count, maxCount = 280, warningThreshold = 250 }: CharacterCounterProps) {
  const isWarning = count >= warningThreshold
  const isError = count > maxCount
  const remaining = maxCount - count

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "text-sm font-medium",
          isError ? "text-red-500" : isWarning ? "text-yellow-500" : "text-gray-500",
        )}
      >
        {remaining < 0 ? `${Math.abs(remaining)} over` : `${remaining} left`}
      </div>
      <div className="relative w-8 h-8">
        <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-200" />
          <circle
            cx="16"
            cy="16"
            r="14"
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 14}`}
            strokeDashoffset={`${2 * Math.PI * 14 * (1 - Math.min(count / maxCount, 1))}`}
            className={cn(
              "transition-all duration-300",
              isError ? "stroke-red-500" : isWarning ? "stroke-yellow-500" : "stroke-blue-500",
            )}
          />
        </svg>
        {isWarning && (
          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center text-xs font-bold",
              isError ? "text-red-500" : "text-yellow-500",
            )}
          >
            {count > maxCount ? count - maxCount : ""}
          </div>
        )}
      </div>
    </div>
  )
}
