'use client'

import { X, Clock, CheckCircle, Repeat2, ListOrdered } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { scheduledPosts } from '@/lib/mock-data'
import { RecurrenceBadge } from '@/components/recurrence-badge'

type Post = (typeof scheduledPosts)[number]

interface PostDetailModalProps {
  post: Post
  onClose: () => void
}

const statusColor: Record<string, string> = {
  draft: 'text-gray-600 dark:text-gray-300 bg-gray-500/10',
  'pending-approval': 'text-orange-600 dark:text-orange-300 bg-orange-500/10',
  approved: 'text-cyan-600 dark:text-cyan-300 bg-cyan-500/10',
  scheduled: 'text-blue-600 dark:text-blue-300 bg-blue-500/10',
  publishing: 'text-violet-600 dark:text-violet-300 bg-violet-500/10',
  published: 'text-green-600 dark:text-green-300 bg-green-500/10',
  failed: 'text-red-600 dark:text-red-300 bg-red-500/10',
  cancelled: 'text-neutral-600 dark:text-neutral-300 bg-neutral-500/10',
}

const statusLabel: Record<string, string> = {
  draft: 'Borrador',
  'pending-approval': 'Pendiente de aprobacion',
  approved: 'Aprobado',
  scheduled: 'Programado',
  publishing: 'Publicando',
  published: 'Publicado',
  failed: 'Fallido',
  cancelled: 'Cancelado',
}

export function PostDetailModal({ post, onClose }: PostDetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border flex items-center justify-between p-6">
          <h2 className="text-xl font-bold">Detalle de publicacion</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-2xl font-bold mb-3">{post.title}</h3>
            <span className={`text-sm font-semibold px-3 py-1 rounded-full ${statusColor[post.status] || statusColor.scheduled}`}>
              {statusLabel[post.status] || post.status}
            </span>
          </div>

          <div className="bg-muted rounded-lg p-6 text-center">
            <span className="text-2xl mb-2 block">{post.thumbnail}</span>
            <p className="text-sm text-muted-foreground">Vista previa</p>
          </div>

          <div>
            <label className="text-sm font-semibold text-foreground mb-2 block">Caption</label>
            <p className="text-muted-foreground bg-muted p-4 rounded-lg">{post.caption}</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">Plataformas</label>
              <div className="flex gap-2 flex-wrap">
                {post.platforms.map((platform) => (
                  <span key={platform} className="text-sm bg-primary/10 text-primary px-3 py-1 rounded-md">
                    {platform}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">Tipo</label>
              <p className="text-muted-foreground capitalize">{post.contentType}</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">Proyecto</label>
              <p className="text-muted-foreground">{post.project}</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">Fecha y hora</label>
              <p className="text-muted-foreground">{post.publishAt.toLocaleString()}</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">Creador</label>
              <p className="text-muted-foreground">{post.creator}</p>
            </div>

            {post.approver && (
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">Aprobador</label>
                <p className="text-muted-foreground">{post.approver}</p>
              </div>
            )}

            {post.sequenceGroupId && (
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">Secuencia</label>
                <p className="text-muted-foreground">Grupo {post.sequenceGroupId} - orden #{post.sequenceOrder || 1}</p>
              </div>
            )}

            {post.recurrence?.enabled && (
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">Repeticion</label>
                <div className="space-y-2">
                  <RecurrenceBadge recurrence={post.recurrence} />
                  {post.recurrence.endType === 'date' && (
                    <p className="text-xs text-muted-foreground">Finaliza: {post.recurrence.endDate}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-border pt-6">
            <h4 className="text-sm font-semibold text-foreground mb-4">Linea de tiempo</h4>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                <div>
                  <p className="text-sm font-semibold">Creado</p>
                  <p className="text-xs text-muted-foreground">Por {post.creator}</p>
                </div>
              </div>
              {post.approver && (
                <div className="flex gap-3">
                  <CheckCircle size={16} className="text-green-500 mt-1" />
                  <div>
                    <p className="text-sm font-semibold">Aprobado</p>
                    <p className="text-xs text-muted-foreground">Por {post.approver}</p>
                  </div>
                </div>
              )}
              <div className="flex gap-3">
                <Clock size={16} className="text-blue-500 mt-1" />
                <div>
                  <p className="text-sm font-semibold">Programado</p>
                  <p className="text-xs text-muted-foreground">{post.publishAt.toLocaleString()}</p>
                </div>
              </div>
              {post.sequenceGroupId && (
                <div className="flex gap-3">
                  <ListOrdered size={16} className="text-purple-500 mt-1" />
                  <div>
                    <p className="text-sm font-semibold">En secuencia</p>
                    <p className="text-xs text-muted-foreground">Grupo {post.sequenceGroupId} con orden #{post.sequenceOrder || 1}</p>
                  </div>
                </div>
              )}
              {post.recurrence?.enabled && (
                <div className="flex gap-3">
                  <Repeat2 size={16} className="text-indigo-500 mt-1" />
                  <div>
                    <p className="text-sm font-semibold">Repeticion activa</p>
                    <p className="text-xs text-muted-foreground">Se ejecuta segun regla configurada</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-border p-6 bg-muted/30 flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
          <Button>Publicar manualmente</Button>
        </div>
      </div>
    </div>
  )
}
