import { Calendar, Clock, AlertCircle, TrendingUp } from 'lucide-react'
import type { DashboardStatsData } from '@/lib/dashboard-data'

export function DashboardStats({ stats }: { stats: DashboardStatsData }) {
  const items = [
    {
      label: 'Scheduled Today',
      value: stats.scheduledToday,
      icon: Clock,
      color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    },
    {
      label: 'This Week',
      value: stats.scheduledThisWeek,
      icon: Calendar,
      color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    },
    {
      label: 'Pending Approval',
      value: stats.pendingApproval,
      icon: AlertCircle,
      color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    },
    {
      label: 'Failed Posts',
      value: stats.failedPosts,
      icon: TrendingUp,
      color: 'bg-red-500/10 text-red-600 dark:text-red-400',
    },
  ]

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((stat) => {
        const Icon = stat.icon
        return (
          <div
            key={stat.label}
            className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-foreground">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <Icon size={20} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
