'use client'

import { useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/input'

export type RecurrenceType =
  | 'hourly'
  | 'daily'
  | 'weekday'
  | 'weekend'
  | 'weekly'
  | 'custom'
  | null

type EndType = 'never' | 'date'

type CustomFrequency = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly'

export interface RecurrenceSettings {
  enabled: boolean
  type: RecurrenceType
  endType: EndType
  endDate?: string
  customFrequency?: CustomFrequency
  customInterval?: number
  customWeekDays?: number[]
  customMonthDay?: number
  customYearDate?: string
}

interface RecurrenceSettingsProps {
  value: RecurrenceSettings
  onChange: (settings: RecurrenceSettings) => void
}

const weekDays = [
  { value: 1, label: 'Lun' },
  { value: 2, label: 'Mar' },
  { value: 3, label: 'Mie' },
  { value: 4, label: 'Jue' },
  { value: 5, label: 'Vie' },
  { value: 6, label: 'Sab' },
  { value: 0, label: 'Dom' },
]

export function RecurrenceSettings({ value, onChange }: RecurrenceSettingsProps) {
  const [showRecurrenceMenu, setShowRecurrenceMenu] = useState(false)
  const [showEndMenu, setShowEndMenu] = useState(false)

  const recurrenceOptions = [
    { value: 'hourly', label: 'Cada hora', description: 'Publica cada hora' },
    { value: 'daily', label: 'Cada dia', description: 'Publica todos los dias' },
    { value: 'weekday', label: 'Entre semana', description: 'Lunes a viernes' },
    { value: 'weekend', label: 'Fines de semana', description: 'Sabado y domingo' },
    { value: 'weekly', label: 'Cada semana', description: 'Mismo dia cada semana' },
    { value: 'custom', label: 'Personalizar', description: 'Regla avanzada' },
  ] as const

  const endOptions = [
    { value: 'never', label: 'Nunca' },
    { value: 'date', label: 'En una fecha' },
  ] as const

  const customFrequencyLabel = useMemo(() => {
    const labels: Record<CustomFrequency, string> = {
      hourly: 'horas',
      daily: 'dias',
      weekly: 'semanas',
      monthly: 'meses',
      yearly: 'anios',
    }
    return labels[value.customFrequency || 'daily']
  }, [value.customFrequency])

  const toggleWeekDay = (day: number) => {
    const selected = value.customWeekDays || []
    if (selected.includes(day)) {
      onChange({
        ...value,
        customWeekDays: selected.filter((d) => d !== day),
      })
      return
    }
    onChange({
      ...value,
      customWeekDays: [...selected, day],
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="repeat-toggle"
          checked={value.enabled}
          onChange={(e) =>
            onChange({
              ...value,
              enabled: e.target.checked,
              type: e.target.checked ? value.type || 'daily' : null,
            })
          }
          className="w-4 h-4"
        />
        <label htmlFor="repeat-toggle" className="text-sm font-semibold cursor-pointer">
          Repetir la publicacion
        </label>
      </div>

      {value.enabled && (
        <div className="space-y-4 pl-7 border-l border-border pt-4">
          <div>
            <label className="text-sm font-semibold block mb-2">Tipo de repeticion</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowRecurrenceMenu((prev) => !prev)}
                className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-left flex items-center justify-between hover:border-primary/50 transition-colors"
              >
                <span className="text-sm">
                  {recurrenceOptions.find((opt) => opt.value === value.type)?.label || 'Seleccionar'}
                </span>
                <ChevronDown size={16} />
              </button>

              {showRecurrenceMenu && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-20">
                  {recurrenceOptions.map((option) => (
                    <button
                      type="button"
                      key={option.value}
                      onClick={() => {
                        onChange({
                          ...value,
                          type: option.value,
                          customFrequency: option.value === 'custom' ? value.customFrequency || 'daily' : undefined,
                          customInterval: option.value === 'custom' ? value.customInterval || 1 : undefined,
                          customWeekDays: option.value === 'custom' ? value.customWeekDays || [1] : undefined,
                          customMonthDay: option.value === 'custom' ? value.customMonthDay || 1 : undefined,
                          customYearDate: option.value === 'custom' ? value.customYearDate || '' : undefined,
                        })
                        setShowRecurrenceMenu(false)
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-muted flex flex-col gap-1 border-b border-border last:border-b-0 transition-colors"
                    >
                      <span className="text-sm font-semibold">{option.label}</span>
                      <span className="text-xs text-muted-foreground">{option.description}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {value.type === 'custom' && (
            <div className="space-y-3 bg-muted/40 p-4 rounded-lg border border-border">
              <label className="text-sm font-semibold block">Personalizar</label>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-2">Frecuencia</label>
                <select
                  value={value.customFrequency || 'daily'}
                  onChange={(e) =>
                    onChange({
                      ...value,
                      customFrequency: e.target.value as CustomFrequency,
                    })
                  }
                  className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm"
                >
                  <option value="hourly">Cada hora</option>
                  <option value="daily">Diariamente</option>
                  <option value="weekly">Semanalmente</option>
                  <option value="monthly">Mensualmente</option>
                  <option value="yearly">Anualmente</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-2">
                  Cada cuantos {customFrequencyLabel}
                </label>
                <Input
                  type="number"
                  min="1"
                  value={value.customInterval || 1}
                  onChange={(e) =>
                    onChange({
                      ...value,
                      customInterval: Number.parseInt(e.target.value, 10) || 1,
                    })
                  }
                />
              </div>

              {value.customFrequency === 'weekly' && (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-2">Dias de semana</label>
                  <div className="flex flex-wrap gap-2">
                    {weekDays.map((day) => (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleWeekDay(day.value)}
                        className={`px-3 py-1 rounded border text-xs font-semibold ${
                          (value.customWeekDays || []).includes(day.value)
                            ? 'bg-primary/15 border-primary text-primary'
                            : 'border-border'
                        }`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {value.customFrequency === 'monthly' && (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-2">Dia del mes</label>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    value={value.customMonthDay || 1}
                    onChange={(e) =>
                      onChange({
                        ...value,
                        customMonthDay: Number.parseInt(e.target.value, 10) || 1,
                      })
                    }
                  />
                </div>
              )}

              {value.customFrequency === 'yearly' && (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-2">Fecha anual</label>
                  <Input
                    type="date"
                    value={value.customYearDate || ''}
                    onChange={(e) =>
                      onChange({
                        ...value,
                        customYearDate: e.target.value,
                      })
                    }
                  />
                </div>
              )}
            </div>
          )}

          <div>
            <label className="text-sm font-semibold block mb-2">Terminar repeticion</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowEndMenu((prev) => !prev)}
                className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-left flex items-center justify-between hover:border-primary/50 transition-colors"
              >
                <span className="text-sm">
                  {endOptions.find((opt) => opt.value === value.endType)?.label || 'Seleccionar'}
                </span>
                <ChevronDown size={16} />
              </button>

              {showEndMenu && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-20">
                  {endOptions.map((option) => (
                    <button
                      type="button"
                      key={option.value}
                      onClick={() => {
                        onChange({
                          ...value,
                          endType: option.value,
                        })
                        setShowEndMenu(false)
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-muted text-sm border-b border-border last:border-b-0 transition-colors"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {value.endType === 'date' && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-2">Fecha de finalizacion</label>
              <Input
                type="date"
                value={value.endDate || ''}
                onChange={(e) =>
                  onChange({
                    ...value,
                    endDate: e.target.value,
                  })
                }
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
