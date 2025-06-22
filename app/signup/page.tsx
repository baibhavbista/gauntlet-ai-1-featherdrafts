import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { AuthForm } from '@/components/auth/auth-form'
import { validateRedirectUrl } from '@/lib/utils'

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // If user is already authenticated, redirect to threads or the specified redirect URL
  if (user) {
    const redirectToParam = params.redirectTo as string
    const validatedRedirectTo = validateRedirectUrl(redirectToParam)
    const destination = validatedRedirectTo || '/threads'
    redirect(destination)
  }

  const error = params.error as string
  const message = params.message as string

  return (
    <main className="min-h-screen">
      <AuthForm 
        error={error}
      />
      {message && (
        <div className="fixed bottom-4 right-4 bg-green-50 border border-green-200 text-green-800 px-4 py-2 rounded-md shadow-lg">
          {decodeURIComponent(message)}
        </div>
      )}
    </main>
  )
} 