'use client'

import { useEffect, useMemo, useState } from 'react'
import { Layers3, Rocket } from 'lucide-react'

import { Breadcrumbs } from '@/components/breadcrumbs'
import { Button } from '@/components/ui/button'
import { campaignBlueprints, type CampaignBlueprintKey } from '@/lib/campaign-blueprints'

interface ProjectOption {
  id: string
  name: string
}

interface MediaOption {
  id: string
  fileName: string
}

interface CreatedCampaignPost {
  id: string
  title: string
  publishAt: string
  status: string
  step: number
}

export default function CampaignsPage() {
  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [media, setMedia] = useState<MediaOption[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [createdPosts, setCreatedPosts] = useState<CreatedCampaignPost[]>([])

  const [form, setForm] = useState({
    projectId: '',
    blueprintKey: 'lanzamiento' as CampaignBlueprintKey,
    startDate: '',
    mediaAssetId: '',
    status: 'scheduled' as 'draft' | 'scheduled',
    platforms: ['Instagram', 'Facebook'] as string[],
  })

  useEffect(() => {
    let mounted = true
    const loadProjects = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/projects')
        if (!response.ok) throw new Error('No se pudieron cargar los proyectos.')
        const json = await response.json()
        if (!mounted) return
        const items = (json.items ?? []).map((item: { id: string; name: string }) => ({ id: item.id, name: item.name }))
        setProjects(items)
        setForm((prev) => ({ ...prev, projectId: prev.projectId || items[0]?.id || '' }))
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
      if (!form.projectId) {
        setMedia([])
        return
      }
      try {
        const response = await fetch(`/api/projects/${form.projectId}/media`)
        if (!response.ok) {
          if (mounted) setMedia([])
          return
        }
        const json = await response.json()
        if (!mounted) return
        setMedia((json.items ?? []).map((item: { id: string; fileName: string }) => ({ id: item.id, fileName: item.fileName })))
      } catch {
        if (mounted) setMedia([])
      }
    }

    loadMedia()
    return () => {
      mounted = false
    }
  }, [form.projectId])

  const activeBlueprint = useMemo(
    () => campaignBlueprints.find((item) => item.key === form.blueprintKey) ?? campaignBlueprints[0],
    [form.blueprintKey],
  )

  const togglePlatform = (platform: string) => {
    setForm((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter((item) => item !== platform)
        : [...prev.platforms, platform],
    }))
  }

  const launchCampaign = async () => {
    setSubmitting(true)
    setError(null)
    setSuccess(null)
    setCreatedPosts([])

    try {
      const response = await fetch('/api/campaigns/launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const json = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(json?.message ?? 'No se pudo crear la campana.')
      }

      setSuccess(`Campana "${json.item.blueprint}" creada con ${json.item.total} piezas.`)
      setCreatedPosts(json.item.posts ?? [])
    } catch (launchError) {
      setError(launchError instanceof Error ? launchError.message : 'Error creando campana.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <Breadcrumbs />

      <div className="mb-8">
        <h1 className="view-title">Campanas</h1>
        <p className="view-subtitle">Programacion masiva orientada a secuencias inmobiliarias listas para operar.</p>
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

      <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-6">
        <div className="surface-card p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-primary/10 p-3 text-primary">
              <Rocket size={18} />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Lanzador de campanas</h2>
              <p className="text-sm text-muted-foreground">Crea varias publicaciones con una sola accion.</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold block mb-2">Proyecto</label>
              <select
                className="w-full rounded-xl border border-border bg-muted px-3 py-2.5"
                value={form.projectId}
                onChange={(event) => setForm((prev) => ({ ...prev, projectId: event.target.value, mediaAssetId: '' }))}
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
              <label className="text-sm font-semibold block mb-2">Plantilla</label>
              <select
                className="w-full rounded-xl border border-border bg-muted px-3 py-2.5"
                value={form.blueprintKey}
                onChange={(event) => setForm((prev) => ({ ...prev, blueprintKey: event.target.value as CampaignBlueprintKey }))}
              >
                {campaignBlueprints.map((blueprint) => (
                  <option key={blueprint.key} value={blueprint.key}>
                    {blueprint.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold block mb-2">Fecha de inicio</label>
              <input
                type="date"
                className="w-full rounded-xl border border-border bg-muted px-3 py-2.5"
                value={form.startDate}
                onChange={(event) => setForm((prev) => ({ ...prev, startDate: event.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-semibold block mb-2">Estado inicial</label>
              <select
                className="w-full rounded-xl border border-border bg-muted px-3 py-2.5"
                value={form.status}
                onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as 'draft' | 'scheduled' }))}
              >
                <option value="scheduled">Programado</option>
                <option value="draft">Borrador</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold block mb-2">Media principal</label>
            <select
              className="w-full rounded-xl border border-border bg-muted px-3 py-2.5"
              value={form.mediaAssetId}
              onChange={(event) => setForm((prev) => ({ ...prev, mediaAssetId: event.target.value }))}
            >
              <option value="">Sin media asociada</option>
              {media.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.fileName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold block mb-3">Redes destino</label>
            <div className="grid sm:grid-cols-3 gap-3">
              {['Instagram', 'Facebook', 'TikTok', 'LinkedIn'].map((platform) => (
                <button
                  key={platform}
                  type="button"
                  onClick={() => togglePlatform(platform)}
                  className={`rounded-xl border px-3 py-3 text-left text-sm transition-colors ${
                    form.platforms.includes(platform)
                      ? 'border-primary bg-primary/10 text-foreground'
                      : 'border-border bg-muted/20 text-muted-foreground hover:border-primary/40'
                  }`}
                >
                  {platform}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={launchCampaign}
            disabled={submitting || !form.projectId || !form.startDate || form.platforms.length === 0}
            className="h-12 rounded-2xl"
          >
            {submitting ? 'Generando campana...' : 'Crear campana'}
          </Button>
        </div>

        <div className="space-y-6">
          <div className="surface-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-2xl bg-accent/10 p-3 text-accent">
                <Layers3 size={18} />
              </div>
              <div>
                <h3 className="font-semibold">{activeBlueprint.name}</h3>
                <p className="text-xs text-muted-foreground">{activeBlueprint.description}</p>
              </div>
            </div>

            <div className="space-y-3">
              {activeBlueprint.steps.map((step, index) => (
                <div key={`${activeBlueprint.key}-${index}`} className="surface-muted p-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Pieza {index + 1}</p>
                  <p className="text-sm font-semibold mt-1">{step.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Dia +{step.dayOffset} · {step.hour.toString().padStart(2, '0')}:{step.minute.toString().padStart(2, '0')} · {step.contentType}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="surface-card p-6">
            <h3 className="font-semibold mb-4">Resultado</h3>
            {createdPosts.length > 0 ? (
              <div className="space-y-3">
                {createdPosts.map((post) => (
                  <div key={post.id} className="surface-muted p-3">
                    <p className="text-sm font-semibold">{post.step}. {post.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(post.publishAt).toLocaleString()} · {post.status}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aun no se ha generado ninguna campana en esta sesion.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
