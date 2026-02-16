'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Edit2, Image as ImageIcon, Plus, Trash2 } from 'lucide-react'

import { AppModal } from '@/components/base/app-modal'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface ProjectItem {
  id: string
  name: string
  color: string
  description: string | null
  createdAt: string
  updatedAt: string
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
          <p className="view-subtitle">Gestion completa de proyectos inmobiliarios conectados a publicaciones y media.</p>
        </div>
        <Button onClick={openCreateModal} disabled={loading}>
          <Plus size={16} className="mr-2" />
          Nuevo proyecto
        </Button>
      </div>

      {error ? (
        <div className="surface-muted p-3 mb-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      ) : null}

      {loading ? (
        <div className="surface-card p-12 text-center text-muted-foreground">Cargando proyectos...</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {items.map((project) => (
            <div key={project.id} className="surface-card p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-lg">{project.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {project.description?.trim() || 'Sin descripcion'}
                  </p>
                </div>
                <span
                  className="inline-flex h-7 min-w-7 items-center justify-center rounded-full border border-border px-2 text-xs font-semibold"
                  style={{ backgroundColor: `${project.color}22`, color: project.color }}
                >
                  {project.color}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="surface-muted p-2">
                  <p className="text-[11px] text-muted-foreground">Posts</p>
                  <p className="text-sm font-semibold">{project._count.posts}</p>
                </div>
                <div className="surface-muted p-2">
                  <p className="text-[11px] text-muted-foreground">Media</p>
                  <p className="text-sm font-semibold">{project._count.mediaAssets}</p>
                </div>
                <div className="surface-muted p-2">
                  <p className="text-[11px] text-muted-foreground">Cuentas</p>
                  <p className="text-sm font-semibold">{project._count.socialAccounts}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openProjectMedia(project)}>
                  <ImageIcon size={14} className="mr-2" />
                  Media del proyecto
                </Button>
                <Button variant="secondary" size="sm" asChild>
                  <Link href={`/library?projectId=${project.id}`}>Ver media</Link>
                </Button>
                <Button variant="outline" size="sm" onClick={() => openEditModal(project)}>
                  <Edit2 size={14} className="mr-2" />
                  Editar
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(project)}>
                  <Trash2 size={14} className="mr-2" />
                  Eliminar
                </Button>
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
