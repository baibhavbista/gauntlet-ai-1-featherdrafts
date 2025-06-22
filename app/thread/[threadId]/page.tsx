import { createClient } from '@/utils/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ThreadDetail } from '@/components/thread-detail'

export default async function ThreadDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ threadId: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const paramsData = await params
  const searchParamsData = await searchParams
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  // Redirect to login if not authenticated
  if (error || !user) {
    const redirectTo = encodeURIComponent(`/thread/${paramsData.threadId}`)
    redirect(`/login?redirectTo=${redirectTo}`)
  }

  const threadId = paramsData.threadId
  
  // Validate threadId format (UUID)
  if (!threadId || typeof threadId !== 'string') {
    notFound()
  }

  // Basic UUID validation
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(threadId)) {
    notFound()
  }

  const isAiGenerated = searchParamsData.ai === 'success'

  return (
    <main className="min-h-screen bg-gray-50">
      <ThreadDetail 
        threadId={threadId}
        isAiGenerated={isAiGenerated}
      />
    </main>
  )
} 