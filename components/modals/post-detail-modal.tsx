'use client'

import { CheckCircle, Clock, ListOrdered, Repeat2 } from 'lucide-react'

import { AppModal } from '@/components/base/app-modal'
import { StatusBadge } from '@/components/base/status-badge'
import { RecurrenceBadge } from '@/components/recurrence-badge'
import { Button } from '@/components/ui/button'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'

export interface PostDetail {
  id: string
  title: string
  subtitle?: string | null
  status: string
  thumbnail: string | null
  caption: string
  platforms: string[]
  contentType: string
  project: string
  mediaAssetId?: string | null
  publishError?: string | null
  mediaAssets?: Array<{
    id?: string
    fileName: string
    url?: string | null
    type?: string
  }>
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
  onPublishNow?: (postId: string) => Promise<void> | void
  publishLoading?: boolean
  error?: string | null
  success?: string | null
}

export function PostDetailModal({
  post,
  onClose,
  onPublishNow,
  publishLoading = false,
  error = null,
  success = null,
}: PostDetailModalProps) {
  const publishDate = new Date(post.publishAt)
  const shouldShowPublishError = Boolean((post.status || '').toLowerCase().includes('failed')) && Boolean(post.publishError)
  const previewCaptionParts: string[] = []
  const title = post.title?.trim()
  const subtitle = post.subtitle?.trim() ?? ''
  const caption = post.caption?.trim()

  if (title) previewCaptionParts.push(title)
  if (subtitle) previewCaptionParts.push(subtitle)
  if (caption) {
    if (previewCaptionParts.length > 0) previewCaptionParts.push('')
    previewCaptionParts.push(caption)
  }
  const previewCaption = previewCaptionParts.join('\n')

  const mediaAssets = post.mediaAssets ?? []
  const imageAssets = mediaAssets.filter((m) => Boolean(m.url)).slice(0, 10)

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
          <Button onClick={() => onPublishNow?.(post.id)} disabled={!onPublishNow || publishLoading}>
            {publishLoading ? 'Publicando...' : 'Publicar manualmente'}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {error ? <p className="text-sm text-destructive surface-muted p-3 rounded-lg">{error}</p> : null}
        {success ? <p className="text-sm text-primary surface-muted p-3 rounded-lg">{success}</p> : null}

        <div>
          <StatusBadge status={post.status} />

          {shouldShowPublishError ? (
            <div className="mt-4 surface-muted p-3 rounded-lg">
              <p className="text-sm font-semibold text-destructive mb-1">Error de publicacion</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{post.publishError}</p>
            </div>
          ) : null}
        </div>

        <div className="bg-muted rounded-lg overflow-hidden">
          <div className="bg-background">
            {imageAssets.length > 0 ? (
              <div className="w-full bg-muted">
                {imageAssets.length === 1 ? (
                  <div className="aspect-[4/3] w-full">
                    <img
                      src={imageAssets[0]?.url ?? ''}
                      alt={imageAssets[0]?.fileName ?? 'media'}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <Carousel opts={{ loop: true }}>
                    <CarouselContent>
                      {imageAssets.map((m) => (
                        <CarouselItem key={m.id ?? m.fileName}>
                          <div className="aspect-[4/3] w-full">
                            <img
                              src={m.url ?? ''}
                              alt={m.fileName ?? 'media'}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious />
                    <CarouselNext />
                  </Carousel>
                )}
              </div>
            ) : (
              <div className="p-6 text-center">
                <span className="text-lg mb-2 block">{post.thumbnail ?? 'Sin vista previa'}</span>
                <p className="text-sm text-muted-foreground">Vista previa</p>
              </div>
            )}
          </div>

          <div className="p-4">
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{previewCaption}</p>
          </div>
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
