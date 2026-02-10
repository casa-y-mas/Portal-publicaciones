'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type RecurrenceType = 'hourly' | 'daily' | 'weekday' | 'weekend' | 'weekly' | 'custom' | null
type EndType = 'never' | 'date'

export interface RecurrenceSettings {
  enabled: boolean
  type: RecurrenceType
  endType: EndType
  endDate?: string
  customFrequency?: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly'
  customInterval?: number
}

interface RecurrenceSettingsProps {
  value: RecurrenceSettings
  onChange: (settings: RecurrenceSettings) => void
}

export function RecurrenceSettings({ value, onChange }: RecurrenceSettingsProps) {
  const [showRecurrenceMenu, setShowRecurrenceMenu] = useState(false)
  const [showEndMenu, setShowEndMenu] = useState(false)
  const [showCustom, setShowCustom] = useState(false)

  const recurrenceOptions = [
    { value: 'hourly', label: 'Cada hora', description: 'Se publicará cada hora' },
    { value: 'daily', label: 'Cada día', description: 'Se publicará todos los días' },
    { value: 'weekday', label: 'Entre semana', description: 'Lunes a viernes' },
    { value: 'weekend', label: 'Fines de semana', description: 'Sábados y domingos' },
    { value: 'weekly', label: 'Cada semana', description: 'El mismo día cada semana' },
    { value: 'custom', label: 'Personalizar', description: 'Configuración personalizada' },
  ]

  const endOptions = [
    { value: 'never', label: 'Nunca' },
    { value: 'date', label: 'En una fecha' },
  ]

  const customFrequencies = [
    { value: 'hourly', label: 'Cada', unit: 'horas' },
    { value: 'daily', label: 'Cada', unit: 'días' },
    { value: 'weekly', label: 'Cada', unit: 'semanas' },
    { value: 'monthly', label: 'Cada', unit: 'meses' },
    { value: 'yearly', label: 'Cada', unit: 'años' },
  ]

  return (
    <div className="space-y-4">
      {/* Repeat Toggle */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="repeat-toggle"
          checked={value.enabled}
          onChange={(e) =>
            onChange({
              ...value,
              enabled: e.target.checked,
              type: e.target.checked ? 'daily' : null,
            })
          }
          className="w-4 h-4"
        />
        <label htmlFor="repeat-toggle" className="text-sm font-semibold cursor-pointer">
          Repetir la publicación
        </label>
      </div>

      {value.enabled && (
        <div className="space-y-4 pl-7 border-l border-border pt-4">
          {/* Recurrence Type */}
          <div>
            <label className="text-sm font-semibold block mb-2">Tipo de repetición</label>
            <div className="relative">
              <button
                onClick={() => setShowRecurrenceMenu(!showRecurrenceMenu)}
                className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-left flex items-center justify-between hover:border-primary/50 transition-colors"
              >
                <span className="text-sm">
                  {recurrenceOptions.find(opt => opt.value === value.type)?.label || 'Seleccionar'}
                </span>
                <ChevronDown size={16} />
              </button>

              {showRecurrenceMenu && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-10">
                  {recurrenceOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => {
                        onChange({
                          ...value,
                          type: option.value as RecurrenceType,
                          customFrequency: option.value === 'custom' ? 'daily' : undefined,
                          customInterval: option.value === 'custom' ? 1 : undefined,
                        })
                        setShowRecurrenceMenu(false)
                        if (option.value === 'custom') {
                          setShowCustom(true)
                        }
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

          {/* Custom Recurrence */}
          {value.type === 'custom' && (
            <div className="space-y-3 bg-muted/50 p-4 rounded-lg border border-border">
              <label className="text-sm font-semibold block">Configuración personalizada</label>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-2">Frecuencia</label>
                  <select
                    value={value.customFrequency || 'daily'}
                    onChange={(e) =>
                      onChange({
                        ...value,
                        customFrequency: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm"
                  >
                    {customFrequencies.map(freq => (
                      <option key={freq.value} value={freq.value}>
                        {freq.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-2">
                    Cada cuántos {customFrequencies.find(f => f.value === value.customFrequency)?.unit || 'días'}
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={value.customInterval || 1}
                    onChange={(e) =>
                      onChange({
                        ...value,
                        customInterval: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          )}

          {/* End Recurrence */}
          <div>
            <label className="text-sm font-semibold block mb-2">Terminar repetición</label>
            <div className="relative">
              <button
                onClick={() => setShowEndMenu(!showEndMenu)}
                className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-left flex items-center justify-between hover:border-primary/50 transition-colors"
              >
                <span className="text-sm">
                  {endOptions.find(opt => opt.value === value.endType)?.label || 'Seleccionar'}
                </span>
                <ChevronDown size={16} />
              </button>

              {showEndMenu && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-10">
                  {endOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => {
                        onChange({
                          ...value,
                          endType: option.value as EndType,
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

          {/* End Date */}
          {value.endType === 'date' && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-2">Fecha de finalización</label>
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
