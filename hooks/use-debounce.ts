"use client"

import { useCallback, useRef } from "react"

export function useDebounce<T extends (...args: any[]) => any>(callback: T, delay: number): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const callbackRef = useRef(callback)

  // Keep the callback ref up to date
  callbackRef.current = callback

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      console.log("debouncedCallback called with args:", args.length > 0 ? "segments array" : "no args")
      
      // Clear the previous timeout
      if (timeoutRef.current) {
        console.log("Clearing previous timeout")
        clearTimeout(timeoutRef.current)
      }

      // Set a new timeout
      timeoutRef.current = setTimeout(() => {
        console.log("Executing debounced callback after", delay, "ms")
        callbackRef.current(...args)
      }, delay)
    },
    [delay],
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
