import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function AuthCallback({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const error = params.error as string
  const code = params.code as string
  
  // Extract token and type from URL fragments (Supabase sometimes uses these)
  const token_hash = params.token_hash as string
  const type = params.type as string
  const access_token = params.access_token as string
  const refresh_token = params.refresh_token as string

  // Determine redirect destination based on auth type
  // For email verification (signup), redirect to login page
  // For other auth flows, use provided redirect or default to threads
  const isEmailVerification = type === 'email' || type === 'signup' || type === 'recovery'
  const defaultRedirect = isEmailVerification ? '/login' : '/threads'
  const next = params.next ?? params.redirect_to ?? defaultRedirect

  console.log('Auth callback - Environment check:', {
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  })
  
  console.log('Auth callback - Received params:', {
    hasCode: !!code,
    hasError: !!error,
    hasTokenHash: !!token_hash,
    hasAccessToken: !!access_token,
    hasRefreshToken: !!refresh_token,
    type: type,
    isEmailVerification: isEmailVerification,
    redirectTo: next,
    allParamKeys: Object.keys(params)
  })

  // If there's an error parameter, redirect to login with error
  if (error) {
    console.log('Auth callback error from params:', error)
    redirect('/login?error=' + encodeURIComponent(error))
  }

  const supabase = await createClient()

  // Try code exchange first (PKCE flow)
  if (code) {
    try {
      console.log('Auth callback - Attempting code exchange')
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (!exchangeError && data?.user) {
        console.log('Auth callback - Code exchange successful')
        // Add success message for email verification
        const redirectUrl = isEmailVerification 
          ? `/login?message=${encodeURIComponent('Email verified successfully! Please sign in to continue.')}`
          : next
        redirect(redirectUrl as string) // This will throw NEXT_REDIRECT - that's normal!
      } else {
        console.error('Auth callback - Code exchange failed:', exchangeError?.message)
      }
    } catch (err) {
      // Only catch non-redirect exceptions
      if (err instanceof Error && err.message === 'NEXT_REDIRECT') {
        throw err // Re-throw redirect errors
      }
      console.error('Auth callback - Code exchange exception:', err)
    }
  }

  // Try token hash verification (OTP flow)
  if (token_hash && type) {
    try {
      console.log('Auth callback - Attempting token hash verification')
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        token_hash,
        type: type as any,
      })
      
      if (!verifyError && data?.user) {
        console.log('Auth callback - Token verification successful')
        // Add success message for email verification
        const redirectUrl = isEmailVerification 
          ? `/login?message=${encodeURIComponent('Email verified successfully! Please sign in to continue.')}`
          : next
        redirect(redirectUrl as string) // This will throw NEXT_REDIRECT - that's normal!
      } else {
        console.error('Auth callback - Token verification failed:', verifyError?.message)
      }
    } catch (err) {
      // Only catch non-redirect exceptions
      if (err instanceof Error && err.message === 'NEXT_REDIRECT') {
        throw err // Re-throw redirect errors
      }
      console.error('Auth callback - Token verification exception:', err)
    }
  }

  // Try to set session manually if we have tokens
  if (access_token && refresh_token) {
    try {
      console.log('Auth callback - Attempting manual session setup')
      const { data, error: sessionError } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      })
      
      if (!sessionError && data?.user) {
        console.log('Auth callback - Manual session setup successful')
        // Add success message for email verification
        const redirectUrl = isEmailVerification 
          ? `/login?message=${encodeURIComponent('Email verified successfully! Please sign in to continue.')}`
          : next
        redirect(redirectUrl as string) // This will throw NEXT_REDIRECT - that's normal!
      } else {
        console.error('Auth callback - Manual session setup failed:', sessionError?.message)
      }
    } catch (err) {
      // Only catch non-redirect exceptions
      if (err instanceof Error && err.message === 'NEXT_REDIRECT') {
        throw err // Re-throw redirect errors
      }
      console.error('Auth callback - Manual session setup exception:', err)
    }
  }

  // Check if user is already authenticated (session might be set in cookies)
  try {
    console.log('Auth callback - Checking existing session')
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (user && !userError) {
      console.log('Auth callback - Existing session found, user authenticated')
      // Add success message for email verification
      const redirectUrl = isEmailVerification 
        ? `/login?message=${encodeURIComponent('Email verified successfully! Please sign in to continue.')}`
        : next
      redirect(redirectUrl as string) // This will throw NEXT_REDIRECT - that's normal!
    } else {
      console.log('Auth callback - No existing session:', userError?.message)
    }
  } catch (err) {
    // Only catch non-redirect exceptions
    if (err instanceof Error && err.message === 'NEXT_REDIRECT') {
      throw err // Re-throw redirect errors
    }
    console.error('Auth callback - Session check exception:', err)
  }

  // If we get here, all authentication attempts failed
  console.log('Auth callback - All authentication methods failed')
  redirect('/login?error=' + encodeURIComponent('Email verification failed. Please try signing up again or contact support.'))
}

