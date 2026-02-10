'use client'

import { useState } from 'react'
import { scheduledPosts } from '@/lib/mock-data'
import { Button } from '@/components/ui/button'
import { Eye, Edit2, Copy, X } from 'lucide-react'
import { PostDetailModal } from '@/components/modals/post-detail-modal'

export function UpcomingPostsTable() {
  const [selectedPost, setSelectedPost] = useState<typeof scheduledPosts[0] | null>(null)

  // Filter for upcoming posts (next 7 days)
  const upcoming = scheduledPosts
    .filter(p => {
      const daysUntil = Math.floor((p.publishAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      return daysUntil >= 0 && daysUntil <= 7
    })
    .sort((a, b) => a.publishAt.getTime() - b.publishAt.getTime())
    .slice(0, 5)

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

  return (
    <>
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold">Próximas Publicaciones</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-6 py-3 text-left text-sm font-semibold text-muted-foreground">Título</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-muted-foreground">Plataformas</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-muted-foreground">Fecha</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-muted-foreground">Estado</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-muted-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {upcoming.map((post) => (
                <tr key={post.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{post.thumbnail}</span>
                      <span className="font-medium text-foreground">{post.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {post.platforms.map(p => (
                        <span key={p} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-md">
                          {p}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {post.publishAt.toLocaleDateString()} {post.publishAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${getStatusBadge(post.status)}`}>
                      {post.status === 'pending-approval' ? 'Pendiente' : post.status === 'scheduled' ? 'Programado' : 'Publicado'}
                    </span>
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
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
        />
      )}
    </>
  )
}
