'use client'

import { useEffect, useState } from 'react'

import { DataFilters } from '@/components/base/data-filters'
import { users } from '@/lib/mock-data'
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
    user: string
  }
  onFiltersChange: (filters: ScheduledPostsFiltersProps['filters']) => void
}

interface ProjectOption {
  id: string
  name: string
}

export function ScheduledPostsFilters({ filters, onFiltersChange }: ScheduledPostsFiltersProps) {
  const [projects, setProjects] = useState<ProjectOption[]>([])
  const clientUsers = users.filter((user) => user.role === 'editor')

  useEffect(() => {
    let mounted = true
    const loadProjects = async () => {
      try {
        const response = await fetch('/api/projects')
        if (!response.ok) return
        const json = await response.json()
        if (!mounted) return
        setProjects((json.items ?? []).map((item: { id: string; name: string }) => ({ id: item.id, name: item.name })))
      } catch {
        if (mounted) setProjects([])
      }
    }

    loadProjects()
    return () => {
      mounted = false
    }
  }, [])

  const resetFilters = () =>
    onFiltersChange({
      search: '',
      platform: 'all',
      status: 'all',
      project: 'all',
      user: 'all',
    })

  return (
    <DataFilters
      search={filters.search}
      onSearchChange={(value) => onFiltersChange({ ...filters, search: value })}
      searchPlaceholder="Buscar por titulo o caption..."
      onReset={resetFilters}
    >
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
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="draft">Borrador</SelectItem>
          <SelectItem value="pending-approval">Pendiente</SelectItem>
          <SelectItem value="scheduled">Programado</SelectItem>
          <SelectItem value="published">Publicado</SelectItem>
          <SelectItem value="failed">Fallido</SelectItem>
          <SelectItem value="cancelled">Cancelado</SelectItem>
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
          {clientUsers.map((user) => (
            <SelectItem key={user.id} value={user.name}>
              {user.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </DataFilters>
  )
}
