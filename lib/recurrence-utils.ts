export interface RecurrenceInfo {
  enabled: boolean
  type?: 'hourly' | 'daily' | 'weekday' | 'weekend' | 'weekly' | 'custom' | null
  endType?: 'never' | 'date'
  endDate?: string
  endTime?: string
  customFrequency?: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'minutes'
  customInterval?: number
  customWeekDays?: number[]
  customMonthDay?: number
  customYearDate?: string
}

const isSameInstant = (a: Date, b: Date) => a.getTime() === b.getTime()

const nextWeeklyCustomDate = (current: Date, selectedDays: number[], intervalWeeks: number): Date => {
  const ordered = [...selectedDays].sort((a, b) => a - b)
  if (ordered.length === 0) {
    const fallback = new Date(current)
    fallback.setDate(fallback.getDate() + 7 * intervalWeeks)
    return fallback
  }

  for (const day of ordered) {
    const candidate = new Date(current)
    const distance = (day - candidate.getDay() + 7) % 7
    if (distance > 0) {
      candidate.setDate(candidate.getDate() + distance)
      return candidate
    }
  }

  const rollover = new Date(current)
  const distance = (ordered[0] - rollover.getDay() + 7) % 7
  rollover.setDate(rollover.getDate() + distance + (intervalWeeks - 1) * 7 + 7)
  return rollover
}

function getRecurrenceEndLimit(startDate: Date, recurrence: RecurrenceInfo) {
  if (recurrence.endType === 'date' && recurrence.endDate) {
    return recurrence.endTime
      ? new Date(`${recurrence.endDate}T${recurrence.endTime}`)
      : new Date(`${recurrence.endDate}T23:59`)
  }

  return new Date(startDate.getFullYear() + 1, startDate.getMonth(), startDate.getDate())
}

function stepRecurrenceDate(current: Date, recurrence: RecurrenceInfo): Date {
  const nextDate = new Date(current)

  switch (recurrence.type) {
    case 'hourly':
      nextDate.setHours(nextDate.getHours() + 1)
      break
    case 'daily':
      nextDate.setDate(nextDate.getDate() + 1)
      break
    case 'weekday':
      do {
        nextDate.setDate(nextDate.getDate() + 1)
      } while (nextDate.getDay() === 0 || nextDate.getDay() === 6)
      break
    case 'weekend':
      do {
        nextDate.setDate(nextDate.getDate() + 1)
      } while (nextDate.getDay() !== 0 && nextDate.getDay() !== 6)
      break
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7)
      break
    case 'custom': {
      const interval = recurrence.customInterval || 1
      switch (recurrence.customFrequency) {
        case 'hourly':
          nextDate.setHours(nextDate.getHours() + interval)
          break
        case 'daily':
          nextDate.setDate(nextDate.getDate() + interval)
          break
        case 'minutes':
          nextDate.setTime(nextDate.getTime() + interval * 60 * 1000)
          break
        case 'weekly': {
          const weekly = nextWeeklyCustomDate(nextDate, recurrence.customWeekDays || [], interval)
          nextDate.setTime(weekly.getTime())
          break
        }
        case 'monthly': {
          const targetDay = recurrence.customMonthDay || nextDate.getDate()
          nextDate.setMonth(nextDate.getMonth() + interval)
          nextDate.setDate(Math.min(targetDay, 28))
          break
        }
        case 'yearly': {
          nextDate.setFullYear(nextDate.getFullYear() + interval)
          if (recurrence.customYearDate) {
            const source = new Date(recurrence.customYearDate)
            if (!Number.isNaN(source.getTime())) {
              nextDate.setMonth(source.getMonth(), source.getDate())
            }
          }
          break
        }
        default:
          nextDate.setDate(nextDate.getDate() + interval)
      }
      break
    }
    default:
      nextDate.setDate(nextDate.getDate() + 1)
  }

  return nextDate
}

export function getNextRecurrenceDate(
  currentDate: Date,
  recurrence: RecurrenceInfo,
  minimumDateExclusive?: Date,
): Date | null {
  if (!recurrence.enabled) {
    return null
  }

  const endLimit = getRecurrenceEndLimit(currentDate, recurrence)
  let candidate = stepRecurrenceDate(currentDate, recurrence)
  let iterations = 0
  const maxIterations = 1000

  while (iterations < maxIterations) {
    iterations += 1

    if (candidate > endLimit) {
      return null
    }

    if (!minimumDateExclusive || candidate > minimumDateExclusive) {
      return candidate
    }

    candidate = stepRecurrenceDate(candidate, recurrence)
  }

  return null
}

export function getRecurrenceDates(startDate: Date, recurrence: RecurrenceInfo, limit = 12): Date[] {
  if (!recurrence.enabled) {
    return [startDate]
  }

  const dates: Date[] = [startDate]
  let currentDate = new Date(startDate)
  const endLimit = getRecurrenceEndLimit(startDate, recurrence)

  let iterations = 0
  const maxIterations = 1000

  while (dates.length < limit && iterations < maxIterations) {
    iterations += 1
    const nextDate = stepRecurrenceDate(currentDate, recurrence)

    if (nextDate <= endLimit && !dates.some((d) => isSameInstant(d, nextDate))) {
      dates.push(nextDate)
      currentDate = nextDate
    } else if (nextDate > endLimit) {
      break
    } else {
      currentDate = new Date(nextDate)
    }
  }

  return dates
}

export function getRecurrenceLabel(recurrence: RecurrenceInfo): string {
  if (!recurrence.enabled) {
    return 'Sin repeticion'
  }

  let label = ''
  switch (recurrence.type) {
    case 'hourly':
      label = 'Cada hora'
      break
    case 'daily':
      label = 'Cada dia'
      break
    case 'weekday':
      label = 'Entre semana'
      break
    case 'weekend':
      label = 'Fines de semana'
      break
    case 'weekly':
      label = 'Cada semana'
      break
    case 'custom': {
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
      label = `Cada ${interval} ${frequencyLabel[frequencyKey] ?? frequencyKey}`
      break
    }
    default:
      label = 'Recurrente'
  }

  if (recurrence.endType === 'date' && recurrence.endDate) {
    return `${label} hasta ${recurrence.endDate}${recurrence.endTime ? ` ${recurrence.endTime}` : ''}`
  }

  return recurrence.endType === 'never' ? `${label} sin fin` : label
}
