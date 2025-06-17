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
import { getThreads, createThread, deleteThread, updateThread, type Thread } from "@/lib/database"
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
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useAuth } from "@/hooks/use-auth"
import { ThreadFilter } from "./thread-filter"

interface ThreadListProps {
  onSelectThread: (threadId: string) => void
  onCreateNew: () => void
}

export function ThreadList({ onSelectThread, onCreateNew }: ThreadListProps) {
  const { user, signOut } = useAuth()
  const [threads, setThreads] = useState<Thread[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newThreadTitle, setNewThreadTitle] = useState("")
  const [newThreadDescription, setNewThreadDescription] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<"all" | "draft" | "archived" | "published">("draft")

  useEffect(() => {
    if (user) {
      loadThreads()
    }
  }, [user])

  const loadThreads = async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const fetchedThreads = await getThreads()
      setThreads(fetchedThreads)
    } catch (err) {
      console.error("Failed to load threads:", err)
      setError("Failed to load threads. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateThread = async () => {
    if (!newThreadTitle.trim() || !user) return

    setIsCreating(true)
    setError(null)

    try {
      const thread = await createThread(newThreadTitle.trim(), newThreadDescription.trim() || undefined)

      if (thread) {
        setThreads([thread, ...threads])
        setIsCreateDialogOpen(false)
        setNewThreadTitle("")
        setNewThreadDescription("")
        onSelectThread(thread.id)
      } else {
        setError("Failed to create thread. Please try again.")
      }
    } catch (err) {
      console.error("Failed to create thread:", err)
      setError("Failed to create thread. Please try again.")
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteThread = async (threadId: string) => {
    if (!user) return

    try {
      const success = await deleteThread(threadId)
      if (success) {
        setThreads(threads.filter((t) => t.id !== threadId))
      } else {
        setError("Failed to delete thread. Please try again.")
      }
    } catch (err) {
      console.error("Failed to delete thread:", err)
      setError("Failed to delete thread. Please try again.")
    }
  }

  const handleArchiveThread = async (threadId: string, shouldArchive: boolean) => {
    if (!user) return

    try {
      const success = await updateThread(threadId, {
        status: shouldArchive ? "archived" : "draft",
      })
      if (success) {
        setThreads(threads.map((t) => (t.id === threadId ? { ...t, status: shouldArchive ? "archived" : "draft" } : t)))
      } else {
        setError(`Failed to ${shouldArchive ? "archive" : "unarchive"} thread. Please try again.`)
      }
    } catch (err) {
      console.error(`Failed to ${shouldArchive ? "archive" : "unarchive"} thread:`, err)
      setError(`Failed to ${shouldArchive ? "archive" : "unarchive"} thread. Please try again.`)
    }
  }

  const handlePublishThread = async (threadId: string) => {
    if (!user) return

    try {
      const success = await updateThread(threadId, {
        status: "published",
        published_at: new Date().toISOString(),
      })
      if (success) {
        setThreads(
          threads.map((t) =>
            t.id === threadId ? { ...t, status: "published", published_at: new Date().toISOString() } : t,
          ),
        )
      } else {
        setError("Failed to mark thread as published. Please try again.")
      }
    } catch (err) {
      console.error("Failed to mark thread as published:", err)
      setError("Failed to mark thread as published. Please try again.")
    }
  }

  const filteredThreads = threads.filter((thread) => {
    // Text search filter
    const matchesSearch =
      thread.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      thread.description?.toLowerCase().includes(searchQuery.toLowerCase())

    // Status filter
    const matchesStatus = activeFilter === "all" || thread.status === activeFilter

    return matchesSearch && matchesStatus
  })

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

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
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
              <Button variant="ghost" size="sm" onClick={signOut} className="text-gray-500 hover:text-gray-700">
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
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Thread</DialogTitle>
                <DialogDescription>
                  Start a new Twitter thread. You can always edit the title and description later.
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
                <div>
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of your thread..."
                    value={newThreadDescription}
                    onChange={(e) => setNewThreadDescription(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={isCreating}>
                  Cancel
                </Button>
                <Button onClick={handleCreateThread} disabled={!newThreadTitle.trim() || isCreating}>
                  {isCreating ? "Creating..." : "Create Thread"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && !isCreateDialogOpen && (
        <div className="mb-6 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
          {error}
          <Button variant="ghost" size="sm" onClick={() => setError(null)} className="ml-2">
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
        <ThreadFilter activeFilter={activeFilter} onFilterChange={setActiveFilter} counts={filterCounts} />
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
              Create Your First Thread
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredThreads.map((thread) => (
            <Card key={thread.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1" onClick={() => onSelectThread(thread.id)}>
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
                    <DropdownMenuContent align="end">
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
