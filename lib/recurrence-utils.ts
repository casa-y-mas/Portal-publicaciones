export interface RecurrenceInfo {
  enabled: boolean
  type?: 'hourly' | 'daily' | 'weekday' | 'weekend' | 'weekly' | 'custom' | null
  endType?: 'never' | 'date'
  endDate?: string
  customFrequency?: string
  customInterval?: number
}

export function getRecurrenceDates(
  startDate: Date,
  recurrence: RecurrenceInfo,
  limit: number = 12
): Date[] {
  if (!recurrence.enabled) {
    return [startDate]
  }

  const dates: Date[] = [startDate]
  let currentDate = new Date(startDate)
  const endLimit = recurrence.endType === 'date' && recurrence.endDate
    ? new Date(recurrence.endDate)
    : new Date(startDate.getFullYear() + 1, startDate.getMonth(), startDate.getDate())

  let iterations = 0
  const maxIterations = 1000

  while (dates.length < limit && iterations < maxIterations) {
    iterations++
    let nextDate = new Date(currentDate)

    switch (recurrence.type) {
      case 'hourly':
        nextDate.setHours(nextDate.getHours() + 1)
        break
      case 'daily':
        nextDate.setDate(nextDate.getDate() + 1)
        break
      case 'weekday':
        // Find next weekday
        do {
          nextDate.setDate(nextDate.getDate() + 1)
        } while (nextDate.getDay() === 0 || nextDate.getDay() === 6)
        break
      case 'weekend':
        // Find next weekend day
        do {
          nextDate.setDate(nextDate.getDate() + 1)
        } while (nextDate.getDay() !== 0 && nextDate.getDay() !== 6)
        break
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7)
        break
      case 'custom':
        const interval = recurrence.customInterval || 1
        switch (recurrence.customFrequency) {
          case 'hourly':
            nextDate.setHours(nextDate.getHours() + interval)
            break
          case 'daily':
            nextDate.setDate(nextDate.getDate() + interval)
            break
          case 'weekly':
            nextDate.setDate(nextDate.getDate() + interval * 7)
            break
          case 'monthly':
            nextDate.setMonth(nextDate.getMonth() + interval)
            break
          case 'yearly':
            nextDate.setFullYear(nextDate.getFullYear() + interval)
            break
        }
        break
    }

    if (nextDate <= endLimit) {
      dates.push(nextDate)
      currentDate = nextDate
    } else {
      break
    }
  }

  return dates
}

export function getRecurrenceLabel(recurrence: RecurrenceInfo): string {
  if (!recurrence.enabled) {
    return 'No recurrence'
  }

  let label = ''

  switch (recurrence.type) {
    case 'hourly':
      label = 'Every hour'
      break
    case 'daily':
      label = 'Every day'
      break
    case 'weekday':
      label = 'Weekdays (Mon-Fri)'
      break
    case 'weekend':
      label = 'Weekends (Sat-Sun)'
      break
    case 'weekly':
      label = 'Every week'
      break
    case 'custom':
      label = `Every ${recurrence.customInterval} ${recurrence.customFrequency}s`
      break
  }

  if (recurrence.endType === 'date' && recurrence.endDate) {
    label += ` until ${recurrence.endDate}`
  } else if (recurrence.endType === 'never') {
    label += ' (no end date)'
  }

  return label
}
