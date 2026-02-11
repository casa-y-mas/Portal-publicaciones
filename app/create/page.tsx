'use client'

import { useMemo, useState } from 'react'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Check, Sparkles } from 'lucide-react'
import { RecurrenceSettings, type RecurrenceSettings as RecurrenceSettingsType } from '@/components/create/recurrence-settings'
import { projects, sequenceGroups } from '@/lib/mock-data'

type SequenceMode = 'none' | 'interval' | 'fixed-dates'

interface SequenceItem {
  id: string
  order: number
  title: string
  scheduleAt: string
}

const aiSeedByTone: Record<string, string[]> = {
  profesional: [
    'Conoce un proyecto disenado para vivir con valor de inversion.',
    'Espacios funcionales, ubicacion estrategica y alta plusvalia.',
    'Agenda tu visita y recibe asesoria personalizada.',
  ],
  juvenil: [
    'Tu proximo depa con estilo ya esta listo para conocerse.',
    'Vive cerca de todo con amenidades que suman.',
    'Escribenos por WhatsApp y separa tu recorrido.',
  ],
  vendedor: [
    'Ultimas unidades disponibles con bono por reserva esta semana.',
    'Aprovecha condiciones especiales y asegura tu inversion hoy.',
    'Te ayudamos con el proceso completo, rapido y seguro.',
  ],
  minimalista: [
    'Diseno limpio. Ubicacion ideal. Excelente inversion.',
    'Un espacio pensado para vivir mejor.',
    'Reserva visita en minutos por WhatsApp.',
  ],
}

