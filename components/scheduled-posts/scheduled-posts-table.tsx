'use client'

import { useEffect, useMemo, useState } from 'react'
import { Eye, Edit2, Copy, X, Rocket, RefreshCcw } from 'lucide-react'

import { DataTableCard } from '@/components/base/data-table'
import { StatusBadge } from '@/components/base/status-badge'
import { PostDetailModal, type PostDetail } from '@/components/modals/post-detail-modal'
import { RecurrenceBadge } from '@/components/recurrence-badge'
import { Button } from '@/components/ui/button'
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

export function ScheduledPostsTable({ filters }: ScheduledPostsTableProps) {
  const [posts, setPosts] = useState<ScheduledPostItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPost, setSelectedPost] = useState<PostDetail | null>(null)

  useEffect(() => {
    let mounted = true
    const loadPosts = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch('/api/scheduled-posts')
        if (!response.ok) throw new Error('No se pudieron cargar las publicaciones.')
        const json = await response.json()
        if (mounted) setPosts(json.items ?? [])
      } catch (loadError) {
        if (mounted) setError(loadError instanceof Error ? loadError.message : 'Error cargando publicaciones.')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    loadPosts()
    return () => {
      mounted = false
    }
  }, [])

  const filteredPosts = useMemo(() => posts.filter((post) => {
    const text = `${post.title} ${post.subtitle ?? ''} ${post.caption}`.toLowerCase()
    if (filters.search && !text.includes(filters.search.toLowerCase())) return false
    if (filters.platform !== 'all' && !post.platforms.some((p) => p.toLowerCase().includes(filters.platform))) return false
    if (filters.status !== 'all' && normalizeStatus(post.status) !== filters.status) return false
    if (filters.project !== 'all' && post.project !== filters.project) return false
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
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Edit2 size={16} />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Copy size={16} />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <RefreshCcw size={16} />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-primary">
                  <Rocket size={16} />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive">
                  <X size={16} />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </DataTableCard>

      {selectedPost ? <PostDetailModal post={selectedPost} onClose={() => setSelectedPost(null)} /> : null}
    </>
  )
}
