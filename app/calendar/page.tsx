'use client'

import { useState } from 'react'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { CalendarView } from '@/components/calendar/calendar-view'
import { CalendarFilters } from '@/components/calendar/calendar-filters'

export default function CalendarPage() {
  const [view, setView] = useState<'month' | 'week'>('month')
  const [filters, setFilters] = useState({
    platform: 'all',
    status: 'all',
    project: 'all',
  })

  return (
    <div>
      <Breadcrumbs />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Calendar</h1>
        <p className="text-muted-foreground">View and manage your scheduled posts</p>
      </div>

      <div className="space-y-6">
        <CalendarFilters
          view={view}
          onViewChange={setView}
          filters={filters}
          onFiltersChange={setFilters}
        />

        <CalendarView view={view} filters={filters} />
      </div>
    </div>
  )
}
