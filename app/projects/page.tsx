'use client'

import { useState } from 'react'
import { Edit2, Plus, Trash2 } from 'lucide-react'

import { AppModal } from '@/components/base/app-modal'
import { StatusBadge } from '@/components/base/status-badge'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { projects } from '@/lib/mock-data'

export default function ProjectsPage() {
  const [items, setItems] = useState(projects)
  const [creating, setCreating] = useState(false)

  const removeProject = (id: string) => {
    setItems((prev) => prev.filter((project) => project.id !== id))
  }

  return (
    <div>
      <Breadcrumbs />

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="view-title">Projects</h1>
          <p className="view-subtitle">CRUD visual de proyectos y asociacion con publicaciones.</p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus size={16} className="mr-2" />
          Nuevo proyecto
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {items.map((project) => (
          <div key={project.id} className="surface-card p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-lg">{project.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {project.location} • {project.units} unidades
                </p>
              </div>
              <StatusBadge status={project.status} className="capitalize" />
            </div>

            <p className="text-sm text-muted-foreground">{project.description}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Edit2 size={14} className="mr-2" />
                Editar
              </Button>
              <Button variant="destructive" size="sm" onClick={() => removeProject(project.id)}>
                <Trash2 size={14} className="mr-2" />
                Eliminar
              </Button>
            </div>
          </div>
        ))}
      </div>

      <AppModal
        open={creating}
        onOpenChange={setCreating}
        title="Crear proyecto"
        footer={
          <>
            <Button variant="outline" onClick={() => setCreating(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setCreating(false)}>Guardar</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input placeholder="Nombre del proyecto" />
          <Input placeholder="Ubicacion" />
          <Input placeholder="Cantidad de unidades" />
          <textarea className="w-full rounded-lg border border-border bg-muted p-3 text-sm" rows={3} placeholder="Descripcion" />
        </div>
      </AppModal>
    </div>
  )
}
