import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Validates a redirect URL to prevent open redirect attacks
 * Only allows internal routes starting with '/'
 * @param url - The URL to validate
 * @returns The sanitized URL if valid, null if invalid
 */
export function validateRedirectUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') {
    return null
  }

  // Decode the URL in case it's encoded
  let decodedUrl: string
  try {
    decodedUrl = decodeURIComponent(url)
  } catch {
    // If decoding fails, treat as invalid
    return null
  }

  // Trim whitespace
  decodedUrl = decodedUrl.trim()

  // Must start with '/' (internal route)
  if (!decodedUrl.startsWith('/')) {
    return null
  }

  // Block external URLs and protocol-relative URLs
  if (
    decodedUrl.startsWith('//') ||
    decodedUrl.includes('://') ||
    decodedUrl.includes('javascript:') ||
    decodedUrl.includes('data:') ||
    decodedUrl.includes('vbscript:')
  ) {
    return null
  }

  // Block URLs with suspicious patterns
  if (
    decodedUrl.includes('<') ||
    decodedUrl.includes('>') ||
    decodedUrl.includes('"') ||
    decodedUrl.includes("'")
  ) {
    return null
  }

  // Additional safety: ensure it looks like a valid route
  if (decodedUrl.length > 200) {
    return null
  }

  return decodedUrl
}