export default function CreatePage() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    project: projects[0]?.name || '',
    platforms: [] as string[],
    contentType: '',
    media: '',
    caption: '',
    hashtags: '',
    script: '',
    scheduledDate: '',
    scheduledTime: '',
    status: 'schedule',
  })
  const [recurrence, setRecurrence] = useState<RecurrenceSettingsType>({
    enabled: false,
    type: null,
    endType: 'never',
  })
  const [sequenceMode, setSequenceMode] = useState<SequenceMode>('none')
  const [sequenceIntervalValue, setSequenceIntervalValue] = useState(2)
  const [sequenceIntervalUnit, setSequenceIntervalUnit] = useState<'hours' | 'days'>('hours')
  const [sequenceItems, setSequenceItems] = useState<SequenceItem[]>([
    { id: '1', order: 1, title: 'Post 1', scheduleAt: '' },
    { id: '2', order: 2, title: 'Post 2', scheduleAt: '' },
    { id: '3', order: 3, title: 'Post 3', scheduleAt: '' },
  ])

  const [aiTone, setAiTone] = useState<'profesional' | 'juvenil' | 'vendedor' | 'minimalista'>('profesional')
  const [aiObjective, setAiObjective] = useState<'branding' | 'leads' | 'visitas' | 'ventas'>('branding')
  const [aiVariants, setAiVariants] = useState<string[]>([])

  const platforms = ['Instagram', 'Facebook', 'TikTok', 'YouTube Shorts', 'X', 'LinkedIn']
  const contentTypes = ['post imagen', 'post video', 'carrusel', 'reel', 'story']
  const statuses = ['draft', 'pending-approval', 'approved', 'schedule']

  const togglePlatform = (platform: string) => {
    setFormData((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter((p) => p !== platform)
        : [...prev.platforms, platform],
    }))
  }

  const applySequencePreset = (groupId: string) => {
    const group = sequenceGroups.find((item) => item.id === groupId)
    if (!group) return

    setSequenceMode(group.mode as SequenceMode)
    if (group.intervalValue) {
      setSequenceIntervalValue(group.intervalValue)
    }
    if (group.intervalUnit === 'day') {
      setSequenceIntervalUnit('days')
    }
  }

  const generateAI = () => {
    const base = aiSeedByTone[aiTone]
    const objectiveLine: Record<typeof aiObjective, string> = {
      branding: 'Objetivo: reforzar marca y recordacion.',
      leads: 'Objetivo: captar leads por WhatsApp.',
      visitas: 'Objetivo: generar visitas al proyecto.',
      ventas: 'Objetivo: cerrar ventas con urgencia comercial.',
    }

    const variants = base.slice(0, 3).map((line, index) => `${line} ${objectiveLine[aiObjective]} Variante ${index + 1}.`)
    setAiVariants(variants)
    if (!formData.caption) {
      setFormData((prev) => ({
        ...prev,
        caption: variants[0],
        hashtags: '#inmobiliaria #hogar #inversion',
        script: `${variants[0]}\nEscena 1: fachada\nEscena 2: amenidades\nEscena 3: CTA a WhatsApp`,
      }))
    }
  }

  const sequenceSummary = useMemo(() => {
    if (sequenceMode === 'interval') {
      return `Orden por intervalo: cada ${sequenceIntervalValue} ${sequenceIntervalUnit}`
    }
    if (sequenceMode === 'fixed-dates') {
      return 'Orden por fechas fijas por item'
    }
    return 'Sin secuencia'
  }, [sequenceIntervalUnit, sequenceIntervalValue, sequenceMode])

  return (
    <div>
      <Breadcrumbs />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Programar publicacion</h1>
        <p className="text-muted-foreground">Incluye aprobaciones, secuencias, repeticion e IA asistida.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex gap-2 mb-8">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className={`flex-1 h-2 rounded-full transition-colors ${s <= step ? 'bg-primary' : 'bg-muted'}`} />
            ))}
          </div>

          {step === 1 && (
            <div className="bg-card border border-border rounded-lg p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Proyecto y destino</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold block mb-2">Proyecto inmobiliario</label>
                    <select
                      value={formData.project}
                      onChange={(e) => setFormData((prev) => ({ ...prev, project: e.target.value }))}
                      className="w-full bg-muted border border-border rounded-lg px-3 py-2"
                    >
                      {projects.map((project) => (
                        <option key={project.id} value={project.name}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold block mb-2">Tipo de publicacion</label>
                    <select
                      value={formData.contentType}
                      onChange={(e) => setFormData((prev) => ({ ...prev, contentType: e.target.value }))}
                      className="w-full bg-muted border border-border rounded-lg px-3 py-2"
                    >
                      <option value="">Seleccionar</option>
                      {contentTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-3">Redes destino</h4>
                <div className="grid sm:grid-cols-3 gap-3">
                  {platforms.map((platform) => (
                    <button
                      type="button"
                      key={platform}
                      onClick={() => togglePlatform(platform)}
                      className={`p-3 rounded-lg border-2 transition-colors text-left ${
                        formData.platforms.includes(platform)
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm">{platform}</span>
                        {formData.platforms.includes(platform) && <Check size={16} className="text-primary" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="bg-card border border-border rounded-lg p-6 space-y-5">
              <h3 className="text-lg font-semibold">Contenido e IA</h3>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold block mb-2">Media de biblioteca</label>
                  <Input
                    value={formData.media}
                    onChange={(e) => setFormData((prev) => ({ ...prev, media: e.target.value }))}
                    placeholder="Ejemplo: video-torres-01.mp4"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold block mb-2">Modo IA</label>
                  <div className="flex gap-2">
                    <select
                      value={aiTone}
                      onChange={(e) => setAiTone(e.target.value as typeof aiTone)}
                      className="flex-1 bg-muted border border-border rounded-lg px-3 py-2"
                    >
                      <option value="profesional">Profesional</option>
                      <option value="juvenil">Juvenil</option>
                      <option value="vendedor">Vendedor</option>
                      <option value="minimalista">Minimalista</option>
                    </select>
                    <select
                      value={aiObjective}
                      onChange={(e) => setAiObjective(e.target.value as typeof aiObjective)}
                      className="flex-1 bg-muted border border-border rounded-lg px-3 py-2"
                    >
                      <option value="branding">Branding</option>
                      <option value="leads">Leads WhatsApp</option>
                      <option value="visitas">Visitas</option>
                      <option value="ventas">Ventas</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-muted/40 border border-border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Generador IA (3-5 variantes)</p>
                  <Button type="button" size="sm" onClick={generateAI}>
                    <Sparkles size={14} className="mr-2" />
                    Generar
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">La IA solo sugiere texto. La publicacion nunca sale sin aprobacion.</p>
                {aiVariants.length > 0 && (
                  <div className="space-y-2">
                    {aiVariants.map((variant) => (
                      <button
                        type="button"
                        key={variant}
                        onClick={() => setFormData((prev) => ({ ...prev, caption: variant }))}
                        className="w-full text-left text-xs bg-card border border-border rounded p-2 hover:border-primary/50"
                      >
                        {variant}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-semibold block mb-2">Caption</label>
                <textarea
                  className="w-full bg-muted border border-border rounded-lg p-3 text-foreground placeholder-muted-foreground resize-none"
                  rows={4}
                  value={formData.caption}
                  onChange={(e) => setFormData((prev) => ({ ...prev, caption: e.target.value }))}
                  placeholder="Escribe el caption o usa IA"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold block mb-2">Hashtags</label>
                  <Input
                    value={formData.hashtags}
                    onChange={(e) => setFormData((prev) => ({ ...prev, hashtags: e.target.value }))}
                    placeholder="#inmobiliaria #hogar"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold block mb-2">Guion reel</label>
                  <Input
                    value={formData.script}
                    onChange={(e) => setFormData((prev) => ({ ...prev, script: e.target.value }))}
                    placeholder="Escena 1..."
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="bg-card border border-border rounded-lg p-6 space-y-6">
              <h3 className="text-lg font-semibold">Programacion, secuencia y repeticion</h3>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold block mb-2">Fecha</label>
                  <Input
                    type="date"
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, scheduledDate: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold block mb-2">Hora</label>
                  <Input
                    type="time"
                    value={formData.scheduledTime}
                    onChange={(e) => setFormData((prev) => ({ ...prev, scheduledTime: e.target.value }))}
                  />
                </div>
              </div>

              <div className="border-t border-border pt-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">Publicacion en secuencia</h4>
                  <select
                    value={sequenceMode}
                    onChange={(e) => setSequenceMode(e.target.value as SequenceMode)}
                    className="bg-muted border border-border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="none">Sin secuencia</option>
                    <option value="interval">Por intervalo</option>
                    <option value="fixed-dates">Fechas fijas por item</option>
                  </select>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => applySequencePreset('seq-1')}
                    className="text-xs px-3 py-1 bg-muted rounded border border-border"
                  >
                    Cargar preset 10 reels / 10 dias
                  </button>
                  <button
                    type="button"
                    onClick={() => applySequencePreset('seq-2')}
                    className="text-xs px-3 py-1 bg-muted rounded border border-border"
                  >
                    Cargar preset open house
                  </button>
                </div>

                {sequenceMode === 'interval' && (
                  <div className="grid grid-cols-2 gap-3 max-w-sm">
                    <Input
                      type="number"
                      min="1"
                      value={sequenceIntervalValue}
                      onChange={(e) => setSequenceIntervalValue(Number.parseInt(e.target.value, 10) || 1)}
                    />
                    <select
                      value={sequenceIntervalUnit}
                      onChange={(e) => setSequenceIntervalUnit(e.target.value as 'hours' | 'days')}
                      className="bg-muted border border-border rounded-lg px-3 py-2"
                    >
                      <option value="hours">Horas</option>
                      <option value="days">Dias</option>
                    </select>
                  </div>
                )}

                {sequenceMode !== 'none' && (
                  <div className="space-y-2">
                    {sequenceItems.map((item) => (
                      <div key={item.id} className="grid grid-cols-12 gap-2 items-center text-sm">
                        <div className="col-span-2 bg-muted rounded px-2 py-2">#{item.order}</div>
                        <Input
                          className="col-span-5"
                          value={item.title}
                          onChange={(e) =>
                            setSequenceItems((prev) =>
                              prev.map((entry) => (entry.id === item.id ? { ...entry, title: e.target.value } : entry)),
                            )
                          }
                        />
                        <Input
                          className="col-span-5"
                          type="datetime-local"
                          value={item.scheduleAt}
                          onChange={(e) =>
                            setSequenceItems((prev) =>
                              prev.map((entry) => (entry.id === item.id ? { ...entry, scheduleAt: e.target.value } : entry)),
                            )
                          }
                        />
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-xs text-muted-foreground">{sequenceSummary}</p>
              </div>

              <div className="border-t border-border pt-5">
                <RecurrenceSettings value={recurrence} onChange={setRecurrence} />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-semibold">Estado y flujo</h3>
              <p className="text-sm text-muted-foreground">Borrador, aprobacion, programado, publicando, publicado, fallido o cancelado.</p>

              <div className="space-y-3">
                {statuses.map((status) => (
                  <button
                    type="button"
                    key={status}
                    onClick={() => setFormData((prev) => ({ ...prev, status }))}
                    className={`w-full p-3 rounded-lg border-2 transition-colors text-left ${
                      formData.status === status ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold capitalize">{status}</p>
                      {formData.status === status && <Check size={16} className="text-primary" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {status === 'draft' && 'Guardar sin publicar'}
                      {status === 'pending-approval' && 'Enviar a supervisor para aprobar o rechazar'}
                      {status === 'approved' && 'Listo para pasar al scheduler'}
                      {status === 'schedule' && 'Programar ejecucion automatica'}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-between">
            <Button variant="outline" onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1}>
              Anterior
            </Button>
            {step < 4 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={(step === 1 && (formData.platforms.length === 0 || !formData.contentType)) || (step === 2 && !formData.caption)}
              >
                Siguiente
              </Button>
            ) : (
              <Button>Guardar programacion</Button>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-lg p-6 sticky top-24 space-y-3">
            <h3 className="font-semibold">Resumen</h3>
            <p className="text-xs text-muted-foreground">Proyecto</p>
            <p className="text-sm font-semibold">{formData.project || 'No definido'}</p>

            <p className="text-xs text-muted-foreground">Plataformas</p>
            <p className="text-sm font-semibold">{formData.platforms.length > 0 ? formData.platforms.join(', ') : 'Ninguna'}</p>

            <p className="text-xs text-muted-foreground">Programacion base</p>
            <p className="text-sm font-semibold">{formData.scheduledDate ? `${formData.scheduledDate} ${formData.scheduledTime}` : 'No definida'}</p>

            <p className="text-xs text-muted-foreground">Secuencia</p>
            <p className="text-sm font-semibold">{sequenceSummary}</p>

            {recurrence.enabled && (
              <>
                <p className="text-xs text-muted-foreground">Repeticion</p>
                <p className="text-sm font-semibold capitalize">
                  {recurrence.type === 'hourly' && 'Cada hora'}
                  {recurrence.type === 'daily' && 'Cada dia'}
                  {recurrence.type === 'weekday' && 'Entre semana'}
                  {recurrence.type === 'weekend' && 'Fines de semana'}
                  {recurrence.type === 'weekly' && 'Cada semana'}
                  {recurrence.type === 'custom' && `Cada ${recurrence.customInterval || 1} ${recurrence.customFrequency || 'dia'}`}
                </p>
                <p className="text-xs text-muted-foreground">Fin: {recurrence.endType === 'never' ? 'Nunca' : recurrence.endDate || 'Seleccionar fecha'}</p>
              </>
            )}

            <p className="text-xs text-muted-foreground">Regla IA</p>
            <p className="text-sm font-semibold">{aiTone} / {aiObjective}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
