'use client'

import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ScheduledPostsFiltersProps {
  filters: {
    search: string
    platform: string
    status: string
    project: string
  }
  onFiltersChange: (filters: any) => void
}

export function ScheduledPostsFilters({
  filters,
  onFiltersChange,
}: ScheduledPostsFiltersProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
        <Input
          type="text"
          placeholder="Search posts by title..."
          className="pl-10"
          value={filters.search}
          onChange={(e) =>
            onFiltersChange({ ...filters, search: e.target.value })
          }
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Select
          value={filters.platform}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, platform: value })
          }
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Platform" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Platforms</SelectItem>
            <SelectItem value="instagram">Instagram</SelectItem>
            <SelectItem value="facebook">Facebook</SelectItem>
            <SelectItem value="tiktok">TikTok</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.status}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, status: value })
          }
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="pending-approval">Pending Approval</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.project}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, project: value })
          }
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            <SelectItem value="aurora">Residencial Aurora</SelectItem>
            <SelectItem value="miraflores">Condominio Miraflores</SelectItem>
            <SelectItem value="torres">Torres del Sol</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
