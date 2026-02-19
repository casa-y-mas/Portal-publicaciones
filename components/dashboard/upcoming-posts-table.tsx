'use client'

import { useState } from 'react'
import { Eye, Edit2, Copy } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/base/status-badge'
import { PostDetailModal, type PostDetail } from '@/components/modals/post-detail-modal'
import type { DashboardUpcomingPost } from '@/lib/dashboard-data'

interface UpcomingPostsTableProps {
  posts: DashboardUpcomingPost[]
}

export function UpcomingPostsTable({ posts }: UpcomingPostsTableProps) {
  const [selectedPost, setSelectedPost] = useState<PostDetail | null>(null)

  const openPostDetail = (post: DashboardUpcomingPost) => {
    setSelectedPost({
      id: post.id,
      title: post.title,
      subtitle: null,
      status: post.status,
      thumbnail: post.thumbnail,
      caption: post.caption,
      platforms: post.platforms,
      contentType: post.contentType,
      project: post.project,
      publishAt: post.publishAt,
      creator: post.creator,
      approver: post.approver,
      recurrence: post.recurrence,
    })
  }

  return (
    <>
      <div className="surface-card overflow-hidden enter-up">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold">Proximas publicaciones</h3>
          <p className="text-xs text-muted-foreground mt-1">Planeacion inmediata para las siguientes ejecuciones</p>
        </div>

        {posts.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm text-muted-foreground">No hay publicaciones proximas en los estados configurados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-muted-foreground">Titulo</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-muted-foreground">Plataformas</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-muted-foreground">Prioridad IA</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-muted-foreground">Fecha</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-muted-foreground">Estado</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => {
                  const publishDate = new Date(post.publishAt)
                  return (
                    <tr key={post.id} className="border-b border-border/80 hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{post.thumbnail ?? 'Sin vista'}</span>
                          <span className="font-medium text-foreground">{post.title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2 flex-wrap">
                          {post.platforms.map((platform) => (
                            <span key={`${post.id}-${platform}`} className="text-xs bg-primary/12 text-primary px-2.5 py-1 rounded-full">
                              {platform}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold">{post.aiScore}/100</p>
                          <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                            post.aiPriority === 'Alta'
                              ? 'bg-green-500/15 text-green-700 dark:text-green-300'
                              : post.aiPriority === 'Media'
                                ? 'bg-orange-500/15 text-orange-700 dark:text-orange-300'
                                : 'bg-neutral-500/15 text-neutral-700 dark:text-neutral-300'
                          }`}>
                            {post.aiPriority}
                          </span>
                          <p className="text-[11px] text-muted-foreground">Ventana: {post.suggestedWindow}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {publishDate.toLocaleDateString()}{' '}
                        {publishDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={post.status} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openPostDetail(post)} className="h-8 w-8 p-0">
                            <Eye size={16} />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled>
                            <Edit2 size={16} />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled>
                            <Copy size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedPost && <PostDetailModal post={selectedPost} onClose={() => setSelectedPost(null)} />}
    </>
  )
}
