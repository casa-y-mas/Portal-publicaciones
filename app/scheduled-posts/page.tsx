'use client'

import { useState } from 'react'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { ScheduledPostsTable } from '@/components/scheduled-posts/scheduled-posts-table'
import { ScheduledPostsFilters } from '@/components/scheduled-posts/scheduled-posts-filters'

export default function ScheduledPostsPage() {
  const [filters, setFilters] = useState({
    search: '',
    platform: 'all',
    status: 'all',
    project: 'all',
    user: 'all',
  })

  return (
    <div>
      <Breadcrumbs />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Publicaciones programadas</h1>
        <p className="text-muted-foreground">Gestion completa de borrador, aprobacion, publicacion y cancelacion.</p>
      </div>

      <div className="space-y-6">
        <ScheduledPostsFilters filters={filters} onFiltersChange={setFilters} />
        <ScheduledPostsTable filters={filters} />
      </div>
    </div>
  )
}
