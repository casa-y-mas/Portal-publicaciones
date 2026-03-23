'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Link2, Sparkles, Upload } from 'lucide-react'

import { Breadcrumbs } from '@/components/breadcrumbs'
import { RecurrenceSettings, type RecurrenceSettings as RecurrenceSettingsType } from '@/components/create/recurrence-settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type PostStatusForm = 'draft' | 'scheduled' | 'cancelled'
type ContentTypeForm = 'post' | 'reel' | 'story' | 'carousel'

interface ProjectOption {
  id: string
  name: string
  slug?: string
  color?: string
  description?: string | null
  tipoOperacion?: string
  estado?: string
  ubicacionTexto?: string | null
  areaTotalM2?: string | null
  precioSoles?: string | null
  precioDolares?: string | null
  numVisitas?: number
  numFavoritos?: number
  counts?: {
    posts: number
    mediaAssets: number
    socialAccounts: number
  }
}

interface MediaOption {
  id: string
  fileName: string
  url?: string
  type?: 'image' | 'video'
  mimeType?: string
}

interface PublishingReadiness {
  projectId: string
  mode: string
  readyForFacebook: boolean
  readyForInstagram: boolean
  readyOverall: boolean
  messageFacebook: string
  messageInstagram: string
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
  const [aiBusy, setAiBusy] = useState(false)

  const pad2 = (n: number) => String(n).padStart(2, '0')
  const getLocalDateInputValue = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
  const getLocalTimeInputValue = (d: Date) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
  const getRoundedNow = () => {
    const d = new Date()
    d.setSeconds(0, 0)
    if (d.getTime() < Date.now()) d.setMinutes(d.getMinutes() + 1)
    return d
  }

  const initialScheduled = getRoundedNow()

  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [mediaOptions, setMediaOptions] = useState<MediaOption[]>([])
  const [previewMediaId, setPreviewMediaId] = useState<string | null>(null)
  const [readiness, setReadiness] = useState<PublishingReadiness | null>(null)
  const [readinessLoading, setReadinessLoading] = useState(false)

  const [formData, setFormData] = useState({
    projectId: '',
    platforms: [] as string[],
    contentType: 'post' as ContentTypeForm,
    title: '',
    subtitle: '',
    mediaAssetIds: [] as string[],
    caption: '',
    hashtags: '',
    scheduledDate: getLocalDateInputValue(initialScheduled),
    scheduledTime: getLocalTimeInputValue(initialScheduled),
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
  const [externalBusy, setExternalBusy] = useState(false)
  const externalFileInputRef = useRef<HTMLInputElement>(null)

  const platforms = ['Instagram', 'Facebook', 'TikTok', 'YouTube Shorts', 'X', 'LinkedIn']
  const hasFacebookSelected = formData.platforms.some((platform) => platform.toLowerCase() === 'facebook')
  const hasInstagramSelected = formData.platforms.some((platform) => platform.toLowerCase() === 'instagram')

  useEffect(() => {
    let mounted = true
    const loadProjects = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch('/api/projects')
        if (!response.ok) throw new Error('No se pudieron cargar los proyectos.')
        const json = await response.json()
        const items = (json.items ?? []).map((item: {
          id: string
          name: string
          slug?: string
          color?: string
          description?: string | null
          tipoOperacion?: string
          estado?: string
          ubicacionTexto?: string | null
          areaTotalM2?: string | null
          precioSoles?: string | null
          precioDolares?: string | null
          numVisitas?: number
          numFavoritos?: number
          _count?: {
            posts?: number
            mediaAssets?: number
            socialAccounts?: number
          }
        }) => ({
          id: item.id,
          name: item.name,
          slug: item.slug,
          color: item.color,
          description: item.description ?? null,
          tipoOperacion: item.tipoOperacion,
          estado: item.estado,
          ubicacionTexto: item.ubicacionTexto ?? null,
          areaTotalM2: item.areaTotalM2 ?? null,
          precioSoles: item.precioSoles ?? null,
          precioDolares: item.precioDolares ?? null,
          numVisitas: item.numVisitas ?? 0,
          numFavoritos: item.numFavoritos ?? 0,
          counts: {
            posts: item._count?.posts ?? 0,
            mediaAssets: item._count?.mediaAssets ?? 0,
            socialAccounts: item._count?.socialAccounts ?? 0,
          },
        }))

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
        setFormData((prev) => ({ ...prev, mediaAssetIds: [] }))
        return
      }

      try {
        const response = await fetch(`/api/projects/${formData.projectId}/media`)
        if (!response.ok) {
          if (mounted) setMediaOptions([])
          return
        }
        const json = await response.json()
        const items: MediaOption[] = (json.items ?? []).map((item: {
          id: string
          fileName: string
          url?: string
          type?: 'image' | 'video'
          mimeType?: string
        }) => ({
          id: item.id,
          fileName: item.fileName,
          url: item.url,
          type: item.type,
          mimeType: item.mimeType,
        }))

        if (!mounted) return

        setMediaOptions(items)
        setFormData((prev) => ({
          ...prev,
          mediaAssetIds: prev.mediaAssetIds.length > 0
            ? prev.mediaAssetIds.filter((id) => items.some((item) => item.id === id))
            : items.map((item) => item.id),
        }))
        setPreviewMediaId((prev) => {
          if (prev && items.some((item) => item.id === prev)) return prev
          const selected = items.find((item) => formData.mediaAssetIds.includes(item.id))
          return selected?.id ?? items[0]?.id ?? null
        })
      } catch {
        if (mounted) setMediaOptions([])
      }
    }

    loadMedia()

    return () => {
      mounted = false
    }
  }, [formData.projectId])

