'use client'

import { useState } from 'react'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { projects } from '@/lib/mock-data'
import { Plus, Edit2, Trash2 } from 'lucide-react'

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
          <h1 className="text-3xl font-bold text-foreground mb-2">Projects</h1>
          <p className="text-muted-foreground">CRUD visual de proyectos y asociacion con publicaciones.</p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus size={16} className="mr-2" />
          Nuevo proyecto
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {items.map((project) => (
          <div key={project.id} className="bg-card border border-border rounded-lg p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-lg">{project.name}</h3>
                <p className="text-sm text-muted-foreground">{project.location} • {project.units} unidades</p>
              </div>
              <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: `${project.color}22`, color: project.color }}>
                {project.status}
              </span>
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

      {creating && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg max-w-lg w-full p-6 space-y-4">
            <h2 className="text-xl font-bold">Crear proyecto</h2>
            <Input placeholder="Nombre del proyecto" />
            <Input placeholder="Ubicacion" />
            <Input placeholder="Cantidad de unidades" />
            <textarea className="w-full rounded-lg border border-border bg-muted p-3 text-sm" rows={3} placeholder="Descripcion" />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreating(false)}>Cancelar</Button>
              <Button onClick={() => setCreating(false)}>Guardar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
