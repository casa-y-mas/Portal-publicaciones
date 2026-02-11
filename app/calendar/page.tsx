'use client'

import { useState } from 'react'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { CalendarView } from '@/components/calendar/calendar-view'
import { CalendarFilters } from '@/components/calendar/calendar-filters'

export type CalendarViewType = 'month' | 'week' | 'day'

export interface CalendarFilterState {
  platform: string
  status: string
  project: string
  user: string
}

export default function CalendarPage() {
  const [view, setView] = useState<CalendarViewType>('month')
  const [filters, setFilters] = useState<CalendarFilterState>({
    platform: 'all',
    status: 'all',
    project: 'all',
    user: 'all',
  })

  return (
    <div>
      <Breadcrumbs />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Calendario</h1>
        <p className="text-muted-foreground">Vista mensual, semanal y diaria con filtros por red, estado, proyecto y usuario.</p>
      </div>

      <div className="space-y-6">
        <CalendarFilters view={view} onViewChange={setView} filters={filters} onFiltersChange={setFilters} />
        <CalendarView view={view} filters={filters} />
      </div>
    </div>
  )
}
