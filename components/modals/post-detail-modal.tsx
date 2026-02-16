'use client'

import { CheckCircle, Clock, ListOrdered, Repeat2 } from 'lucide-react'

import { AppModal } from '@/components/base/app-modal'
import { StatusBadge } from '@/components/base/status-badge'
import { RecurrenceBadge } from '@/components/recurrence-badge'
import { Button } from '@/components/ui/button'

export interface PostDetail {
  id: string
  title: string
  status: string
  thumbnail: string | null
  caption: string
  platforms: string[]
  contentType: string
  project: string
  publishAt: string
  creator: string
  approver: string | null
  sequenceGroupId?: string
  sequenceOrder?: number
  recurrence?: {
    enabled: boolean
    type?: 'hourly' | 'daily' | 'weekday' | 'weekend' | 'weekly' | 'custom' | null
    endType?: 'never' | 'date'
    endDate?: string
    customFrequency?: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly'
    customInterval?: number
  }
}

interface PostDetailModalProps {
  post: PostDetail
  onClose: () => void
}

export function PostDetailModal({ post, onClose }: PostDetailModalProps) {
  const publishDate = new Date(post.publishAt)

  return (
    <AppModal
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      title="Detalle de publicacion"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button>Publicar manualmente</Button>
        </>
      }
    >
      <div className="space-y-6">
        <div>
          <h3 className="text-2xl font-bold mb-3">{post.title}</h3>
          <StatusBadge status={post.status} />
        </div>

        <div className="bg-muted rounded-lg p-6 text-center">
          <span className="text-2xl mb-2 block">{post.thumbnail ?? 'Sin vista previa'}</span>
          <p className="text-sm text-muted-foreground">Vista previa</p>
        </div>

        <div>
          <label className="text-sm font-semibold text-foreground mb-2 block">Texto</label>
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
            <p className="text-muted-foreground">{publishDate.toLocaleString()}</p>
          </div>

          <div>
            <label className="text-sm font-semibold text-foreground mb-2 block">Creador</label>
            <p className="text-muted-foreground">{post.creator}</p>
          </div>

          {post.approver ? (
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">Aprobador</label>
              <p className="text-muted-foreground">{post.approver}</p>
            </div>
          ) : null}

          {post.sequenceGroupId ? (
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">Secuencia</label>
              <p className="text-muted-foreground">Grupo {post.sequenceGroupId} - orden #{post.sequenceOrder || 1}</p>
            </div>
          ) : null}

          {post.recurrence?.enabled ? (
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">Repeticion</label>
              <div className="space-y-2">
                <RecurrenceBadge recurrence={post.recurrence} />
                {post.recurrence.endType === 'date' ? (
                  <p className="text-xs text-muted-foreground">Finaliza: {post.recurrence.endDate}</p>
                ) : null}
              </div>
            </div>
          ) : null}
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

            {post.approver ? (
              <div className="flex gap-3">
                <CheckCircle size={16} className="text-green-500 mt-1" />
                <div>
                  <p className="text-sm font-semibold">Aprobado</p>
                  <p className="text-xs text-muted-foreground">Por {post.approver}</p>
                </div>
              </div>
            ) : null}

            <div className="flex gap-3">
              <Clock size={16} className="text-blue-500 mt-1" />
              <div>
                <p className="text-sm font-semibold">Programado</p>
                <p className="text-xs text-muted-foreground">{publishDate.toLocaleString()}</p>
              </div>
            </div>

            {post.sequenceGroupId ? (
              <div className="flex gap-3">
                <ListOrdered size={16} className="text-purple-500 mt-1" />
                <div>
                  <p className="text-sm font-semibold">En secuencia</p>
                  <p className="text-xs text-muted-foreground">Grupo {post.sequenceGroupId} con orden #{post.sequenceOrder || 1}</p>
                </div>
              </div>
            ) : null}

            {post.recurrence?.enabled ? (
              <div className="flex gap-3">
                <Repeat2 size={16} className="text-indigo-500 mt-1" />
                <div>
                  <p className="text-sm font-semibold">Repeticion activa</p>
                  <p className="text-xs text-muted-foreground">Se ejecuta segun regla configurada</p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </AppModal>
  )
}
