import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

export async function signInAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('Sign in error:', error)
    redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  redirect('/threads')
}

export async function signUpAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string

  const supabase = await createClient()
  const origin = (await headers()).get('origin')

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        full_name: fullName,
      },
    },
  })

  if (error) {
    console.error('Sign up error:', error)
    redirect(`/signup?error=${encodeURIComponent(error.message)}`)
  }

  redirect('/signup?message=Check your email to continue sign in process')
}

export async function signOutAction() {
  const supabase = await createClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('Sign out error:', error)
    redirect(`/?error=${encodeURIComponent(error.message)}`)
  }

  redirect('/')
} 