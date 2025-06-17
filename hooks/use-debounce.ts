"use client"

import { useCallback, useRef } from "react"

export function useDebounce<T extends (...args: any[]) => any>(callback: T, delay: number): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      // Clear the previous timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // Set a new timeout
      timeoutRef.current = setTimeout(() => {
        callback(...args)
      }, delay)
    },
    [callback, delay],
  ) as T

  // Cleanup function to clear timeout on unmount
  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  // Add cancel method to the debounced function
  ;(debouncedCallback as any).cancel = cancel

  return debouncedCallback
}
