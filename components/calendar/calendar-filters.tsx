'use client'

import { Button } from '@/components/ui/button'
import { users } from '@/lib/mock-data'
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

export function CalendarFilters({ view, onViewChange, filters, onFiltersChange }: CalendarFiltersProps) {
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
              <SelectItem value="all">Todos los estados</SelectItem>
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
    </div>
  )
}
