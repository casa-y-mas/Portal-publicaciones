'use client'

import { useState } from 'react'
import { scheduledPosts } from '@/lib/mock-data'
import { Button } from '@/components/ui/button'
import { Eye, Edit2, Copy, X } from 'lucide-react'
import { PostDetailModal } from '@/components/modals/post-detail-modal'
import { RecurrenceBadge } from '@/components/recurrence-badge'

interface ScheduledPostsTableProps {
  filters: {
    search: string
    platform: string
    status: string
    project: string
  }
}

export function ScheduledPostsTable({ filters }: ScheduledPostsTableProps) {
  const [selectedPost, setSelectedPost] = useState<typeof scheduledPosts[0] | null>(null)

  const filteredPosts = scheduledPosts.filter(post => {
    if (filters.search && !post.title.toLowerCase().includes(filters.search.toLowerCase())) {
      return false
    }
    if (filters.platform !== 'all' && !post.platforms.some(p => p.toLowerCase() === filters.platform)) {
      return false
    }
    if (filters.status !== 'all' && post.status !== filters.status) {
      return false
    }
    if (filters.project !== 'all') {
      const projectMap: Record<string, string> = {
        aurora: 'Residencial Aurora',
        miraflores: 'Condominio Miraflores',
        torres: 'Torres del Sol',
      }
      if (post.project !== projectMap[filters.project]) {
        return false
      }
    }
    return true
  })

  const getStatusBadge = (status: string) => {
    const styles = {
      scheduled: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      'pending-approval': 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
      published: 'bg-green-500/10 text-green-600 dark:text-green-400',
      failed: 'bg-red-500/10 text-red-600 dark:text-red-400',
      draft: 'bg-gray-500/10 text-gray-600 dark:text-gray-400',
    }
    return styles[status as keyof typeof styles] || styles.scheduled
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      scheduled: 'Programado',
      'pending-approval': 'Pendiente',
      published: 'Publicado',
      failed: 'Fallido',
      draft: 'Borrador',
    }
    return labels[status] || status
  }

  return (
    <>
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-6 py-3 text-left text-sm font-semibold text-muted-foreground">Título</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-muted-foreground">Red Social</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-muted-foreground">Tipo</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-muted-foreground">Publicar</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-muted-foreground">Repetición</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-muted-foreground">Estado</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-muted-foreground">Creador</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-muted-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredPosts.map(post => (
                <tr
                  key={post.id}
                  className="border-b border-border hover:bg-muted/30 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{post.thumbnail}</span>
                      <span className="font-medium text-foreground">{post.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1">
                      {post.platforms.map(p => (
                        <span key={p} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                          {p}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground capitalize">
                    {post.contentType}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {post.publishAt.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <RecurrenceBadge recurrence={post.recurrence} />
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${getStatusBadge(post.status)}`}>
                      {getStatusLabel(post.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {post.creator}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedPost(post)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye size={16} />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Edit2 size={16} />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Copy size={16} />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive">
                        <X size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPosts.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-muted-foreground">No se encontraron publicaciones que coincidan con tus filtros</p>
          </div>
        )}
      </div>

      {selectedPost && (
        <PostDetailModal post={selectedPost} onClose={() => setSelectedPost(null)} />
      )}
    </>
  )
}
