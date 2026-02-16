'use client'

import { useEffect, useMemo, useState } from 'react'
import { Copy, Download, Edit2, Play, Search, Trash2, UploadCloud } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

import { AppModal } from '@/components/base/app-modal'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type MediaType = 'image' | 'video'

interface ProjectOption {
  id: string
  name: string
  color: string
}

interface MediaItem {
  id: string
  fileName: string
  url: string
  mimeType: string
  type: MediaType
  sizeBytes: number
  tagsJson: string[]
  projectId: string
  uploadedById: string | null
  createdAt: string
  updatedAt: string
  project: ProjectOption
  uploadedBy: { id: string; name: string; email: string } | null
}

interface MediaFormState {
  fileName: string
  url: string
  mimeType: string
  type: MediaType
  sizeBytes: string
  tags: string
  projectId: string
}

const emptyForm: MediaFormState = {
  fileName: '',
  url: '',
  mimeType: '',
  type: 'image',
  sizeBytes: '',
  tags: '',
  projectId: '',
}

const formatSize = (sizeBytes: number) => {
  if (sizeBytes < 1024) return `${sizeBytes} B`
  if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(1)} KB`
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`
}

const parseTags = (input: string) =>
  input
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)

function MediaPreview({
  url,
  type,
  className,
  controls = false,
}: {
  url: string
  type: MediaType
  className?: string
  controls?: boolean
}) {
  const [failed, setFailed] = useState(false)

  if (!url || failed) {
    return (
      <div className={`w-full h-full flex items-center justify-center text-muted-foreground ${className || ''}`}>
        {type === 'video' ? 'Video' : 'Imagen'}
      </div>
    )
  }

  if (type === 'video') {
    return (
      <video
        src={url}
        className={`w-full h-full object-cover ${className || ''}`}
        controls={controls}
        muted
        playsInline
        preload="metadata"
        onError={() => setFailed(true)}
      />
    )
  }

  return <img src={url} alt="Vista previa" className={`w-full h-full object-cover ${className || ''}`} onError={() => setFailed(true)} />
}

