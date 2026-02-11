'use client'

import { useState } from 'react'
import { scheduledPosts } from '@/lib/mock-data'
import { Button } from '@/components/ui/button'
import { Eye, Edit2, Copy, X, Rocket, RefreshCcw } from 'lucide-react'
import { PostDetailModal } from '@/components/modals/post-detail-modal'
import { RecurrenceBadge } from '@/components/recurrence-badge'

interface ScheduledPostsTableProps {
  filters: {
    search: string
    platform: string
    status: string
    project: string
    user: string
  }
}

const statusStyle: Record<string, string> = {
  draft: 'bg-gray-500/10 text-gray-600 dark:text-gray-300',
  'pending-approval': 'bg-orange-500/10 text-orange-600 dark:text-orange-300',
  approved: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-300',
  scheduled: 'bg-blue-500/10 text-blue-600 dark:text-blue-300',
  publishing: 'bg-violet-500/10 text-violet-600 dark:text-violet-300',
  published: 'bg-green-500/10 text-green-600 dark:text-green-300',
  failed: 'bg-red-500/10 text-red-600 dark:text-red-300',
  cancelled: 'bg-neutral-500/10 text-neutral-600 dark:text-neutral-300',
}

const statusLabel: Record<string, string> = {
  draft: 'Borrador',
  'pending-approval': 'Pendiente',
  approved: 'Aprobado',
  scheduled: 'Programado',
  publishing: 'Publicando',
  published: 'Publicado',
  failed: 'Fallido',
  cancelled: 'Cancelado',
}

export function ScheduledPostsTable({ filters }: ScheduledPostsTableProps) {
  const [selectedPost, setSelectedPost] = useState<(typeof scheduledPosts)[number] | null>(null)

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
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">Titulo</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">Red</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">Proyecto</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">Publicar</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">Secuencia</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">Repeticion</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">Estado</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredPosts.map((post) => (
                <tr key={post.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-4 text-sm font-medium">{post.title}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-1">
                      {post.platforms.map((platform) => (
                        <span key={platform} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                          {platform}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm">{post.project}</td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">{post.publishAt.toLocaleString()}</td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">
                    {post.sequenceGroupId ? `Grupo ${post.sequenceGroupId} / #${post.sequenceOrder || 1}` : 'No'}
                  </td>
                  <td className="px-4 py-4">
                    <RecurrenceBadge recurrence={post.recurrence} />
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusStyle[post.status] || statusStyle.scheduled}`}>
                      {statusLabel[post.status] || post.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPosts.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-muted-foreground">No hay publicaciones para estos filtros.</p>
          </div>
        )}
      </div>

      {selectedPost && <PostDetailModal post={selectedPost} onClose={() => setSelectedPost(null)} />}
    </>
  )
}
