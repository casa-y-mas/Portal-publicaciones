'use client'

import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import type { CalendarFilterState, CalendarViewType } from '@/app/calendar/page'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface CalendarFiltersProps {
  view: CalendarViewType
  onViewChange: (view: CalendarViewType) => void
  filters: CalendarFilterState
  onFiltersChange: (filters: CalendarFilterState) => void
}

interface ProjectOption {
  id: string
  name: string
}

interface ScheduledPostCreator {
  creator: string
}

export function CalendarFilters({ view, onViewChange, filters, onFiltersChange }: CalendarFiltersProps) {
  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [creators, setCreators] = useState<string[]>([])

  useEffect(() => {
    let mounted = true

    const loadFiltersData = async () => {
      try {
        const [projectsResponse, postsResponse] = await Promise.all([fetch('/api/projects'), fetch('/api/scheduled-posts')])

        if (projectsResponse.ok) {
          const projectsJson = await projectsResponse.json()
          if (mounted) {
            setProjects((projectsJson.items ?? []).map((project: { id: string; name: string }) => ({ id: project.id, name: project.name })))
          }
        }

        if (postsResponse.ok) {
          const postsJson = await postsResponse.json()
          const uniqueCreators = Array.from(
            new Set((postsJson.items ?? []).map((post: ScheduledPostCreator) => post.creator).filter(Boolean)),
          ) as string[]
          if (mounted) {
            setCreators(uniqueCreators.sort((a, b) => a.localeCompare(b)))
          }
        }
      } catch {
        if (mounted) {
          setProjects([])
          setCreators([])
        }
      }
    }

    loadFiltersData()

    return () => {
      mounted = false
    }
  }, [])

  const statusOptions = useMemo(
    () => [
      { value: 'all', label: 'Todos los estados' },
      { value: 'draft', label: 'Borrador' },
      { value: 'pending-approval', label: 'Pendiente' },
      { value: 'scheduled', label: 'Programado' },
      { value: 'published', label: 'Publicado' },
      { value: 'failed', label: 'Fallido' },
      { value: 'cancelled', label: 'Cancelado' },
    ],
    [],
  )

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-4">
      <div className="flex flex-col lg:flex-row gap-3 lg:items-end">
        <div className="flex gap-2">
          <Button variant={view === 'month' ? 'default' : 'outline'} size="sm" onClick={() => onViewChange('month')}>
            Mes
          </Button>
          <Button variant={view === 'week' ? 'default' : 'outline'} size="sm" onClick={() => onViewChange('week')}>
            Semana
          </Button>
          <Button variant={view === 'day' ? 'default' : 'outline'} size="sm" onClick={() => onViewChange('day')}>
            Dia
          </Button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 flex-1">
          <Select value={filters.platform} onValueChange={(value) => onFiltersChange({ ...filters, platform: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Red" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las redes</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="tiktok">TikTok</SelectItem>
              <SelectItem value="youtube">YouTube Shorts</SelectItem>
              <SelectItem value="x">X</SelectItem>
              <SelectItem value="linkedin">LinkedIn</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.status} onValueChange={(value) => onFiltersChange({ ...filters, status: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.project} onValueChange={(value) => onFiltersChange({ ...filters, project: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Proyecto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los proyectos</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.user} onValueChange={(value) => onFiltersChange({ ...filters, user: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Usuario" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los usuarios</SelectItem>
              {creators.map((creator) => (
                <SelectItem key={creator} value={creator}>
                  {creator}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            onFiltersChange({
              platform: 'all',
              status: 'all',
              project: 'all',
              user: 'all',
            })
          }
        >
          Limpiar filtros
        </Button>
      </div>
    </div>
  )
}
