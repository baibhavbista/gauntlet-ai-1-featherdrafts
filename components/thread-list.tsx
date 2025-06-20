"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { PageLoading } from "@/components/ui/loading-spinner"
import {
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  FileText,
  Calendar,
  BarChart3,
  MessageSquare,
  Search,
  AlertCircle,
  User,
  LogOut,
  Archive,
  ArchiveRestore,
  CheckCircle,
  Sparkles,
  Type,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useAuth, useThreads } from "@/store"
import { ThreadFilter } from "./thread-filter"
import { estimateTweetCount } from "@/lib/ai"

interface ThreadListProps {
  onSelectThread: (threadId: string) => void
  onCreateNew: () => void
}

export function ThreadList({ onSelectThread, onCreateNew }: ThreadListProps) {
  const { user, signOut } = useAuth()
  const {
    // State
    threads,
    isLoading,
    isCreating,
    error,
    searchQuery,
    statusFilter,
    // Actions  
    loadThreads,
    createThread,
    deleteThread,
    updateThread,
    setSearchQuery,
    setStatusFilter,
    clearError,
    getFilteredThreads,
    optimisticUpdateThread,
  } = useThreads()

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newThreadTitle, setNewThreadTitle] = useState("")
  const [isAiSplitMode, setIsAiSplitMode] = useState(false)
  const [longText, setLongText] = useState("")
  const [tweetCount, setTweetCount] = useState([5]) // Slider component expects array

  const estimatedTweets = estimateTweetCount(longText)

  useEffect(() => {
    if (user) {
      loadThreads()
    }
  }, [user, loadThreads])

  const handleCreateThread = async () => {
    if (!newThreadTitle.trim() || !user) return
    if (isAiSplitMode && !longText.trim()) return

    const thread = await createThread(
      newThreadTitle.trim(), 
      undefined, // No description field anymore
      isAiSplitMode ? longText.trim() : undefined,
      isAiSplitMode ? tweetCount[0] : undefined
    )

    if (thread) {
      setIsCreateDialogOpen(false)
      setNewThreadTitle("")
      setIsAiSplitMode(false)
      setLongText("")
      setTweetCount([5])
      // Add AI success parameter when AI was used
      const threadUrl = isAiSplitMode ? `${thread.id}?ai=success` : thread.id
      onSelectThread(threadUrl)
    }
    // Error handling is done in the store
  }

  const handleDeleteThread = async (threadId: string) => {
    if (!user) return
    // console.log('Deleting thread:', threadId)
    await deleteThread(threadId)
    // Error handling is done in the store
  }

  const handleArchiveThread = async (threadId: string, shouldArchive: boolean) => {
    if (!user) return
    
    // Optimistic update for better UX
    optimisticUpdateThread(threadId, {
      status: shouldArchive ? "archived" : "draft",
    })
    
    // Actual update
    const success = await updateThread(threadId, {
      status: shouldArchive ? "archived" : "draft",
    })
    
    // If update failed, revert optimistic update
    if (!success) {
      optimisticUpdateThread(threadId, {
        status: shouldArchive ? "draft" : "archived",
      })
    }
  }

  const handlePublishThread = async (threadId: string) => {
    if (!user) return
    
    const publishedAt = new Date().toISOString()
    
    // Optimistic update for better UX
    optimisticUpdateThread(threadId, {
      status: "published",
      published_at: publishedAt,
    })
    
    // Actual update
    const success = await updateThread(threadId, {
      status: "published",
      published_at: publishedAt,
    })
    
    // If update failed, revert optimistic update
    if (!success) {
      optimisticUpdateThread(threadId, {
        status: "draft",
        published_at: undefined,
      })
    }
  }

  const filteredThreads = getFilteredThreads()

  // Calculate counts for filter badges
  const filterCounts = {
    all: threads.length,
    draft: threads.filter((t) => t.status === "draft").length,
    archived: threads.filter((t) => t.status === "archived").length,
    published: threads.filter((t) => t.status === "published").length,
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800"
      case "archived":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-blue-100 text-blue-800"
    }
  }

  if (!user) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h3>
        <p className="text-gray-600">Please sign in to view your threads.</p>
      </div>
    )
  }

  if (isLoading) {
    return <PageLoading variant="branded" />
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Your Threads</h1>
          <p className="text-gray-600 mt-1">Manage and edit your Twitter content</p>
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span>{user.user_metadata?.full_name || user.email}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={async () => {
                  await signOut()
                  window.location.href = '/'
                }} 
                className="text-gray-500 hover:text-gray-700"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                New Thread
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Thread</DialogTitle>
                <DialogDescription>
                  {isAiSplitMode 
                    ? "Paste your long-form content and AI will split it into tweet-sized segments."
                    : "Start a new Twitter thread. You can always edit the title and description later."
                  }
                </DialogDescription>
              </DialogHeader>
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">{error}</div>
              )}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter thread title..."
                    value={newThreadTitle}
                    onChange={(e) => setNewThreadTitle(e.target.value)}
                  />
                </div>

                {/* AI Split Toggle */}
                <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-blue-600" />
                    <div>
                      <Label className="text-sm font-medium">AI Thread Splitting</Label>
                      <p className="text-xs text-gray-600">Let AI convert long text into tweet threads</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant={isAiSplitMode ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsAiSplitMode(!isAiSplitMode)}
                    className={isAiSplitMode ? "bg-blue-600 hover:bg-blue-700" : ""}
                  >
                    {isAiSplitMode ? "ON" : "OFF"}
                  </Button>
                </div>

                {isAiSplitMode && (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="longText" className="flex items-center gap-2 mb-2">
                        <Type className="h-4 w-4" />
                        Long-form Content
                      </Label>
                      <Textarea
                        id="longText"
                        placeholder="Paste your long-form content here. AI will intelligently split it into tweet-sized segments while maintaining context and flow..."
                        value={longText}
                        onChange={(e) => setLongText(e.target.value)}
                        rows={8}
                        className="resize-none"
                      />
                    </div>
                    
                    {/* Tweet Count Slider */}
                    <div>
                      <Label className="flex items-center gap-2 mb-3">
                        <MessageSquare className="h-4 w-4" />
                        Target Tweet Count: <span className="font-medium text-blue-600">{tweetCount[0]} tweets</span>
                      </Label>
                      <div className="px-3">
                        <Slider
                          value={tweetCount}
                          onValueChange={setTweetCount}
                          max={10}
                          min={3}
                          step={1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>3</span>
                          <span>10</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsCreateDialogOpen(false)
                    setNewThreadTitle("")
                    setIsAiSplitMode(false)
                    setLongText("")
                    setTweetCount([5])
                  }} 
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateThread} 
                  disabled={
                    !newThreadTitle.trim() || 
                    (isAiSplitMode && !longText.trim()) || 
                    isCreating
                  }
                  className={isAiSplitMode ? "bg-blue-600 hover:bg-blue-700" : ""}
                >
                  {isCreating ? (
                    isAiSplitMode ? (
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 animate-spin" />
                        AI Processing...
                      </div>
                    ) : "Creating..."
                  ) : isAiSplitMode ? (
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Create with AI
                    </div>
                  ) : "Create Thread"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && !isCreateDialogOpen && (
        <div className="mb-6 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
          {error}
          <Button variant="ghost" size="sm" onClick={clearError} className="ml-2">
            Dismiss
          </Button>
        </div>
      )}

      <div className="mb-6">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search threads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <ThreadFilter activeFilter={statusFilter} onFilterChange={setStatusFilter} counts={filterCounts} />
      </div>

      {filteredThreads.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery ? "No threads found" : "No threads yet"}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchQuery ? "Try adjusting your search terms" : "Create your first Twitter thread to get started"}
          </p>
          {!searchQuery && (
            <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Create A New Thread
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredThreads.map((thread) => (
            <Card key={thread.id} className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={(e) => {
              onSelectThread(thread.id)
            }}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{thread.title}</CardTitle>
                      <Badge className={getStatusColor(thread.status)}>{thread.status}</Badge>
                    </div>
                    {thread.description && <p className="text-gray-600 text-sm line-clamp-2">{thread.description}</p>}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end"
                      onClick={(e) => {
                        e.stopPropagation()
                    }}>
                      <DropdownMenuItem onClick={() => onSelectThread(thread.id)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      {thread.status === "archived" ? (
                        <DropdownMenuItem onClick={() => handleArchiveThread(thread.id, false)}>
                          <ArchiveRestore className="h-4 w-4 mr-2" />
                          Unarchive
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => handleArchiveThread(thread.id, true)}>
                          <Archive className="h-4 w-4 mr-2" />
                          Archive
                        </DropdownMenuItem>
                      )}
                      {thread.status === "published" ? (
                        <DropdownMenuItem onClick={() => handleArchiveThread(thread.id, false)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Mark as Draft
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => handlePublishThread(thread.id)}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark as Published
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleDeleteThread(thread.id)} className="text-red-600">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      <span>{thread.total_tweets} tweets</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BarChart3 className="h-4 w-4" />
                      <span>{thread.total_characters} chars</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDistanceToNow(new Date(thread.updated_at), { addSuffix: true })}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
