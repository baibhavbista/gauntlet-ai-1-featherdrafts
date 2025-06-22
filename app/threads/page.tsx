import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { ThreadList } from '@/components/thread-list'

export default async function ThreadsPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  // Redirect to login if not authenticated
  if (error || !user) {
    redirect('/login?redirectTo=%2Fthreads')
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <ThreadList />
    </main>
  )
} 