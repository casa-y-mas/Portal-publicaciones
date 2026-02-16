import { Calendar, Clock, AlertCircle, TrendingUp } from 'lucide-react'
import type { DashboardStatsData } from '@/lib/dashboard-data'

export function DashboardStats({ stats }: { stats: DashboardStatsData }) {
  const items = [
    {
      label: 'Programadas hoy',
      value: stats.scheduledToday,
      icon: Clock,
      color: 'bg-primary/12 text-primary',
      note: 'Seguimiento diario',
    },
    {
      label: 'Esta semana',
      value: stats.scheduledThisWeek,
      icon: Calendar,
      color: 'bg-accent/15 text-accent',
      note: 'Ritmo semanal',
    },
    {
      label: 'Pendientes de aprobacion',
      value: stats.pendingApproval,
      icon: AlertCircle,
      color: 'bg-orange-500/15 text-orange-500',
      note: 'Cola de revision',
    },
    {
      label: 'Publicaciones fallidas',
      value: stats.failedPosts,
      icon: TrendingUp,
      color: 'bg-red-500/15 text-red-500',
      note: 'Atencion operativa',
    },
  ]

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((stat) => {
        const Icon = stat.icon
        return (
          <div
            key={stat.label}
            className="surface-card enter-up p-5 hover:border-primary/35 transition-all"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                <p className="text-3xl font-semibold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.note}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-xl`}>
                <Icon size={20} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