export default function LibraryPage() {
  const searchParams = useSearchParams()
  const [items, setItems] = useState<MediaItem[]>([])
  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [projectFilter, setProjectFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState<'all' | MediaType>('all')
  const [tagFilter, setTagFilter] = useState('all')

  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [editingMedia, setEditingMedia] = useState<MediaItem | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState<MediaFormState>(emptyForm)

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [mediaResponse, projectsResponse] = await Promise.all([fetch('/api/media'), fetch('/api/projects')])
      if (!mediaResponse.ok || !projectsResponse.ok) {
        throw new Error('No se pudo cargar la libreria.')
      }

      const mediaJson = await mediaResponse.json()
      const projectsJson = await projectsResponse.json()
      setItems(mediaJson.items ?? [])
      setProjects(projectsJson.items ?? [])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Error al cargar datos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    const projectIdFromQuery = searchParams.get('projectId')
    if (!projectIdFromQuery) return
    setProjectFilter(projectIdFromQuery)
  }, [searchParams])

  const availableTags = useMemo(
    () => Array.from(new Set(items.flatMap((item) => item.tagsJson || []))).sort((a, b) => a.localeCompare(b)),
    [items],
  )

  const filteredMedia = useMemo(() => {
    return items.filter((media) => {
      const matchesText =
        media.fileName.toLowerCase().includes(search.toLowerCase()) ||
        media.mimeType.toLowerCase().includes(search.toLowerCase()) ||
        media.project.name.toLowerCase().includes(search.toLowerCase()) ||
        media.tagsJson.some((tag) => tag.toLowerCase().includes(search.toLowerCase()))
      const matchesProject = projectFilter === 'all' || media.projectId === projectFilter
      const matchesType = typeFilter === 'all' || media.type === typeFilter
      const matchesTag = tagFilter === 'all' || media.tagsJson.includes(tagFilter)
      return matchesText && matchesProject && matchesType && matchesTag
    })
  }, [items, search, projectFilter, typeFilter, tagFilter])

  const openCreateModal = () => {
    setForm({
      ...emptyForm,
      projectId: projectFilter !== 'all' ? projectFilter : (projects[0]?.id ?? ''),
    })
    setCreateOpen(true)
  }

  const activeProjectName =
    projectFilter === 'all' ? null : projects.find((project) => project.id === projectFilter)?.name ?? null

  const openEditModal = (media: MediaItem) => {
    setForm({
      fileName: media.fileName,
      url: media.url,
      mimeType: media.mimeType,
      type: media.type,
      sizeBytes: String(media.sizeBytes),
      tags: (media.tagsJson || []).join(', '),
      projectId: media.projectId,
    })
    setEditingMedia(media)
  }

  const handleUploadFile = async (file: File) => {
    setUploading(true)
    setError(null)
    try {
      const payload = new FormData()
      payload.append('file', file)

      const response = await fetch('/api/uploads', {
        method: 'POST',
        body: payload,
      })
      if (!response.ok) {
        throw new Error('No se pudo subir el archivo.')
      }

      const uploaded = await response.json()
      setForm((prev) => ({
        ...prev,
        fileName: uploaded.fileName || prev.fileName,
        url: uploaded.url || prev.url,
        mimeType: uploaded.mimeType || prev.mimeType,
        sizeBytes: String(uploaded.sizeBytes || prev.sizeBytes),
        type: uploaded.mimeType?.startsWith('video/') ? 'video' : 'image',
      }))
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Error en la subida.')
    } finally {
      setUploading(false)
    }
  }

  const handleCreate = async () => {
    setSubmitting(true)
    setError(null)
    try {
      if (!form.fileName || !form.url || !form.mimeType || !form.projectId || !form.sizeBytes) {
        throw new Error('Completa todos los campos obligatorios.')
      }

      const response = await fetch('/api/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: form.fileName,
          url: form.url,
          mimeType: form.mimeType,
          type: form.type,
          sizeBytes: Number(form.sizeBytes),
          tags: parseTags(form.tags),
          projectId: form.projectId,
        }),
      })

      if (!response.ok) {
        throw new Error('No se pudo crear el archivo multimedia.')
      }

      setCreateOpen(false)
      setForm(emptyForm)
      await loadData()
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Error creando archivo multimedia.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async () => {
    if (!editingMedia) return

    setSubmitting(true)
    setError(null)
    try {
      if (!form.fileName || !form.url || !form.mimeType || !form.projectId || !form.sizeBytes) {
        throw new Error('Completa todos los campos obligatorios.')
      }

      const response = await fetch(`/api/media/${editingMedia.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: form.fileName,
          url: form.url,
          mimeType: form.mimeType,
          type: form.type,
          sizeBytes: Number(form.sizeBytes),
          tags: parseTags(form.tags),
          projectId: form.projectId,
        }),
      })

      if (!response.ok) {
        throw new Error('No se pudo actualizar el archivo multimedia.')
      }

      setEditingMedia(null)
      setForm(emptyForm)
      await loadData()
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Error actualizando archivo multimedia.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    setError(null)
    try {
      const response = await fetch(`/api/media/${id}`, { method: 'DELETE' })
      if (!response.ok) {
        throw new Error('No se pudo eliminar el archivo multimedia.')
      }
      if (selectedMedia?.id === id) setSelectedMedia(null)
      await loadData()
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Error eliminando archivo multimedia.')
    }
  }

  const formBody = (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-semibold block mb-2">Archivo</label>
        <Input
          type="file"
          accept="image/*,video/*"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) handleUploadFile(file)
          }}
          disabled={uploading || submitting}
        />
        <p className="text-xs text-muted-foreground mt-1">Soporta modo local o S3 simulado segun `STORAGE_DRIVER`.</p>
      </div>

      <div>
        <label className="text-sm font-semibold block mb-2">Nombre archivo</label>
        <Input value={form.fileName} onChange={(event) => setForm((prev) => ({ ...prev, fileName: event.target.value }))} required />
      </div>
      <div>
        <label className="text-sm font-semibold block mb-2">URL</label>
        <Input value={form.url} onChange={(event) => setForm((prev) => ({ ...prev, url: event.target.value }))} required />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-semibold block mb-2">Tipo MIME</label>
          <Input value={form.mimeType} onChange={(event) => setForm((prev) => ({ ...prev, mimeType: event.target.value }))} required />
        </div>
        <div>
          <label className="text-sm font-semibold block mb-2">Tamano (bytes)</label>
          <Input
            type="number"
            min={1}
            value={form.sizeBytes}
            onChange={(event) => setForm((prev) => ({ ...prev, sizeBytes: event.target.value }))}
            required
          />
        </div>
      </div>
      <div>
        <label className="text-sm font-semibold block mb-2">Etiquetas (separadas por coma)</label>
        <Input
          value={form.tags}
          onChange={(event) => setForm((prev) => ({ ...prev, tags: event.target.value }))}
          placeholder="tour, fachada, lead-gen"
        />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-semibold block mb-2">Tipo</label>
          <select
            value={form.type}
            onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value as MediaType }))}
            className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground"
          >
            <option value="image">Imagen</option>
            <option value="video">Video</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-semibold block mb-2">Proyecto</label>
          <select
            value={form.projectId}
            onChange={(event) => setForm((prev) => ({ ...prev, projectId: event.target.value }))}
            className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground"
          >
            <option value="" disabled>
              Seleccionar proyecto
            </option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )

  return (
    <div>
      <Breadcrumbs />

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="view-title">Biblioteca multimedia</h1>
          <p className="view-subtitle">CRUD de archivos multimedia con filtros, etiquetas y detalle por proyecto.</p>
          {activeProjectName ? (
            <p className="text-xs text-muted-foreground mt-2">
              Filtro activo por proyecto: <span className="font-semibold text-foreground">{activeProjectName}</span>
            </p>
          ) : null}
        </div>
        <Button onClick={openCreateModal} disabled={loading || projects.length === 0}>
          <UploadCloud size={16} className="mr-2" />
          Nuevo archivo
        </Button>
      </div>

      {error ? (
        <div className="surface-muted p-3 mb-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      ) : null}

      <div className="surface-card p-4 mb-6 grid md:grid-cols-4 gap-3">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
          <Input type="text" placeholder="Buscar por archivo, mime, proyecto o tag..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <select
            value={projectFilter}
            onChange={(event) => setProjectFilter(event.target.value)}
            className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground"
          >
            <option value="all">Todos los proyectos</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value as 'all' | MediaType)}
            className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground"
          >
            <option value="all">Tipos</option>
            <option value="image">Imagen</option>
            <option value="video">Video</option>
          </select>
        </div>
        <select
          value={tagFilter}
          onChange={(event) => setTagFilter(event.target.value)}
          className="bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground"
        >
          <option value="all">Todas las etiquetas</option>
          {availableTags.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="surface-card p-12 text-center text-muted-foreground">Cargando biblioteca multimedia...</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredMedia.map((media) => (
            <div key={media.id} className="surface-card overflow-hidden hover:border-primary/40 transition-colors group">
              <button className="relative w-full bg-muted aspect-square flex items-center justify-center overflow-hidden" onClick={() => setSelectedMedia(media)}>
                <MediaPreview url={media.url} type={media.type} />
                {media.type === 'video' ? (
                  <div className="absolute inset-0 bg-foreground/10 group-hover:bg-foreground/20 transition-colors flex items-center justify-center">
                    <Play size={26} className="text-foreground" />
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-foreground/10 group-hover:bg-foreground/20 transition-colors" />
                )}
              </button>

              <div className="p-4 space-y-1">
                <p className="text-sm font-semibold text-foreground truncate">{media.fileName}</p>
                <p className="text-xs text-muted-foreground">{media.project.name}</p>
                <p className="text-xs text-muted-foreground">
                  {media.mimeType} • {formatSize(media.sizeBytes)}
                </p>
                <p className="text-xs text-muted-foreground">{media.uploadedBy?.name ?? 'Sin autor'}</p>
                <div className="flex flex-wrap gap-1 pt-1">
                  {(media.tagsJson || []).slice(0, 3).map((tag) => (
                    <span key={tag} className="text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => openEditModal(media)}>
                    <Edit2 size={14} />
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(media.id)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filteredMedia.length === 0 ? (
        <div className="surface-card p-8 text-center text-muted-foreground mt-4">No hay archivos para los filtros seleccionados.</div>
      ) : null}

      <AppModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Crear archivo"
        footer={
          <>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={submitting || uploading}>
              {submitting || uploading ? 'Guardando...' : 'Guardar'}
            </Button>
          </>
        }
      >
        {formBody}
      </AppModal>

      <AppModal
        open={Boolean(editingMedia)}
        onOpenChange={(open) => {
          if (!open) setEditingMedia(null)
        }}
        title="Editar archivo"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditingMedia(null)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={submitting || uploading}>
              {submitting || uploading ? 'Actualizando...' : 'Actualizar'}
            </Button>
          </>
        }
      >
        {formBody}
      </AppModal>

      <AppModal
        open={Boolean(selectedMedia)}
        onOpenChange={(open) => {
          if (!open) setSelectedMedia(null)
        }}
        title="Detalle de media"
        footer={
          <>
            <Button
              variant="outline"
              onClick={async () => {
                if (!selectedMedia?.url) return
                await navigator.clipboard.writeText(selectedMedia.url)
              }}
            >
              <Copy size={16} className="mr-2" />
              Copiar URL
            </Button>
            <Button variant="outline" asChild>
              <a href={selectedMedia?.url} target="_blank" rel="noreferrer">
                <Download size={16} className="mr-2" />
                Abrir archivo
              </a>
            </Button>
          </>
        }
      >
        {selectedMedia ? (
          <div className="space-y-6">
            <div className="surface-muted p-4">
              <div className="aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                <MediaPreview url={selectedMedia.url} type={selectedMedia.type} controls className="max-h-[60vh]" />
              </div>
              <p className="text-sm text-muted-foreground mt-2">Vista previa del contenido</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold block mb-2">Archivo</label>
                <p className="text-foreground">{selectedMedia.fileName}</p>
              </div>
              <div>
                <label className="text-sm font-semibold block mb-2">Proyecto</label>
                <p className="text-foreground">{selectedMedia.project.name}</p>
              </div>
              <div>
                <label className="text-sm font-semibold block mb-2">Mime</label>
                <p className="text-foreground">{selectedMedia.mimeType}</p>
              </div>
              <div>
                <label className="text-sm font-semibold block mb-2">Tamano</label>
                <p className="text-foreground">{formatSize(selectedMedia.sizeBytes)}</p>
              </div>
              <div>
                <label className="text-sm font-semibold block mb-2">Subido por</label>
                <p className="text-foreground">{selectedMedia.uploadedBy?.name ?? 'Sin autor'}</p>
              </div>
              <div>
                <label className="text-sm font-semibold block mb-2">Creado</label>
                <p className="text-foreground">{new Date(selectedMedia.createdAt).toLocaleString()}</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold block mb-2">Etiquetas</label>
              <div className="flex flex-wrap gap-2">
                {(selectedMedia.tagsJson || []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin etiquetas</p>
                ) : (
                  (selectedMedia.tagsJson || []).map((tag) => (
                    <span key={tag} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                      {tag}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : null}
      </AppModal>
    </div>
  )
}
