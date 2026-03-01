'use client'

import { useMemo, useState } from 'react'
import { CheckCircle, Clock, MessageSquareWarning, XCircle } from 'lucide-react'

import { StatusBadge } from '@/components/base/status-badge'
import { Button } from '@/components/ui/button'

interface ApprovalQueueItem {
  id: string
  title: string
  caption: string
  subtitle: string | null
  creator: string
  project: string
  platforms: string[]
  proposedDate: string
  submittedAt: string
  status: 'pending' | 'resolved'
}

interface ApprovalHistoryItem {
  id: string
  title: string
  project: string
  reviewedAt: string
  reviewer: string
  finalStatus: string
}

interface ApprovalsBoardProps {
  initialPending: ApprovalQueueItem[]
  recent: ApprovalHistoryItem[]
}

export function ApprovalsBoard({ initialPending, recent }: ApprovalsBoardProps) {
  const [pendingApprovals, setPendingApprovals] = useState(initialPending)
  const [rejectionReason, setRejectionReason] = useState<string | null>(null)
  const [rejectionPostId, setRejectionPostId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const pendingCount = pendingApprovals.length

  const sortedRecent = useMemo(
    () => [...recent].sort((a, b) => new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime()),
    [recent],
  )

  const resolveApproval = async (id: string, nextStatus: 'scheduled' | 'draft') => {
    setBusyId(id)
    setError(null)
    setSuccess(null)
    try {
      const response = await fetch(`/api/scheduled-posts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      })

      if (!response.ok) {
        const json = await response.json().catch(() => null)
        throw new Error(json?.message ?? 'No se pudo actualizar la aprobacion.')
      }

      setPendingApprovals((prev) => prev.filter((approval) => approval.id !== id))
      setSuccess(nextStatus === 'scheduled' ? 'Publicacion aprobada y programada.' : 'Publicacion devuelta a borrador.')
      setRejectionPostId(null)
      setRejectionReason(null)
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Error actualizando aprobacion.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6">
      {error ? (
        <div className="surface-muted p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      ) : null}
      {success ? (
        <div className="surface-muted p-3 border-primary/30">
          <p className="text-sm text-primary">{success}</p>
        </div>
      ) : null}

      <div>
        <h2 className="text-xl font-semibold mb-4">Pendientes de revision ({pendingCount})</h2>
        <div className="space-y-4">
          {pendingApprovals.map((item) => (
            <div key={item.id} className="surface-card p-6">
              <div className="flex items-start justify-between mb-4 gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-lg font-semibold">{item.title}</h3>
                    <StatusBadge status="pending_approval" />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Creado por {item.creator} en {item.project} · {new Date(item.submittedAt).toLocaleString()}
                  </p>
                </div>
                <Clock size={20} className="text-muted-foreground shrink-0" />
              </div>

              <div className="surface-muted p-4 mb-4 space-y-2">
                {item.subtitle ? (
                  <p className="text-sm font-semibold text-foreground/80">{item.subtitle}</p>
                ) : null}
                <p className="text-sm text-muted-foreground">Texto</p>
                <p className="text-foreground">{item.caption}</p>
              </div>

              <div className="grid sm:grid-cols-3 gap-4 mb-6">
                <div>
                  <p className="text-xs text-muted-foreground">Plataformas</p>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {item.platforms.map((platform) => (
                      <span key={platform} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        {platform}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Programado para</p>
                  <p className="text-sm font-semibold mt-1">{new Date(item.proposedDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Hora</p>
                  <p className="text-sm font-semibold mt-1">
                    {new Date(item.proposedDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              {rejectionPostId === item.id ? (
                <div className="surface-muted p-4 mb-4 space-y-3">
                  <label className="text-sm font-semibold text-foreground block">Motivo de devolucion</label>
                  <textarea
                    className="w-full bg-background border border-border rounded-lg p-3 text-foreground placeholder-muted-foreground resize-none"
                    rows={3}
                    placeholder="Explica que debe corregirse antes de programar."
                    value={rejectionReason || ''}
                    onChange={(event) => setRejectionReason(event.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    El motivo se usa como guia operativa. Esta fase aun no guarda comentarios estructurados en DB.
                  </p>
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setRejectionPostId(null)
                        setRejectionReason(null)
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => resolveApproval(item.id, 'draft')}
                      disabled={!rejectionReason?.trim() || busyId === item.id}
                    >
                      Confirmar devolucion
                    </Button>
                  </div>
                </div>
              ) : null}

              <div className="flex gap-3">
                <Button className="flex-1" onClick={() => resolveApproval(item.id, 'scheduled')} disabled={busyId === item.id}>
                  <CheckCircle size={16} className="mr-2" />
                  Aprobar y programar
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={() => setRejectionPostId(item.id)}
                  disabled={busyId === item.id}
                >
                  <MessageSquareWarning size={16} className="mr-2" />
                  Devolver a borrador
                </Button>
              </div>
            </div>
          ))}

          {pendingApprovals.length === 0 ? (
            <div className="surface-card p-12 text-center">
              <CheckCircle size={32} className="mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">No hay aprobaciones pendientes</p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="border-t border-border pt-6">
        <h2 className="text-xl font-semibold mb-4">Historial reciente</h2>
        <div className="space-y-2">
          {sortedRecent.map((item) => (
            <div key={item.id} className="surface-card p-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold">{item.title}</p>
                <p className="text-sm text-muted-foreground">
                  {item.project} · Revisado por {item.reviewer} · {new Date(item.reviewedAt).toLocaleString()}
                </p>
              </div>
              <StatusBadge status={item.finalStatus} />
            </div>
          ))}

          {sortedRecent.length === 0 ? (
            <div className="surface-card p-8 text-center">
              <XCircle size={28} className="mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">Aun no hay aprobaciones resueltas.</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
