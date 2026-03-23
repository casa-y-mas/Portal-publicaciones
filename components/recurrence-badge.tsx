'use client'

import { type ReactNode } from 'react'

interface RecurrenceInfo {
  enabled: boolean
  type?: 'hourly' | 'daily' | 'weekday' | 'weekend' | 'weekly' | 'custom' | null
  endType?: 'never' | 'date'
  endDate?: string
  endTime?: string
  customFrequency?: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'minutes'
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
        return 'Cada dia'
      case 'weekday':
        return 'Entre semana'
      case 'weekend':
        return 'Fines de semana'
      case 'weekly':
        return 'Cada semana'
      case 'custom':
        {
          const interval = recurrence.customInterval || 1
          const frequencyKey = recurrence.customFrequency || 'daily'
          const frequencyLabel: Record<string, string> = {
            hourly: 'horas',
            daily: 'dias',
            weekly: 'semanas',
            monthly: 'meses',
            yearly: 'anios',
            minutes: 'minutos',
          }
          return `Cada ${interval} ${frequencyLabel[frequencyKey] ?? frequencyKey}`
        }
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
