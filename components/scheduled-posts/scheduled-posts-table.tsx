'use client'

import { useState } from 'react'
import { Eye, Edit2, Copy, X, Rocket, RefreshCcw } from 'lucide-react'

import { DataTableCard } from '@/components/base/data-table'
import { StatusBadge } from '@/components/base/status-badge'
import { PostDetailModal, type PostDetail } from '@/components/modals/post-detail-modal'
import { RecurrenceBadge } from '@/components/recurrence-badge'
import { Button } from '@/components/ui/button'
import { TableCell, TableRow } from '@/components/ui/table'
import { scheduledPosts } from '@/lib/mock-data'

interface ScheduledPostsTableProps {
  filters: {
    search: string
    platform: string
    status: string
    project: string
    user: string
  }
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

const toPostDetail = (post: (typeof scheduledPosts)[number]): PostDetail => ({
  ...post,
  publishAt: post.publishAt.toISOString(),
})

export function ScheduledPostsTable({ filters }: ScheduledPostsTableProps) {
  const [selectedPost, setSelectedPost] = useState<PostDetail | null>(null)

  const filteredPosts = scheduledPosts.filter((post) => {
    const text = `${post.title} ${post.caption}`.toLowerCase()
    if (filters.search && !text.includes(filters.search.toLowerCase())) return false
    if (filters.platform !== 'all' && !post.platforms.some((p) => p.toLowerCase().includes(filters.platform))) return false
    if (filters.status !== 'all' && post.status !== filters.status) return false
    if (filters.project !== 'all' && post.project !== filters.project) return false
    if (filters.user !== 'all' && post.creator !== filters.user) return false
    return true
  })

  return (
    <>
      <DataTableCard columns={columns} empty={filteredPosts.length === 0} emptyMessage="No hay publicaciones para estos filtros.">
        {filteredPosts.map((post) => (
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
            <TableCell className="text-sm text-muted-foreground">{post.publishAt.toLocaleString()}</TableCell>
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
                <Button variant="ghost" size="sm" onClick={() => setSelectedPost(toPostDetail(post))} className="h-8 w-8 p-0">
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
