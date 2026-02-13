'use client'

import { useMemo, useState } from 'react'
import { Copy, Download, Play, Search, Trash2, UploadCloud } from 'lucide-react'

import { AppModal } from '@/components/base/app-modal'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { mediaLibrary, projects } from '@/lib/mock-data'

export default function LibraryPage() {
  const [search, setSearch] = useState('')
  const [projectFilter, setProjectFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [selectedMedia, setSelectedMedia] = useState<(typeof mediaLibrary)[number] | null>(null)

  const categories = useMemo(() => ['all', ...Array.from(new Set(mediaLibrary.map((media) => media.category)))], [])

  const filteredMedia = mediaLibrary.filter((media) => {
    const matchesText =
      media.filename.toLowerCase().includes(search.toLowerCase()) ||
      media.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()))
    const matchesProject = projectFilter === 'all' || media.project === projectFilter
    const matchesCategory = categoryFilter === 'all' || media.category === categoryFilter
    return matchesText && matchesProject && matchesCategory
  })

  return (
    <div>
      <Breadcrumbs />

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="view-title">Media Library</h1>
          <p className="view-subtitle">Galeria multimedia con categorias, tags, filtros por proyecto y metadata.</p>
        </div>
        <Button>
          <UploadCloud size={16} className="mr-2" />
          Subir contenido
        </Button>
      </div>

      <div className="surface-card p-4 mb-6 grid md:grid-cols-3 gap-3">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            type="text"
            placeholder="Buscar por nombre o tags..."
            className="pl-10"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select
            value={projectFilter}
            onChange={(event) => setProjectFilter(event.target.value)}
            className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground"
          >
            <option value="all">Todos los proyectos</option>
            {projects.map((project) => (
              <option key={project.id} value={project.name}>
                {project.name}
              </option>
            ))}
          </select>
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category === 'all' ? 'Categorias' : category}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredMedia.map((media) => (
          <div
            key={media.id}
            className="surface-card overflow-hidden hover:border-primary/40 transition-colors group cursor-pointer"
            onClick={() => setSelectedMedia(media)}
          >
            <div className="relative bg-muted aspect-square flex items-center justify-center overflow-hidden">
              {media.type === 'video' ? (
                <>
                  <div className="text-2xl text-muted-foreground">Video</div>
                  <div className="absolute inset-0 bg-foreground/10 group-hover:bg-foreground/20 transition-colors flex items-center justify-center">
                    <Play size={26} className="text-foreground" />
                  </div>
                </>
              ) : (
                <>
                  <div className="text-2xl text-muted-foreground">Imagen</div>
                  <div className="absolute inset-0 bg-foreground/10 group-hover:bg-foreground/20 transition-colors" />
                </>
              )}
            </div>

            <div className="p-4 space-y-1">
              <p className="text-sm font-semibold text-foreground truncate">{media.filename}</p>
              <p className="text-xs text-muted-foreground">{media.project}</p>
              <p className="text-xs text-muted-foreground">
                {media.category} • {media.thumbnail}
              </p>
              <div className="flex gap-1 mt-2 flex-wrap">
                {media.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <AppModal
        open={Boolean(selectedMedia)}
        onOpenChange={(open) => {
          if (!open) setSelectedMedia(null)
        }}
        title="Detalle de media"
        footer={
          <>
            <Button variant="outline">
              <Copy size={16} className="mr-2" />
              Usar en post
            </Button>
            <Button variant="outline">
              <Download size={16} className="mr-2" />
              Descargar
            </Button>
            <Button variant="destructive">
              <Trash2 size={16} className="mr-2" />
              Eliminar
            </Button>
          </>
        }
      >
        {selectedMedia ? (
          <div className="space-y-6">
            <div className="surface-muted p-12 text-center">
              <div className="text-5xl text-muted-foreground mb-3">{selectedMedia.type === 'video' ? 'Video' : 'Imagen'}</div>
              <p className="text-sm text-muted-foreground">Preview de contenido</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold block mb-2">Archivo</label>
                <p className="text-foreground">{selectedMedia.filename}</p>
              </div>
              <div>
                <label className="text-sm font-semibold block mb-2">Proyecto</label>
                <p className="text-foreground">{selectedMedia.project}</p>
              </div>
              <div>
                <label className="text-sm font-semibold block mb-2">Tipo</label>
                <p className="text-foreground capitalize">{selectedMedia.type}</p>
              </div>
              <div>
                <label className="text-sm font-semibold block mb-2">Categoria</label>
                <p className="text-foreground">{selectedMedia.category}</p>
              </div>
              <div>
                <label className="text-sm font-semibold block mb-2">Duracion</label>
                <p className="text-foreground">{selectedMedia.duration || 'No aplica'}</p>
              </div>
              <div>
                <label className="text-sm font-semibold block mb-2">Tamano</label>
                <p className="text-foreground">{selectedMedia.size}</p>
              </div>
              <div>
                <label className="text-sm font-semibold block mb-2">Resolucion</label>
                <p className="text-foreground">{selectedMedia.resolution}</p>
              </div>
              <div>
                <label className="text-sm font-semibold block mb-2">Subido por</label>
                <p className="text-foreground">{selectedMedia.uploadedBy}</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold block mb-2">Tags</label>
              <div className="flex gap-2 flex-wrap">
                {selectedMedia.tags.map((tag) => (
                  <span key={tag} className="bg-muted text-muted-foreground px-3 py-1 rounded text-sm">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </AppModal>
    </div>
  )
}
