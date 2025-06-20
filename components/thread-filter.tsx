"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Archive, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface ThreadFilterProps {
  activeFilter: "all" | "draft" | "archived" | "published"
  onFilterChange: (filter: "all" | "draft" | "archived" | "published") => void
  counts: {
    all: number
    draft: number
    archived: number
    published: number
  }
}

export function ThreadFilter({ activeFilter, onFilterChange, counts }: ThreadFilterProps) {
  const filters = [
    { key: "all" as const, label: "All", icon: FileText, count: counts.all },
    { key: "draft" as const, label: "Drafts", icon: FileText, count: counts.draft },
    { key: "published" as const, label: "Published", icon: CheckCircle, count: counts.published },
    { key: "archived" as const, label: "Archived", icon: Archive, count: counts.archived },
  ]

  return (
    <div className="flex gap-2 mb-6 overflow-x-auto">
      {filters.map((filter) => {
        const Icon = filter.icon
        const isActive = activeFilter === filter.key

        return (
          <Button
            key={filter.key}
            variant={isActive ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterChange(filter.key)}
            className={cn("flex items-center gap-2 whitespace-nowrap", isActive && "bg-blue-600 hover:bg-blue-700")}
          >
            <Icon className="h-4 w-4" />
            {filter.label}
            {filter.count > 0 && (
              <Badge
                variant={isActive ? "secondary" : "outline"}
                className={cn("ml-1", isActive && "bg-blue-100 text-blue-800")}
              >
                {filter.count}
              </Badge>
            )}
          </Button>
        )
      })}
    </div>
  )
}
