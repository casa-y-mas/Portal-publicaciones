'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { CalendarClock, Copy, ExternalLink, XCircle } from 'lucide-react'

import { AppModal } from '@/components/base/app-modal'
import { StatusBadge } from '@/components/base/status-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { PostDetail } from '@/components/modals/post-detail-modal'

interface CalendarEventModalProps {
  post: PostDetail
  onClose: () => void
  onUpdated: () => Promise<void> | void
}

const normalizeStatus = (value: string) => value.trim().toLowerCase().replace(/_/g, '-')

export function CalendarEventModal({ post, onClose, onUpdated }: CalendarEventModalProps) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const initialDate = useMemo(() => {
    const d = new Date(post.publishAt)
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    const status = normalizeStatus(post.status)
    return {
      date,
      time,
      status: status === 'draft' || status === 'scheduled' || status === 'cancelled' ? status : 'scheduled',
    }
  }, [post.publishAt, post.status])

  const [form, setForm] = useState(initialDate)

  const persistUpdate = async (payload: Record<string, unknown>) => {
    const response = await fetch(`/api/scheduled-posts/${post.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!response.ok) {
      const json = await response.json().catch(() => null)
      throw new Error(json?.message ?? 'No se pudo actualizar la publicacion.')
    }
  }

  const handleSave = async () => {
    setSubmitting(true)
    setError(null)
    setSuccess(null)
    try {
      const publishAt = new Date(`${form.date}T${form.time}`)
      if (Number.isNaN(publishAt.getTime())) throw new Error('Fecha/hora invalida.')
      if (form.status === 'scheduled') {
        if (publishAt.getTime() < Date.now()) {
          throw new Error('No puedes programar en una fecha pasada.')
        }
        if (!post.mediaAssetId) {
          throw new Error('Para programar debes asociar un archivo multimedia.')
        }
        if (!post.platforms || post.platforms.length === 0) {
          throw new Error('Para programar debes seleccionar al menos una red.')
        }
      }
      await persistUpdate({ publishAt: publishAt.toISOString(), status: form.status })
      setSuccess('Cambios guardados.')
      await onUpdated()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Error guardando cambios.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDuplicate = async () => {
    setSubmitting(true)
    setError(null)
    setSuccess(null)
    try {
      const response = await fetch(`/api/scheduled-posts/${post.id}/duplicate`, { method: 'POST' })
      if (!response.ok) {
        const json = await response.json().catch(() => null)
        throw new Error(json?.message ?? 'No se pudo duplicar.')
      }
      setSuccess('Publicacion duplicada.')
      await onUpdated()
    } catch (duplicateError) {
      setError(duplicateError instanceof Error ? duplicateError.message : 'Error duplicando.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancelPost = async () => {
    if (!confirm(`Cancelar "${post.title}"?`)) return
    setSubmitting(true)
    setError(null)
    setSuccess(null)
    try {
      await persistUpdate({ status: 'cancelled' })
      setForm((prev) => ({ ...prev, status: 'cancelled' }))
      setSuccess('Publicacion cancelada.')
      await onUpdated()
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : 'Error cancelando.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AppModal
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      title="Detalle de evento"
      description="Gestion rapida desde calendario"
      footer={(
        <>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cerrar
          </Button>
          <Button onClick={handleSave} disabled={submitting}>
            {submitting ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </>
      )}
    >
      <div className="space-y-5">
        <div className="surface-muted p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">{post.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">{post.project} • {post.platforms.join(', ')}</p>
            </div>
            <StatusBadge status={post.status} />
          </div>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {success ? <p className="text-sm text-primary">{success}</p> : null}

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-semibold block mb-2">Fecha</label>
            <Input type="date" value={form.date} onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))} />
          </div>
          <div>
            <label className="text-sm font-semibold block mb-2">Hora</label>
            <Input type="time" value={form.time} onChange={(e) => setForm((prev) => ({ ...prev, time: e.target.value }))} />
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold block mb-2">Estado</label>
          <select
            value={form.status}
            onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
            className="w-full bg-muted border border-border rounded-lg px-3 py-2"
          >
            <option value="draft">Borrador</option>
            <option value="scheduled">Programado</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </div>

        <div className="grid sm:grid-cols-3 gap-2">
          <Button type="button" variant="outline" onClick={handleDuplicate} disabled={submitting}>
            <Copy size={14} className="mr-2" />
            Duplicar
          </Button>
          <Button type="button" variant="outline" onClick={handleCancelPost} disabled={submitting} className="text-destructive">
            <XCircle size={14} className="mr-2" />
            Cancelar
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/publicaciones-programadas">
              <ExternalLink size={14} className="mr-2" />
              Abrir gestor
            </Link>
          </Button>
        </div>

        <div className="surface-muted p-3">
          <p className="text-xs text-muted-foreground inline-flex items-center gap-2">
            <CalendarClock size={13} />
            Ultima programacion: {new Date(post.publishAt).toLocaleString()}
          </p>
        </div>
      </div>
    </AppModal>
  )
}
