'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Sparkles } from 'lucide-react'

import { Breadcrumbs } from '@/components/breadcrumbs'
import { RecurrenceSettings, type RecurrenceSettings as RecurrenceSettingsType } from '@/components/create/recurrence-settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type PostStatusForm = 'draft' | 'scheduled' | 'cancelled'
type ContentTypeForm = 'post' | 'reel' | 'story' | 'carousel'

interface ProjectOption {
  id: string
  name: string
}

interface MediaOption {
  id: string
  fileName: string
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

const contentTypeOptions: { value: ContentTypeForm; label: string }[] = [
  { value: 'post', label: 'Post' },
  { value: 'reel', label: 'Reel' },
  { value: 'story', label: 'Story' },
  { value: 'carousel', label: 'Carrusel' },
]

const statusOptions: { value: PostStatusForm; label: string; help: string }[] = [
  { value: 'draft', label: 'Borrador', help: 'Guardar sin publicar.' },
  { value: 'scheduled', label: 'Programado', help: 'Listo para salida automatica.' },
  { value: 'cancelled', label: 'Cancelado', help: 'Guardar como cancelado desde el inicio.' },
]

export default function CreatePage() {
  const router = useRouter()

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [mediaOptions, setMediaOptions] = useState<MediaOption[]>([])

  const [formData, setFormData] = useState({
    projectId: '',
    platforms: [] as string[],
    contentType: 'post' as ContentTypeForm,
    title: '',
    subtitle: '',
    mediaAssetId: '',
    caption: '',
    hashtags: '',
    scheduledDate: '',
    scheduledTime: '',
    status: 'scheduled' as PostStatusForm,
  })

  const [recurrence, setRecurrence] = useState<RecurrenceSettingsType>({
    enabled: false,
    type: null,
    endType: 'never',
  })

  const [aiTone, setAiTone] = useState<'profesional' | 'juvenil' | 'vendedor' | 'minimalista'>('profesional')
  const [aiObjective, setAiObjective] = useState<'branding' | 'leads' | 'visitas' | 'ventas'>('branding')
  const [aiVariants, setAiVariants] = useState<string[]>([])

  const platforms = ['Instagram', 'Facebook', 'TikTok', 'YouTube Shorts', 'X', 'LinkedIn']

  useEffect(() => {
    let mounted = true
    const loadProjects = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch('/api/projects')
        if (!response.ok) throw new Error('No se pudieron cargar los proyectos.')
        const json = await response.json()
        const items = (json.items ?? []).map((item: { id: string; name: string }) => ({ id: item.id, name: item.name }))

        if (!mounted) return

        setProjects(items)
        setFormData((prev) => ({
          ...prev,
          projectId: prev.projectId || items[0]?.id || '',
        }))
      } catch (loadError) {
        if (mounted) setError(loadError instanceof Error ? loadError.message : 'Error cargando proyectos.')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadProjects()

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    let mounted = true

    const loadMedia = async () => {
      if (!formData.projectId) {
        setMediaOptions([])
        setFormData((prev) => ({ ...prev, mediaAssetId: '' }))
        return
      }

      try {
        const response = await fetch(`/api/projects/${formData.projectId}/media`)
        if (!response.ok) {
          if (mounted) setMediaOptions([])
          return
        }
        const json = await response.json()
        const items: MediaOption[] = (json.items ?? []).map((item: { id: string; fileName: string }) => ({
          id: item.id,
          fileName: item.fileName,
        }))

        if (!mounted) return

        setMediaOptions(items)
        setFormData((prev) => ({
          ...prev,
          mediaAssetId: items.some((item) => item.id === prev.mediaAssetId) ? prev.mediaAssetId : '',
        }))
      } catch {
        if (mounted) setMediaOptions([])
      }
    }

    loadMedia()

    return () => {
      mounted = false
    }
  }, [formData.projectId])

  const selectedProjectName = useMemo(
    () => projects.find((project) => project.id === formData.projectId)?.name ?? 'No definido',
    [projects, formData.projectId],
  )

  const togglePlatform = (platform: string) => {
    setFormData((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter((p) => p !== platform)
        : [...prev.platforms, platform],
    }))
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
        title: prev.title || `Publicacion ${selectedProjectName}`,
      }))
    }
  }

  const canGoStep2 = formData.projectId && formData.platforms.length > 0 && formData.contentType
  const canGoStep3 = formData.title.trim() && formData.subtitle.trim() && formData.caption.trim()
  const canSubmit = formData.scheduledDate && formData.scheduledTime

  const handleSubmit = async () => {
    if (!canSubmit) return

    setSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const publishAt = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`)
      if (Number.isNaN(publishAt.getTime())) {
        throw new Error('Fecha/hora invalida para programacion.')
      }

      const captionWithHashtags = [formData.caption.trim(), formData.hashtags.trim()].filter(Boolean).join('\n\n')

      const response = await fetch('/api/scheduled-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title.trim(),
          subtitle: formData.subtitle.trim(),
          caption: captionWithHashtags,
          contentType: formData.contentType,
          status: formData.status,
          publishAt: publishAt.toISOString(),
          projectId: formData.projectId,
          platforms: formData.platforms,
          mediaAssetId: formData.mediaAssetId || undefined,
          recurrence: recurrence.enabled ? recurrence : null,
        }),
      })

      if (!response.ok) {
        const json = await response.json().catch(() => null)
        throw new Error(json?.message ?? 'No se pudo crear la publicacion programada.')
      }

      setSuccess('Publicacion programada creada correctamente.')
      setTimeout(() => {
        router.push('/publicaciones-programadas')
        router.refresh()
      }, 700)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Error creando publicacion programada.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <Breadcrumbs />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Crear publicacion programada</h1>
        <p className="text-muted-foreground">UI conectada a API/DB para crear publicaciones reales.</p>
      </div>

      {error ? (
        <div className="surface-muted p-3 mb-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      ) : null}
      {success ? (
        <div className="surface-muted p-3 mb-4 border-primary/30">
          <p className="text-sm text-primary">{success}</p>
        </div>
      ) : null}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex gap-2 mb-8">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className={`flex-1 h-2 rounded-full transition-colors ${s <= step ? 'bg-primary' : 'bg-muted'}`} />
            ))}
          </div>

          {step === 1 && (
            <div className="bg-card border border-border rounded-lg p-6 space-y-6">
              <h3 className="text-lg font-semibold">Proyecto y destino</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold block mb-2">Proyecto inmobiliario</label>
                  <select
                    value={formData.projectId}
                    onChange={(e) => setFormData((prev) => ({ ...prev, projectId: e.target.value }))}
                    className="w-full bg-muted border border-border rounded-lg px-3 py-2"
                    disabled={loading}
                  >
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold block mb-2">Tipo de publicacion</label>
                  <select
                    value={formData.contentType}
                    onChange={(e) => setFormData((prev) => ({ ...prev, contentType: e.target.value as ContentTypeForm }))}
                    className="w-full bg-muted border border-border rounded-lg px-3 py-2"
                  >
                    {contentTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
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
                  <label className="text-sm font-semibold block mb-2">Titulo</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Ej: Lanzamiento Torre Atlantica"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold block mb-2">Subtitulo</label>
                  <Input
                    value={formData.subtitle}
                    onChange={(e) => setFormData((prev) => ({ ...prev, subtitle: e.target.value }))}
                    placeholder="Ej: Ultimas unidades con bono de lanzamiento"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold block mb-2">Media de biblioteca (opcional)</label>
                <select
                  value={formData.mediaAssetId}
                  onChange={(e) => setFormData((prev) => ({ ...prev, mediaAssetId: e.target.value }))}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2"
                >
                  <option value="">Sin media asociada</option>
                  {mediaOptions.map((media) => (
                    <option key={media.id} value={media.id}>
                      {media.fileName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold block mb-2">Modo IA</label>
                  <select
                    value={aiTone}
                    onChange={(e) => setAiTone(e.target.value as typeof aiTone)}
                    className="w-full bg-muted border border-border rounded-lg px-3 py-2"
                  >
                    <option value="profesional">Profesional</option>
                    <option value="juvenil">Juvenil</option>
                    <option value="vendedor">Vendedor</option>
                    <option value="minimalista">Minimalista</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold block mb-2">Objetivo IA</label>
                  <select
                    value={aiObjective}
                    onChange={(e) => setAiObjective(e.target.value as typeof aiObjective)}
                    className="w-full bg-muted border border-border rounded-lg px-3 py-2"
                  >
                    <option value="branding">Marca</option>
                    <option value="leads">Prospectos por WhatsApp</option>
                    <option value="visitas">Visitas</option>
                    <option value="ventas">Ventas</option>
                  </select>
                </div>
              </div>

              <div className="bg-muted/40 border border-border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Generador IA (3 variantes)</p>
                  <Button type="button" size="sm" onClick={generateAI}>
                    <Sparkles size={14} className="mr-2" />
                    Generar
                  </Button>
                </div>
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
                <label className="text-sm font-semibold block mb-2">Texto</label>
                <textarea
                  className="w-full bg-muted border border-border rounded-lg p-3 text-foreground placeholder-muted-foreground resize-none"
                  rows={4}
                  value={formData.caption}
                  onChange={(e) => setFormData((prev) => ({ ...prev, caption: e.target.value }))}
                  placeholder="Escribe el texto principal"
                />
              </div>

              <div>
                <label className="text-sm font-semibold block mb-2">Hashtags (opcional)</label>
                <Input
                  value={formData.hashtags}
                  onChange={(e) => setFormData((prev) => ({ ...prev, hashtags: e.target.value }))}
                  placeholder="#inmobiliaria #hogar"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="bg-card border border-border rounded-lg p-6 space-y-6">
              <h3 className="text-lg font-semibold">Programacion y repeticion</h3>

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

              <div className="border-t border-border pt-5">
                <RecurrenceSettings value={recurrence} onChange={setRecurrence} />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-semibold">Estado inicial</h3>
              <div className="space-y-3">
                {statusOptions.map((option) => (
                  <button
                    type="button"
                    key={option.value}
                    onClick={() => setFormData((prev) => ({ ...prev, status: option.value }))}
                    className={`w-full p-3 rounded-lg border-2 transition-colors text-left ${
                      formData.status === option.value ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{option.label}</p>
                      {formData.status === option.value && <Check size={16} className="text-primary" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{option.help}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-between">
            <Button variant="outline" onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1 || submitting}>
              Anterior
            </Button>
            {step < 4 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={
                  submitting ||
                  (step === 1 && !canGoStep2) ||
                  (step === 2 && !canGoStep3)
                }
              >
                Siguiente
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={submitting || !canSubmit}>
                {submitting ? 'Guardando...' : 'Guardar programacion'}
              </Button>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-lg p-6 sticky top-24 space-y-3">
            <h3 className="font-semibold">Resumen</h3>
            <p className="text-xs text-muted-foreground">Proyecto</p>
            <p className="text-sm font-semibold">{selectedProjectName}</p>

            <p className="text-xs text-muted-foreground">Titulo</p>
            <p className="text-sm font-semibold">{formData.title || 'No definido'}</p>

            <p className="text-xs text-muted-foreground">Subtitulo</p>
            <p className="text-sm font-semibold">{formData.subtitle || 'No definido'}</p>

            <p className="text-xs text-muted-foreground">Plataformas</p>
            <p className="text-sm font-semibold">{formData.platforms.length > 0 ? formData.platforms.join(', ') : 'Ninguna'}</p>

            <p className="text-xs text-muted-foreground">Programacion</p>
            <p className="text-sm font-semibold">{formData.scheduledDate ? `${formData.scheduledDate} ${formData.scheduledTime}` : 'No definida'}</p>

            {recurrence.enabled ? (
              <>
                <p className="text-xs text-muted-foreground">Repeticion</p>
                <p className="text-sm font-semibold capitalize">{recurrence.type || 'custom'}</p>
              </>
            ) : null}

            <p className="text-xs text-muted-foreground">Estado</p>
            <p className="text-sm font-semibold capitalize">{formData.status.replace('_', ' ')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
