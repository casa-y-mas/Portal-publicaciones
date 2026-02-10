'use client'

import { useState } from 'react'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Check } from 'lucide-react'
import { RecurrenceSettings, type RecurrenceSettings as RecurrenceSettingsType } from '@/components/create/recurrence-settings'

export default function CreatePage() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    platforms: [] as string[],
    contentType: '',
    caption: '',
    scheduledDate: '',
    scheduledTime: '',
    status: 'schedule',
  })
  const [recurrence, setRecurrence] = useState<RecurrenceSettingsType>({
    enabled: false,
    type: null,
    endType: 'never',
  })

  const platforms = ['Instagram', 'Facebook', 'TikTok', 'YouTube']
  const contentTypes = ['post', 'reel', 'carousel', 'story']
  const statuses = ['draft', 'submit-approval', 'schedule']

  const togglePlatform = (platform: string) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform],
    }))
  }

  return (
    <div>
      <Breadcrumbs />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Crear Publicación</h1>
        <p className="text-muted-foreground">Programa nuevo contenido en todas las plataformas</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step indicator */}
          <div className="flex gap-2 mb-8">
            {[1, 2, 3].map(s => (
              <div
                key={s}
                className={`flex-1 h-2 rounded-full transition-colors ${
                  s <= step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>

          {/* Step 1: Platform Selection */}
          {step === 1 && (
            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-4">Seleccionar Plataformas</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {platforms.map(platform => (
                    <button
                      key={platform}
                      onClick={() => togglePlatform(platform)}
                      className={`p-4 rounded-lg border-2 transition-colors text-left ${
                        formData.platforms.includes(platform)
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{platform}</span>
                        {formData.platforms.includes(platform) && (
                          <Check size={20} className="text-primary" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Content Type */}
          {step === 2 && (
            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-4">Tipo de Contenido</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {contentTypes.map(type => (
                    <button
                      key={type}
                      onClick={() => setFormData(prev => ({ ...prev, contentType: type }))}
                      className={`p-4 rounded-lg border-2 transition-colors capitalize text-left ${
                        formData.contentType === type
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{type}</span>
                        {formData.contentType === type && (
                          <Check size={20} className="text-primary" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold block mb-2">Descripción</label>
                <textarea
                  className="w-full bg-muted border border-border rounded-lg p-3 text-foreground placeholder-muted-foreground resize-none"
                  rows={4}
                  placeholder="Escribe tu descripción aquí..."
                  value={formData.caption}
                  onChange={(e) => setFormData(prev => ({ ...prev, caption: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground mt-2">{formData.caption.length} / 2200 caracteres</p>
              </div>
            </div>
          )}

          {/* Step 3: Schedule */}
          {step === 3 && (
            <div className="bg-card border border-border rounded-lg p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Programar y Publicar</h3>
                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="text-sm font-semibold block mb-2">Fecha</label>
                    <Input
                      type="date"
                      value={formData.scheduledDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold block mb-2">Hora</label>
                    <Input
                      type="time"
                      value={formData.scheduledTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* Recurrence Settings */}
              <div className="border-t border-border pt-6">
                <RecurrenceSettings value={recurrence} onChange={setRecurrence} />
              </div>

              <div className="border-t border-border pt-6">
                <h4 className="text-sm font-semibold mb-4">Acción de Publicación</h4>
                <div className="space-y-3">
                  {statuses.map(status => (
                    <button
                      key={status}
                      onClick={() => setFormData(prev => ({ ...prev, status }))}
                      className={`w-full p-3 rounded-lg border-2 transition-colors text-left ${
                        formData.status === status
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold capitalize">
                            {status === 'draft' ? 'Guardar Borrador' : status === 'submit-approval' ? 'Enviar para Aprobación' : 'Programar Ahora'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {status === 'draft' && 'Puedes editar y publicar después'}
                            {status === 'submit-approval' && 'Un supervisor revisará antes de publicar'}
                            {status === 'schedule' && 'Se publicará automáticamente en la hora programada'}
                          </p>
                        </div>
                        {formData.status === status && (
                          <Check size={20} className="text-primary" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex gap-3 justify-between">
            <Button
              variant="outline"
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
            >
              Anterior
            </Button>
            {step < 3 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={
                  (step === 1 && formData.platforms.length === 0) ||
                  (step === 2 && !formData.contentType)
                }
              >
                Siguiente
              </Button>
            ) : (
              <Button>
                {formData.status === 'draft' && 'Guardar Borrador'}
                {formData.status === 'submit-approval' && 'Enviar para Aprobación'}
                {formData.status === 'schedule' && 'Programar Publicación'}
              </Button>
            )}
          </div>
        </div>

        {/* Preview */}
        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-lg p-6 sticky top-24">
            <h3 className="font-semibold mb-4">Vista Previa</h3>
            <div className="bg-muted rounded-lg p-4 aspect-square flex items-center justify-center mb-4">
              <div className="text-center">
                <p className="text-4xl mb-2">📱</p>
                <p className="text-sm text-muted-foreground">
                  {formData.platforms.length > 0
                    ? `Vista previa en ${formData.platforms[0]}`
                    : 'Selecciona plataformas para ver vista previa'}
                </p>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">Plataformas</p>
                <p className="font-semibold">
                  {formData.platforms.length > 0 ? formData.platforms.join(', ') : 'Ninguna seleccionada'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Tipo de Contenido</p>
                <p className="font-semibold capitalize">{formData.contentType || 'No seleccionado'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Programación</p>
                <p className="font-semibold">
                  {formData.scheduledDate ? `${formData.scheduledDate} ${formData.scheduledTime}` : 'No establecido'}
                </p>
              </div>
              {recurrence.enabled && (
                <div className="pt-2 border-t border-border">
                  <p className="text-muted-foreground">Repetición</p>
                  <p className="font-semibold capitalize">
                    {recurrence.type === 'hourly' && 'Cada hora'}
                    {recurrence.type === 'daily' && 'Cada día'}
                    {recurrence.type === 'weekday' && 'Entre semana (Lun-Vie)'}
                    {recurrence.type === 'weekend' && 'Fines de semana (Sáb-Dom)'}
                    {recurrence.type === 'weekly' && 'Cada semana'}
                    {recurrence.type === 'custom' && `Cada ${recurrence.customInterval} ${recurrence.customFrequency}s`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {recurrence.endType === 'never' ? 'Finalización: Nunca' : `Finalización: ${recurrence.endDate}`}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
