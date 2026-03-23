'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Edit2, Eye, EyeOff, Heart, Image as ImageIcon, Plus, Trash2 } from 'lucide-react'

import { AppModal } from '@/components/base/app-modal'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface ProjectItem {
  id: string
  name: string
  slug: string
  tipoOperacion: string
  color: string
  description: string | null
  createdAt: string
  updatedAt: string
  estado: string
  dueñoNombre: string | null
  ubicacionTexto: string | null
  portada: string | null
  numVisitas: number
  numFavoritos: number
  areaTotalM2: string | null
  precioSoles: string | null
  precioDolares: string | null
  _count: {
    posts: number
    mediaAssets: number
    socialAccounts: number
  }
}

interface ProjectFormState {
  name: string
  color: string
  description: string
}

interface ProjectMediaItem {
  id: string
  fileName: string
  url: string
  mimeType: string
  type: 'image' | 'video'
  sizeBytes: number
  createdAt: string
  uploadedBy: { id: string; name: string; email: string } | null
}

const emptyForm: ProjectFormState = {
  name: '',
  color: '#3B82F6',
  description: '',
}
const projectsReadOnly = true

export default function ProjectsPage() {
  const [items, setItems] = useState<ProjectItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<ProjectItem | null>(null)
  const [form, setForm] = useState<ProjectFormState>(emptyForm)
  const [mediaProject, setMediaProject] = useState<ProjectItem | null>(null)
  const [mediaItems, setMediaItems] = useState<ProjectMediaItem[]>([])
  const [loadingMedia, setLoadingMedia] = useState(false)
  const [priceProject, setPriceProject] = useState<ProjectItem | null>(null)

  const loadProjects = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/projects')
      if (!response.ok) throw new Error('No se pudieron cargar los proyectos.')
      const json = await response.json()
      setItems(json.items ?? [])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Error cargando proyectos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [])

  const openCreateModal = () => {
    setForm(emptyForm)
    setCreating(true)
  }

  const openEditModal = (project: ProjectItem) => {
    setForm({
      name: project.name,
      color: project.color,
      description: project.description ?? '',
    })
    setEditing(project)
  }

  const handleCreate = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          color: form.color.trim(),
          description: form.description.trim(),
        }),
      })

      if (!response.ok) {
        const json = await response.json().catch(() => null)
        throw new Error(json?.message ?? 'No se pudo crear el proyecto.')
      }

      setCreating(false)
      setForm(emptyForm)
      await loadProjects()
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Error creando proyecto.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async () => {
    if (!editing) return

    setSubmitting(true)
    setError(null)
    try {
      const response = await fetch(`/api/projects/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          color: form.color.trim(),
          description: form.description.trim(),
        }),
      })

      if (!response.ok) {
        const json = await response.json().catch(() => null)
        throw new Error(json?.message ?? 'No se pudo actualizar el proyecto.')
      }

      setEditing(null)
      setForm(emptyForm)
      await loadProjects()
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Error actualizando proyecto.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (project: ProjectItem) => {
    const confirmed = window.confirm(
      `Vas a eliminar "${project.name}". Esta accion tambien eliminara publicaciones, media y cuentas sociales asociadas. Continuar?`,
    )
    if (!confirmed) return

    setError(null)
    try {
      const response = await fetch(`/api/projects/${project.id}`, { method: 'DELETE' })
      if (!response.ok) {
        const json = await response.json().catch(() => null)
        throw new Error(json?.message ?? 'No se pudo eliminar el proyecto.')
      }
      await loadProjects()
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Error eliminando proyecto.')
    }
  }

  const formatSize = (sizeBytes: number) => {
    if (sizeBytes < 1024) return `${sizeBytes} B`
    if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(1)} KB`
    return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatPriceValue = (value: string | null) => {
    if (!value) return 'A cotizar'
    const num = Number(value)
    if (Number.isNaN(num) || num <= 0) return 'A cotizar'
    return value
  }

  const openProjectMedia = async (project: ProjectItem) => {
    setMediaProject(project)
    setMediaItems([])
    setLoadingMedia(true)
    setError(null)

    try {
      const response = await fetch(`/api/projects/${project.id}/media`)
      if (!response.ok) {
        const json = await response.json().catch(() => null)
        throw new Error(json?.message ?? 'No se pudo cargar la media del proyecto.')
      }

      const json = await response.json()
      setMediaItems(json.items ?? [])
    } catch (mediaError) {
      setError(mediaError instanceof Error ? mediaError.message : 'Error cargando media del proyecto.')
    } finally {
      setLoadingMedia(false)
    }
  }

  return (
    <div>
      <Breadcrumbs />

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="view-title">Proyectos</h1>
          <p className="view-subtitle">Listado sincronizado desde sistema externo para publicaciones y media.</p>
        </div>
        <Button onClick={openCreateModal} disabled={loading || projectsReadOnly}>
          <Plus size={16} className="mr-2" />
          Nuevo proyecto
        </Button>
      </div>

      {error ? (
        <div className="surface-muted p-3 mb-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      ) : null}
      {projectsReadOnly ? (
        <div className="surface-muted p-3 mb-4">
          <p className="text-sm text-muted-foreground">
            Los proyectos se cargan desde API externa. Crear, editar y eliminar esta deshabilitado en este portal.
          </p>
        </div>
      ) : null}

      {loading ? (
        <div className="surface-card p-12 text-center text-muted-foreground">Cargando proyectos...</div>
      ) : (
        <div className="space-y-4">
          {items.map((project) => (
            <div key={project.id} className="surface-card p-4 flex items-start gap-4">
              <div className="relative w-[190px]">
                {project.portada ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={project.portada}
                    alt={project.name}
                    className="w-full h-20 object-cover rounded-lg"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-20 rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-xs">
                    Sin portada
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-primary font-semibold">{project.tipoOperacion}</p>
                    <h3 className="text-sm font-semibold text-primary truncate">{project.name}</h3>
                    {project.ubicacionTexto ? <p className="text-xs text-muted-foreground mt-1">{project.ubicacionTexto}</p> : null}
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <Button variant="secondary" size="sm" onClick={() => setPriceProject(project)}>
                        Consultar Precio
                      </Button>
                      <p className="text-xs text-muted-foreground">{project.areaTotalM2 ?? '0'} m²</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1"> {project.estado}</p>
                  </div>

                  <div className="flex items-start gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Eye size={14} />
                      <span>{project.numVisitas}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart size={14} className="text-rose-500" />
                      <span>{project.numFavoritos}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 flex-wrap pt-2 border-t border-border/60">
                  <p className="text-xs text-muted-foreground">
                    Responsable: <span className="font-medium text-foreground">{project.dueñoNombre ?? 'Sin responsable'}</span>
                  </p>

                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openEditModal(project)} disabled={projectsReadOnly}>
                      <Edit2 size={14} className="mr-2" />
                      Editar
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openProjectMedia(project)}>
                      <Eye size={14} className="mr-2" />
                      Previsualizar
                    </Button>
                    <Button variant="ghost" size="sm" disabled>
                      <EyeOff size={14} className="mr-2" />
                      Esconder
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(project)} disabled={projectsReadOnly}>
                      <Trash2 size={14} className="mr-2" />
                      Eliminar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && items.length === 0 ? (
        <div className="surface-card p-8 text-center text-muted-foreground mt-4">No hay proyectos registrados.</div>
      ) : null}

      <AppModal
        open={creating}
        onOpenChange={setCreating}
        title="Crear proyecto"
        footer={
          <>
            <Button variant="outline" onClick={() => setCreating(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={submitting}>
              {submitting ? 'Guardando...' : 'Guardar'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold block mb-2">Nombre del proyecto</label>
            <Input
              placeholder="Ej: Torre Atlantica"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm font-semibold block mb-2">Color</label>
            <Input
              placeholder="#3B82F6"
              value={form.color}
              onChange={(event) => setForm((prev) => ({ ...prev, color: event.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm font-semibold block mb-2">Descripcion</label>
            <textarea
              className="w-full rounded-lg border border-border bg-muted p-3 text-sm"
              rows={4}
              placeholder="Describe ubicacion, enfoque comercial y valor diferencial."
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            />
          </div>
        </div>
      </AppModal>

      <AppModal
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) setEditing(null)
        }}
        title="Editar proyecto"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={submitting}>
              {submitting ? 'Actualizando...' : 'Actualizar'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold block mb-2">Nombre del proyecto</label>
            <Input
              placeholder="Ej: Torre Atlantica"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm font-semibold block mb-2">Color</label>
            <Input
              placeholder="#3B82F6"
              value={form.color}
              onChange={(event) => setForm((prev) => ({ ...prev, color: event.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm font-semibold block mb-2">Descripcion</label>
            <textarea
              className="w-full rounded-lg border border-border bg-muted p-3 text-sm"
              rows={4}
              placeholder="Describe ubicacion, enfoque comercial y valor diferencial."
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            />
          </div>
        </div>
      </AppModal>

      <AppModal
        open={Boolean(priceProject)}
        onOpenChange={(open) => {
          if (!open) setPriceProject(null)
        }}
        title={priceProject ? `Consultar precio - ${priceProject.name}` : 'Consultar precio'}
        footer={
          <>
            <Button variant="outline" onClick={() => setPriceProject(null)}>
              Cerrar
            </Button>
          </>
        }
      >
        {priceProject ? (
          <div className="space-y-4">
            <div className="surface-muted p-4 rounded-lg">
              <p className="text-xs text-muted-foreground">Area total</p>
              <p className="text-lg font-semibold">{priceProject.areaTotalM2 ?? '0'} m²</p>
              <p className="text-xs text-muted-foreground mt-2">Estado: {priceProject.estado}</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Precio (S/.)</p>
                <p className="text-sm font-semibold">{formatPriceValue(priceProject.precioSoles)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Precio (USD)</p>
                <p className="text-sm font-semibold">{formatPriceValue(priceProject.precioDolares)}</p>
              </div>
            </div>
          </div>
        ) : null}
      </AppModal>

      <AppModal
        open={Boolean(mediaProject)}
        onOpenChange={(open) => {
          if (!open) {
            setMediaProject(null)
            setMediaItems([])
          }
        }}
        title={mediaProject ? `Media de ${mediaProject.name}` : 'Media del proyecto'}
        footer={
          <>
            <Button variant="outline" onClick={() => setMediaProject(null)}>
              Cerrar
            </Button>
            {mediaProject ? (
              <Button asChild>
                <Link href={`/library?projectId=${mediaProject.id}`}>Abrir biblioteca filtrada</Link>
              </Button>
            ) : null}
          </>
        }
      >
        {loadingMedia ? (
          <div className="py-10 text-center text-muted-foreground">Cargando media del proyecto...</div>
        ) : mediaItems.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground">Este proyecto no tiene archivos multimedia asociados.</div>
        ) : (
          <div className="space-y-3">
            {mediaItems.map((media) => (
              <div key={media.id} className="surface-muted p-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{media.fileName}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {media.mimeType} • {formatSize(media.sizeBytes)} • {new Date(media.createdAt).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Subido por: {media.uploadedBy?.name ?? 'Sin autor'}</p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href={media.url} target="_blank" rel="noreferrer">
                    Abrir
                  </a>
                </Button>
              </div>
            ))}
          </div>
        )}
      </AppModal>
    </div>
  )
}
