'use client'

import { Calendar, Clock, AlertCircle, TrendingUp } from 'lucide-react'
import { dashboardStats } from '@/lib/mock-data'

const stats = [
  {
    label: 'Scheduled Today',
    value: dashboardStats.scheduledToday,
    icon: Clock,
    color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  },
  {
    label: 'This Week',
    value: dashboardStats.scheduledThisWeek,
    icon: Calendar,
    color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  },
  {
    label: 'Pending Approval',
    value: dashboardStats.pendingApproval,
    icon: AlertCircle,
    color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  },
  {
    label: 'Failed Posts',
    value: dashboardStats.failedPosts,
    icon: TrendingUp,
    color: 'bg-red-500/10 text-red-600 dark:text-red-400',
  },
]

export function DashboardStats() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
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
