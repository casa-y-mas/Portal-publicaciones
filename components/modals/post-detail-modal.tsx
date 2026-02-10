'use client'

import { X, Clock, User, CheckCircle, Repeat2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { scheduledPosts } from '@/lib/mock-data'
import { RecurrenceBadge } from '@/components/recurrence-badge'

type Post = typeof scheduledPosts[0]

interface PostDetailModalProps {
  post: Post
  onClose: () => void
}

export function PostDetailModal({ post, onClose }: PostDetailModalProps) {
  const getStatusColor = (status: string) => {
    const colors = {
      scheduled: 'text-blue-600 dark:text-blue-400 bg-blue-500/10',
      'pending-approval': 'text-orange-600 dark:text-orange-400 bg-orange-500/10',
      published: 'text-green-600 dark:text-green-400 bg-green-500/10',
      failed: 'text-red-600 dark:text-red-400 bg-red-500/10',
      draft: 'text-gray-600 dark:text-gray-400 bg-gray-500/10',
    }
    return colors[status as keyof typeof colors] || colors.scheduled
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      scheduled: 'Programado',
      'pending-approval': 'Pendiente de Aprobación',
      published: 'Publicado',
      failed: 'Fallido',
      draft: 'Borrador',
    }
    return labels[status] || status
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border flex items-center justify-between p-6">
          <h2 className="text-xl font-bold">Detalles de la Publicación</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Title and Status */}
          <div>
            <h3 className="text-2xl font-bold mb-3">{post.title}</h3>
            <span className={`text-sm font-semibold px-3 py-1 rounded-full ${getStatusColor(post.status)}`}>
              {getStatusLabel(post.status)}
            </span>
          </div>

          {/* Preview */}
          <div className="bg-muted rounded-lg p-6 text-center">
            <span className="text-6xl mb-4 block">{post.thumbnail}</span>
            <p className="text-sm text-muted-foreground">Vista Previa de Medios</p>
          </div>

          {/* Caption */}
          <div>
            <label className="text-sm font-semibold text-foreground mb-2 block">Descripción</label>
            <p className="text-muted-foreground bg-muted p-4 rounded-lg">{post.caption}</p>
          </div>

          {/* Metadata Grid */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">Plataformas</label>
              <div className="flex gap-2">
                {post.platforms.map(p => (
                  <span key={p} className="text-sm bg-primary/10 text-primary px-3 py-1 rounded-md">
                    {p}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">Tipo de Contenido</label>
              <p className="text-muted-foreground capitalize">{post.contentType}</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">Proyecto</label>
              <p className="text-muted-foreground">{post.project}</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">Fecha de Publicación</label>
              <p className="text-muted-foreground">
                {post.publishAt.toLocaleDateString()} {post.publishAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">Creado Por</label>
              <p className="text-muted-foreground">{post.creator}</p>
            </div>

            {post.approver && (
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">Aprobado Por</label>
                <p className="text-muted-foreground">{post.approver}</p>
              </div>
            )}

            {post.recurrence?.enabled && (
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">Repetición</label>
                <div className="space-y-2">
                  <RecurrenceBadge recurrence={post.recurrence} />
                  {post.recurrence.endType === 'date' && (
                    <p className="text-xs text-muted-foreground">
                      Finaliza: {post.recurrence.endDate}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="border-t border-border pt-6">
            <h4 className="text-sm font-semibold text-foreground mb-4">Línea de Tiempo</h4>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold">Creado</p>
                  <p className="text-xs text-muted-foreground">Por {post.creator}</p>
                </div>
              </div>
              {post.approver && (
                <div className="flex gap-3">
                  <CheckCircle size={16} className="text-green-600 dark:text-green-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold">Aprobado</p>
                    <p className="text-xs text-muted-foreground">Por {post.approver}</p>
                  </div>
                </div>
              )}
              <div className="flex gap-3">
                <Clock size={16} className="text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold">Programado para Publicar</p>
                  <p className="text-xs text-muted-foreground">
                    {post.publishAt.toLocaleDateString()} at {post.publishAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              {post.recurrence?.enabled && (
                <div className="flex gap-3">
                  <Repeat2 size={16} className="text-purple-600 dark:text-purple-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold">Repetición Habilitada</p>
                    <p className="text-xs text-muted-foreground">
                      {post.recurrence.type === 'hourly' && 'Se publica cada hora'}
                      {post.recurrence.type === 'daily' && 'Se publica cada día'}
                      {post.recurrence.type === 'weekday' && 'Se publica de lunes a viernes'}
                      {post.recurrence.type === 'weekend' && 'Se publica sábados y domingos'}
                      {post.recurrence.type === 'weekly' && 'Se publica cada semana'}
                      {post.recurrence.type === 'custom' && `Se publica cada ${post.recurrence.customInterval} ${post.recurrence.customFrequency}s`}
                      {post.recurrence.endType === 'date' && ` hasta ${post.recurrence.endDate}`}
                      {post.recurrence.endType === 'never' && ' indefinidamente'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-border p-6 bg-muted/30 flex gap-3 justify-end">
          {post.status === 'pending-approval' ? (
            <>
              <Button variant="outline" onClick={onClose}>
                Rechazar
              </Button>
              <Button onClick={onClose}>
                Aprobar y Programar
              </Button>
            </>
          ) : post.status === 'scheduled' ? (
            <>
              <Button variant="outline" onClick={onClose}>
                Reprogramar
              </Button>
              <Button variant="destructive">
                Cancelar
              </Button>
            </>
          ) : (
            <Button onClick={onClose}>Cerrar</Button>
          )}
        </div>
      </div>
    </div>
  )
}
