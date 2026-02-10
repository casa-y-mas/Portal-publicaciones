'use client'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface CalendarFiltersProps {
  view: 'month' | 'week'
  onViewChange: (view: 'month' | 'week') => void
  filters: {
    platform: string
    status: string
    project: string
  }
  onFiltersChange: (filters: any) => void
}

export function CalendarFilters({
  view,
  onViewChange,
  filters,
  onFiltersChange,
}: CalendarFiltersProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-4">
      <div className="flex flex-col md:flex-row gap-4 md:items-end">
        {/* View Toggle */}
        <div className="flex gap-2">
          <Button
            variant={view === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onViewChange('month')}
          >
            Month
          </Button>
          <Button
            variant={view === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onViewChange('week')}
          >
            Week
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
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
              <SelectItem value="youtube">YouTube</SelectItem>
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
              <SelectItem value="pending">Pending Approval</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
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
    </div>
  )
}
