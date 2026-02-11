'use client'

import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
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

export function ScheduledPostsFilters({ filters, onFiltersChange }: ScheduledPostsFiltersProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
        <Input
          type="text"
          placeholder="Buscar por titulo o caption..."
          className="pl-10"
          value={filters.search}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
        />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
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
            <SelectItem value="approved">Aprobado</SelectItem>
            <SelectItem value="scheduled">Programado</SelectItem>
            <SelectItem value="publishing">Publicando</SelectItem>
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
            <SelectItem value="Residencial Aurora">Residencial Aurora</SelectItem>
            <SelectItem value="Condominio Miraflores">Condominio Miraflores</SelectItem>
            <SelectItem value="Torres del Sol">Torres del Sol</SelectItem>
            <SelectItem value="Vista Horizonte">Vista Horizonte</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.user} onValueChange={(value) => onFiltersChange({ ...filters, user: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Usuario" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los usuarios</SelectItem>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.name}>
                {user.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
