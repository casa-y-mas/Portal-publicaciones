import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: string
  label?: string
  className?: string
}

const statusStyles: Record<string, string> = {
  draft: 'bg-gray-500/10 text-gray-700 dark:text-gray-300 border-transparent',
  pending_approval: 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-transparent',
  approved: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-transparent',
  scheduled: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-transparent',
  publishing: 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-transparent',
  published: 'bg-green-500/10 text-green-700 dark:text-green-300 border-transparent',
  failed: 'bg-red-500/10 text-red-700 dark:text-red-300 border-transparent',
  cancelled: 'bg-neutral-500/10 text-neutral-700 dark:text-neutral-300 border-transparent',
  connected: 'bg-green-500/10 text-green-700 dark:text-green-300 border-transparent',
  token_expiring: 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-transparent',
  disconnected: 'bg-red-500/10 text-red-700 dark:text-red-300 border-transparent',
  active: 'bg-green-500/10 text-green-700 dark:text-green-300 border-transparent',
  inactive: 'bg-neutral-500/10 text-neutral-700 dark:text-neutral-300 border-transparent',
  admin: 'bg-red-500/10 text-red-700 dark:text-red-300 border-transparent',
  supervisor: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-transparent',
  editor: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-transparent',
  viewer: 'bg-neutral-500/10 text-neutral-700 dark:text-neutral-300 border-transparent',
  success: 'bg-green-500/10 text-green-700 dark:text-green-300 border-transparent',
  warning: 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-transparent',
  error: 'bg-red-500/10 text-red-700 dark:text-red-300 border-transparent',
  info: 'bg-gray-500/10 text-gray-700 dark:text-gray-300 border-transparent',
  planning: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-transparent',
}

const statusLabels: Record<string, string> = {
  draft: 'Borrador',
  pending_approval: 'Pendiente',
  approved: 'Aprobado',
  scheduled: 'Programado',
  publishing: 'Publicando',
  published: 'Publicado',
  failed: 'Fallido',
  cancelled: 'Cancelado',
  connected: 'Conectada',
  token_expiring: 'Token por expirar',
  disconnected: 'Desconectada',
  active: 'Activo',
  inactive: 'Inactivo',
  admin: 'Admin',
  supervisor: 'Supervisor',
  editor: 'Editor',
  viewer: 'Visualizador',
  success: 'Exito',
  warning: 'Advertencia',
  error: 'Error',
  info: 'Informacion',
  planning: 'Planificacion',
}

const normalizeStatus = (value: string) => value.trim().toLowerCase().replace(/[\s-]+/g, '_')

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const normalized = normalizeStatus(status)
  const resolvedLabel = label ?? statusLabels[normalized] ?? status
  const resolvedClass = statusStyles[normalized] ?? 'bg-primary/10 text-primary border-transparent'

  return (
    <Badge className={cn('font-semibold', resolvedClass, className)} variant="outline">
      {resolvedLabel}
    </Badge>
  )
}
