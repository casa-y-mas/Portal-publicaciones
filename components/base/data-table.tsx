import type { ReactNode } from 'react'

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

export interface DataTableColumn {
  key: string
  label: string
  className?: string
}

interface DataTableProps {
  columns: DataTableColumn[]
  children: ReactNode
  title?: string
  empty?: boolean
  emptyMessage?: string
  className?: string
}

export function DataTableCard({
  columns,
  children,
  title,
  empty = false,
  emptyMessage = 'No hay registros.',
  className,
}: DataTableProps) {
  return (
    <div className={cn('bg-card border border-border rounded-lg overflow-hidden', className)}>
      {title ? (
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
      ) : null}

      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.key} className={cn('text-sm font-semibold', column.className)}>
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>{children}</TableBody>
      </Table>

      {empty ? (
        <div className="p-12 text-center">
          <p className="text-muted-foreground">{emptyMessage}</p>
        </div>
      ) : null}
    </div>
  )
}
