'use client'

import { type ReactNode } from 'react'

interface RecurrenceInfo {
  enabled: boolean
  type?: 'hourly' | 'daily' | 'weekday' | 'weekend' | 'weekly' | 'custom' | null
  endType?: 'never' | 'date'
  endDate?: string
  customFrequency?: string
  customInterval?: number
}

interface RecurrenceBadgeProps {
  recurrence?: RecurrenceInfo
}

export function RecurrenceBadge({ recurrence }: RecurrenceBadgeProps): ReactNode {
  if (!recurrence?.enabled) {
    return null
  }

  const getLabel = (): string => {
    switch (recurrence.type) {
      case 'hourly':
        return 'Cada hora'
      case 'daily':
        return 'Diariamente'
      case 'weekday':
        return 'Entre semana'
      case 'weekend':
        return 'Fines de semana'
      case 'weekly':
        return 'Semanalmente'
      case 'custom':
        return `Cada ${recurrence.customInterval} ${recurrence.customFrequency}s`
      default:
        return 'Recurrente'
    }
  }

  return (
    <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded text-xs font-medium">
      <span className="w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
      {getLabel()}
    </div>
  )
}
