'use client'

import type { ReactNode } from 'react'
import { Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface DataFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  children?: ReactNode
  onReset?: () => void
}

export function DataFilters({
  search,
  onSearchChange,
  searchPlaceholder = 'Buscar...',
  children,
  onReset,
}: DataFiltersProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <Input
          type="text"
          placeholder={searchPlaceholder}
          className="pl-10"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 flex-1">{children}</div>
        {onReset ? (
          <Button variant="outline" onClick={onReset}>
            Limpiar filtros
          </Button>
        ) : null}
      </div>
    </div>
  )
}