  useEffect(() => {
    let mounted = true

    const loadReadiness = async () => {
      if (!formData.projectId || (!hasFacebookSelected && !hasInstagramSelected)) {
        if (mounted) setReadiness(null)
        return
      }

      setReadinessLoading(true)
      try {
        const response = await fetch(`/api/publisher/run?projectId=${encodeURIComponent(formData.projectId)}`)
        if (!response.ok) {
          if (mounted) setReadiness(null)
          return
        }
        const json = await response.json()
        if (mounted) setReadiness(json.readiness ?? null)
      } catch {
        if (mounted) setReadiness(null)
      } finally {
        if (mounted) setReadinessLoading(false)
      }
    }

    loadReadiness()

    return () => {
      mounted = false
    }
  }, [formData.projectId, hasFacebookSelected, hasInstagramSelected])

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === formData.projectId) ?? null,
    [projects, formData.projectId],
  )
  const selectedPreviewMedia = useMemo(() => {
    const selectedIds = formData.mediaAssetIds
    if (selectedIds.length === 0) return null
    const preferred = previewMediaId
      ? mediaOptions.find((item) => item.id === previewMediaId && selectedIds.includes(item.id))
      : null
    if (preferred) return preferred
    return mediaOptions.find((item) => selectedIds.includes(item.id)) ?? null
  }, [mediaOptions, formData.mediaAssetIds, previewMediaId])

  const selectedProjectName = selectedProject?.name ?? 'No definido'

  const togglePlatform = (platform: string) => {
    setFormData((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter((p) => p !== platform)
        : [...prev.platforms, platform],
    }))
  }

  const addMediaAssetFromServerRecord = (record: MediaOption) => {
    setMediaOptions((prev) => (prev.some((m) => m.id === record.id) ? prev : [...prev, record]))
    setFormData((prev) => ({
      ...prev,
      mediaAssetIds: prev.mediaAssetIds.includes(record.id) ? prev.mediaAssetIds : [...prev.mediaAssetIds, record.id],
    }))
  }

  const mimeToMediaAssetType = (mime: string): 'image' | 'video' => {
    const m = (mime || '').toLowerCase()
    if (m.startsWith('video/')) return 'video'
    return 'image'
  }

  const registerUploadedAsMedia = async (
    payload: { fileName: string; url: string; mimeType: string; type: 'image' | 'video'; sizeBytes: number },
    tags: string[],
  ) => {
    const mediaRes = await fetch('/api/media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: payload.fileName,
        url: payload.url,
        mimeType: payload.mimeType,
        type: payload.type,
        sizeBytes: payload.sizeBytes,
        projectId: formData.projectId,
        tags,
      }),
    })
    if (!mediaRes.ok) {
      const j = await mediaRes.json().catch(() => null)
      throw new Error((j as { message?: string })?.message ?? 'No se pudo registrar la media en el proyecto.')
    }
    const created = (await mediaRes.json()) as { id: string; fileName: string }
    addMediaAssetFromServerRecord({ id: created.id, fileName: created.fileName })
  }

  const handleExternalFilesSelected = async (fileList: FileList | null) => {
    if (!fileList?.length) return
    if (!formData.projectId) {
      setError('Selecciona un proyecto primero (paso 1).')
      return
    }
    setExternalBusy(true)
    setError(null)
    try {
      const files = Array.from(fileList)
      for (const file of files) {
        const fd = new FormData()
        fd.append('file', file)
        const up = await fetch('/api/uploads', { method: 'POST', body: fd })
        if (!up.ok) {
          const j = await up.json().catch(() => null)
          throw new Error((j as { message?: string })?.message ?? `No se pudo subir: ${file.name}`)
        }
        const uploaded = (await up.json()) as {
          url: string
          mimeType?: string
          sizeBytes?: number
          fileName?: string
        }
        const mime = uploaded.mimeType || file.type || 'application/octet-stream'
        await registerUploadedAsMedia(
          {
            fileName: uploaded.fileName || file.name,
            url: uploaded.url,
            mimeType: mime,
            type: mimeToMediaAssetType(mime),
            sizeBytes: uploaded.sizeBytes ?? file.size,
          },
          ['externo'],
        )
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error subiendo archivo externo.')
    } finally {
      setExternalBusy(false)
      if (externalFileInputRef.current) externalFileInputRef.current.value = ''
    }
  }

  const generateAI = async () => {
    setAiBusy(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/ai/gemini-generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modoIA: aiTone,
          objetivoIA: aiObjective,
          tone: aiTone,
          objective: aiObjective,
          projectName: selectedProjectName,
          projectContext: selectedProject
            ? {
                tipoOperacion: selectedProject.tipoOperacion,
                estado: selectedProject.estado,
                ubicacion: selectedProject.ubicacionTexto,
                areaTotalM2: selectedProject.areaTotalM2,
                precioSoles: selectedProject.precioSoles,
                precioDolares: selectedProject.precioDolares,
                descripcionProyecto: selectedProject.description,
              }
            : null,
          title: formData.title,
          subtitle: formData.subtitle,
        }),
      })

      if (!response.ok) {
        const json = await response.json().catch(() => null)
        throw new Error(json?.message ?? 'No se pudo generar descripcion con IA.')
      }

      const json = await response.json()
      const variants = Array.isArray(json?.variants) ? json.variants.filter((v: unknown) => typeof v === 'string') : []
      if (variants.length === 0) throw new Error('Gemini no devolvio variantes.')

      setAiVariants(variants.slice(0, 3))

      if (!formData.caption) {
        setFormData((prev) => ({
          ...prev,
          caption: variants[0],
          hashtags: '#inmobiliaria #hogar #inversion',
          title: prev.title || `Publicacion ${selectedProjectName}`,
        }))
      }
    } catch (generateError) {
      setError(generateError instanceof Error ? generateError.message : 'Error generando con IA.')
    } finally {
      setAiBusy(false)
    }
  }

  const canGoStep2 = formData.projectId && formData.platforms.length > 0 && formData.contentType
  const canGoStep3 = formData.title.trim() && formData.subtitle.trim() && formData.caption.trim()
  const canSubmit = formData.scheduledDate && formData.scheduledTime
  const canPublishToFacebook = !hasFacebookSelected || readiness?.readyForFacebook !== false
  const canPublishToInstagram = !hasInstagramSelected || readiness?.readyForInstagram !== false

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
      if (formData.status === 'scheduled') {
        if (publishAt.getTime() < Date.now()) {
          throw new Error('No puedes programar en una fecha pasada.')
        }
        if (formData.mediaAssetIds.length === 0) {
          throw new Error('Para programar debes seleccionar un archivo multimedia.')
        }
        if (formData.platforms.length === 0) {
          throw new Error('Para programar debes seleccionar al menos una red.')
        }
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
          mediaAssetId: formData.mediaAssetIds[0] || undefined,
          mediaAssetIds: formData.mediaAssetIds,
          recurrence: recurrence.enabled ? recurrence : null,
        }),
      })

      if (!response.ok) {
        const json = await response.json().catch(() => null)
        throw new Error(json?.message ?? 'No se pudo crear la publicacion programada.')
      }

      const json = await response.json().catch(() => null)
      const savedCount = Array.isArray(json?.item?.mediaAssetIds) ? json.item.mediaAssetIds.length : null
      setSuccess(
        savedCount !== null
          ? `Publicacion programada creada correctamente (${savedCount} medias).`
          : 'Publicacion programada creada correctamente.',
      )
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
                <label className="text-sm font-semibold block mb-2">Multimedia del post (biblioteca o externa)</label>
                <div className="space-y-3">
                  {formData.mediaAssetIds.length === 0 ? (
                    <div className="text-xs text-muted-foreground">Sin media asociada</div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {formData.mediaAssetIds.map((id) => {
                        const media = mediaOptions.find((item) => item.id === id)
                        return (
                          <div key={id} className="flex items-center gap-2 bg-muted border border-border rounded-lg px-3 py-2">
                            <span className="text-xs font-semibold">{media?.fileName ?? 'Media'}</span>
                            <button
                              type="button"
                              className="text-xs text-primary hover:text-primary/80"
                              onClick={() => setPreviewMediaId(id)}
                            >
                              Previsualizar
                            </button>
                            <button
                              type="button"
                              className="text-xs text-muted-foreground hover:text-foreground"
                              onClick={() =>
                                setFormData((prev) => ({ ...prev, mediaAssetIds: prev.mediaAssetIds.filter((item) => item !== id) }))
                              }
                            >
                              Quitar
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                  {selectedPreviewMedia?.url ? (
                    <div className="rounded-lg border border-border overflow-hidden bg-muted">
                      {selectedPreviewMedia.type === 'video' || selectedPreviewMedia.mimeType?.startsWith('video/') ? (
                        <video
                          src={selectedPreviewMedia.url}
                          controls
                          className="w-full max-h-64 object-contain bg-black"
                          preload="metadata"
                        />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={selectedPreviewMedia.url}
                          alt={selectedPreviewMedia.fileName}
                          className="w-full max-h-64 object-contain"
                          loading="lazy"
                        />
                      )}
                      <div className="px-3 py-2 text-xs text-muted-foreground border-t border-border">
                        Vista previa: <span className="font-semibold text-foreground">{selectedPreviewMedia.fileName}</span>
                      </div>
                    </div>
                  ) : null}
                  <select
                    value=""
                    onChange={(e) => {
                      const value = e.target.value
                      if (!value) return
                      setFormData((prev) => ({
                        ...prev,
                        mediaAssetIds: prev.mediaAssetIds.includes(value) ? prev.mediaAssetIds : [...prev.mediaAssetIds, value],
                      }))
                      setPreviewMediaId(value)
                    }}
                    className="w-full bg-muted border border-border rounded-lg px-3 py-2"
                  >
                    <option value="">Agregar media del proyecto...</option>
                    {mediaOptions
                      .filter((media) => !formData.mediaAssetIds.includes(media.id))
                      .map((media) => (
                        <option key={media.id} value={media.id}>
                          {media.fileName}
                        </option>
                      ))}
                  </select>
                  <div className="text-xs text-muted-foreground">
                    Se carga automaticamente la multimedia del proyecto seleccionado. Puedes quitar o agregar archivos para esta publicacion.
                  </div>
                  <div className="border-t border-border pt-4 mt-2 space-y-3">
                    <p className="text-sm font-semibold">Contenido externo</p>
                    <p className="text-xs text-muted-foreground">
                      Sube imagenes o videos desde tu equipo. Se guardan en la biblioteca del proyecto y se anaden al post.
                    </p>
                    <div className="flex flex-wrap gap-2 items-center">
                      <input
                        ref={externalFileInputRef}
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          void handleExternalFilesSelected(e.target.files)
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!formData.projectId || externalBusy}
                        onClick={() => externalFileInputRef.current?.click()}
                      >
                        <Upload size={14} className="mr-2" />
                        {externalBusy ? 'Procesando...' : 'Subir archivos'}
                      </Button>
                    </div>
                  </div>
                </div>
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
                  <Button type="button" size="sm" onClick={generateAI} disabled={aiBusy}>
                    <Sparkles size={14} className="mr-2" />
                    {aiBusy ? 'Generando...' : 'Generar'}
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
              <Button onClick={handleSubmit} disabled={submitting || !canSubmit || !canPublishToFacebook || !canPublishToInstagram}>
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
            {selectedProject ? (
              <>
                <p className="text-xs text-muted-foreground">Slug</p>
                <p className="text-sm font-semibold">{selectedProject.slug || 'No definido'}</p>

                <p className="text-xs text-muted-foreground">Tipo de operacion</p>
                <p className="text-sm font-semibold">{selectedProject.tipoOperacion || 'No definido'}</p>

                <p className="text-xs text-muted-foreground">Estado del proyecto</p>
                <p className="text-sm font-semibold">{selectedProject.estado || 'No definido'}</p>

                <p className="text-xs text-muted-foreground">Ubicacion</p>
                <p className="text-sm font-semibold">{selectedProject.ubicacionTexto || 'No definida'}</p>

                <p className="text-xs text-muted-foreground">Area total</p>
                <p className="text-sm font-semibold">{selectedProject.areaTotalM2 || 'No definido'} m²</p>

                <p className="text-xs text-muted-foreground">Precio S/.</p>
                <p className="text-sm font-semibold">{selectedProject.precioSoles || 'No definido'}</p>

                <p className="text-xs text-muted-foreground">Precio USD</p>
                <p className="text-sm font-semibold">{selectedProject.precioDolares || 'No definido'}</p>

                <p className="text-xs text-muted-foreground">Visitas / Favoritos</p>
                <p className="text-sm font-semibold">{selectedProject.numVisitas ?? 0} / {selectedProject.numFavoritos ?? 0}</p>

                <p className="text-xs text-muted-foreground">Posts / Media / Cuentas</p>
                <p className="text-sm font-semibold">
                  {selectedProject.counts?.posts ?? 0} / {selectedProject.counts?.mediaAssets ?? 0} / {selectedProject.counts?.socialAccounts ?? 0}
                </p>

                <p className="text-xs text-muted-foreground">Descripcion del proyecto</p>
                <p className="text-sm font-semibold whitespace-pre-wrap">{selectedProject.description || 'No definida'}</p>
              </>
            ) : null}

            <p className="text-xs text-muted-foreground">Titulo</p>
            <p className="text-sm font-semibold">{formData.title || 'No definido'}</p>

            <p className="text-xs text-muted-foreground">Subtitulo</p>
            <p className="text-sm font-semibold">{formData.subtitle || 'No definido'}</p>

            <p className="text-xs text-muted-foreground">Plataformas</p>
            <p className="text-sm font-semibold">{formData.platforms.length > 0 ? formData.platforms.join(', ') : 'Ninguna'}</p>

            {hasFacebookSelected ? (
              <>
                <p className="text-xs text-muted-foreground">Estado Facebook</p>
                <p className={`text-sm font-semibold ${readiness?.readyForFacebook === false ? 'text-destructive' : 'text-foreground'}`}>
                  {readinessLoading
                    ? 'Validando...'
                    : readiness?.messageFacebook ?? 'Conecta una cuenta Facebook y selecciona pagina.'}
                </p>
              </>
            ) : null}

            {hasInstagramSelected ? (
              <>
                <p className="text-xs text-muted-foreground">Estado Instagram</p>
                <p className={`text-sm font-semibold ${readiness?.readyForInstagram === false ? 'text-destructive' : 'text-foreground'}`}>
                  {readinessLoading
                    ? 'Validando...'
                    : readiness?.messageInstagram ?? 'Conecta una cuenta Instagram de negocio con OAuth.'}
                </p>
              </>
            ) : null}

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
