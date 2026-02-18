'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Eye, Edit2, Copy, X } from 'lucide-react'

import { AppModal } from '@/components/base/app-modal'
import { DataTableCard } from '@/components/base/data-table'
import { StatusBadge } from '@/components/base/status-badge'
import { PostDetailModal, type PostDetail } from '@/components/modals/post-detail-modal'
import { RecurrenceBadge } from '@/components/recurrence-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TableCell, TableRow } from '@/components/ui/table'

interface ScheduledPostsTableProps {
  filters: {
    search: string
    platform: string
    status: string
    project: string
    user: string
  }
}

interface ScheduledPostItem extends PostDetail {
  projectId?: string
  status: string
}

const columns = [
  { key: 'title', label: 'Titulo' },
  { key: 'platforms', label: 'Red' },
  { key: 'project', label: 'Proyecto' },
  { key: 'publishAt', label: 'Publicar' },
  { key: 'sequence', label: 'Secuencia' },
  { key: 'recurrence', label: 'Repeticion' },
  { key: 'status', label: 'Estado' },
  { key: 'actions', label: 'Acciones' },
]

const normalizeStatus = (value: string) => value.trim().toLowerCase().replace(/_/g, '-')
const normalizePlatform = (value: string) => value.trim().toLowerCase()

export function ScheduledPostsTable({ filters }: ScheduledPostsTableProps) {
  const [posts, setPosts] = useState<ScheduledPostItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [selectedPost, setSelectedPost] = useState<PostDetail | null>(null)
  const [editingPost, setEditingPost] = useState<ScheduledPostItem | null>(null)
  const [savingEdit, setSavingEdit] = useState(false)
  const [actingId, setActingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    title: '',
    subtitle: '',
    caption: '',
    publishDate: '',
    publishTime: '',
    status: 'scheduled',
  })

  const loadPosts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/scheduled-posts')
      if (!response.ok) throw new Error('No se pudieron cargar las publicaciones.')
      const json = await response.json()
      setPosts(json.items ?? [])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Error cargando publicaciones.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPosts()
  }, [loadPosts])

  const openEditModal = (post: ScheduledPostItem) => {
    const publishDate = new Date(post.publishAt)
    const date = `${publishDate.getFullYear()}-${(publishDate.getMonth() + 1).toString().padStart(2, '0')}-${publishDate.getDate().toString().padStart(2, '0')}`
    const time = `${publishDate.getHours().toString().padStart(2, '0')}:${publishDate.getMinutes().toString().padStart(2, '0')}`
    const statusValue = normalizeStatus(post.status)
    setEditingPost(post)
    setEditForm({
      title: post.title,
      subtitle: post.subtitle ?? '',
      caption: post.caption,
      publishDate: date,
      publishTime: time,
      status: statusValue === 'draft' || statusValue === 'scheduled' || statusValue === 'cancelled' ? statusValue : 'scheduled',
    })
  }

  const saveEdit = async () => {
    if (!editingPost) return
    setSavingEdit(true)
    setError(null)
    setSuccess(null)
    try {
      const publishAt = new Date(`${editForm.publishDate}T${editForm.publishTime}`)
      if (Number.isNaN(publishAt.getTime())) throw new Error('Fecha y hora invalidas.')
      const response = await fetch(`/api/scheduled-posts/${editingPost.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editForm.title.trim(),
          subtitle: editForm.subtitle.trim(),
          caption: editForm.caption.trim(),
          publishAt: publishAt.toISOString(),
          status: editForm.status,
        }),
      })
      if (!response.ok) {
        const json = await response.json().catch(() => null)
        throw new Error(json?.message ?? 'No se pudo actualizar la publicacion.')
      }
      setEditingPost(null)
      setSuccess('Publicacion actualizada correctamente.')
      await loadPosts()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Error actualizando publicacion.')
    } finally {
      setSavingEdit(false)
    }
  }

  const duplicatePost = async (postId: string) => {
    setActingId(postId)
    setError(null)
    setSuccess(null)
    try {
      const response = await fetch(`/api/scheduled-posts/${postId}/duplicate`, { method: 'POST' })
      if (!response.ok) {
        const json = await response.json().catch(() => null)
        throw new Error(json?.message ?? 'No se pudo duplicar la publicacion.')
      }
      setSuccess('Publicacion duplicada correctamente.')
      await loadPosts()
    } catch (duplicateError) {
      setError(duplicateError instanceof Error ? duplicateError.message : 'Error duplicando publicacion.')
    } finally {
      setActingId(null)
    }
  }

  const cancelPost = async (post: ScheduledPostItem) => {
    if (!confirm(`Cancelar la publicacion "${post.title}"?`)) return
    setActingId(post.id)
    setError(null)
    setSuccess(null)
    try {
      const response = await fetch(`/api/scheduled-posts/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      })
      if (!response.ok) {
        const json = await response.json().catch(() => null)
        throw new Error(json?.message ?? 'No se pudo cancelar la publicacion.')
      }
      setSuccess('Publicacion cancelada.')
      await loadPosts()
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : 'Error cancelando publicacion.')
    } finally {
      setActingId(null)
    }
  }

  const filteredPosts = useMemo(() => posts.filter((post) => {
    const text = `${post.title} ${post.subtitle ?? ''} ${post.caption}`.toLowerCase()
    if (filters.search && !text.includes(filters.search.toLowerCase())) return false
    if (
      filters.platform !== 'all' &&
      !post.platforms.some((p) => normalizePlatform(p).includes(filters.platform))
    ) return false
    if (filters.status !== 'all' && normalizeStatus(post.status) !== filters.status) return false
    if (filters.project !== 'all' && post.projectId !== filters.project) return false
    if (filters.user !== 'all' && post.creator !== filters.user) return false
    return true
  }), [posts, filters])

  return (
    <>
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

      <DataTableCard columns={columns} empty={filteredPosts.length === 0} emptyMessage="No hay publicaciones para estos filtros.">
        {loading ? (
          <TableRow>
            <TableCell colSpan={columns.length} className="py-10 text-center text-muted-foreground">
              Cargando publicaciones...
            </TableCell>
          </TableRow>
        ) : null}

        {!loading && filteredPosts.map((post) => (
          <TableRow key={post.id} className="hover:bg-muted/30">
            <TableCell className="text-sm font-medium">{post.title}</TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {post.platforms.map((platform) => (
                  <span key={platform} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                    {platform}
                  </span>
                ))}
              </div>
            </TableCell>
            <TableCell className="text-sm">{post.project}</TableCell>
            <TableCell className="text-sm text-muted-foreground">{new Date(post.publishAt).toLocaleString()}</TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {post.sequenceGroupId ? `Grupo ${post.sequenceGroupId} / #${post.sequenceOrder || 1}` : 'No'}
            </TableCell>
            <TableCell>
              <RecurrenceBadge recurrence={post.recurrence} />
            </TableCell>
            <TableCell>
              <StatusBadge status={post.status} />
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setSelectedPost(post)} className="h-8 w-8 p-0">
                  <Eye size={16} />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEditModal(post)} disabled={actingId === post.id}>
                  <Edit2 size={16} />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => duplicatePost(post.id)} disabled={actingId === post.id}>
                  <Copy size={16} />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => cancelPost(post)} disabled={actingId === post.id}>
                  <X size={16} />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </DataTableCard>

      {selectedPost ? <PostDetailModal post={selectedPost} onClose={() => setSelectedPost(null)} /> : null}
      {editingPost ? (
        <AppModal
          open
          onOpenChange={(open) => {
            if (!open) setEditingPost(null)
          }}
          title="Editar publicacion"
          footer={(
            <>
              <Button variant="outline" onClick={() => setEditingPost(null)} disabled={savingEdit}>
                Cancelar
              </Button>
              <Button onClick={saveEdit} disabled={savingEdit}>
                {savingEdit ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </>
          )}
        >
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold block mb-2">Titulo</label>
              <Input value={editForm.title} onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-semibold block mb-2">Subtitulo</label>
              <Input value={editForm.subtitle} onChange={(e) => setEditForm((prev) => ({ ...prev, subtitle: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-semibold block mb-2">Texto</label>
              <textarea
                className="w-full bg-muted border border-border rounded-lg p-3 text-foreground placeholder-muted-foreground resize-none"
                rows={4}
                value={editForm.caption}
                onChange={(e) => setEditForm((prev) => ({ ...prev, caption: e.target.value }))}
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold block mb-2">Fecha</label>
                <Input type="date" value={editForm.publishDate} onChange={(e) => setEditForm((prev) => ({ ...prev, publishDate: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-semibold block mb-2">Hora</label>
                <Input type="time" value={editForm.publishTime} onChange={(e) => setEditForm((prev) => ({ ...prev, publishTime: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold block mb-2">Estado</label>
              <select
                className="w-full bg-muted border border-border rounded-lg px-3 py-2"
                value={editForm.status}
                onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value }))}
              >
                <option value="draft">Borrador</option>
                <option value="scheduled">Programado</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
          </div>
        </AppModal>
      ) : null}
    </>
  )
}
