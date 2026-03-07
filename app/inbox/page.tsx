'use client'

import { useEffect, useMemo, useState } from 'react'

import { Breadcrumbs } from '@/components/breadcrumbs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type InboxPlatform = 'facebook' | 'instagram'
type InboxPriority = 'alta' | 'media' | 'baja'
type InboxStatus = 'nuevo' | 'pendiente' | 'resuelto'

interface SocialInboxItem {
  id: string
  platform: InboxPlatform
  accountId: string
  accountLabel: string
  author: string
  message: string
  createdAt: string
  postId: string
  postPreview: string
  priority: InboxPriority
  status: InboxStatus
  assignedTo: { id: string; name: string } | null
  slaDueAt: string | null
  slaState: 'ok' | 'risk' | 'breached'
  notes: Array<{
    id: string
    body: string
    createdAt: string
    author: { id: string; name: string }
  }>
  suggestedReplies: string[]
}

interface SocialInboxSummary {
  mode: 'live' | 'mock'
  scannedAccounts: number
  fetchedItems: number
  warnings: string[]
  items: SocialInboxItem[]
  assignees: Array<{ id: string; name: string; role: string }>
}

const statusOptions: InboxStatus[] = ['nuevo', 'pendiente', 'resuelto']

function mapStatusToApi(status: InboxStatus) {
  if (status === 'nuevo') return 'new'
  if (status === 'pendiente') return 'pending'
  return 'resolved'
}

export default function InboxPage() {
  const [summary, setSummary] = useState<SocialInboxSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [platformFilter, setPlatformFilter] = useState<'all' | InboxPlatform>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | InboxStatus>('all')
  const [slaFilter, setSlaFilter] = useState<'all' | 'risk' | 'breached'>('all')
  const [statusByItem, setStatusByItem] = useState<Record<string, InboxStatus>>({})
  const [assignedByItem, setAssignedByItem] = useState<Record<string, string | null>>({})
  const [savingId, setSavingId] = useState<string | null>(null)
  const [noteDraft, setNoteDraft] = useState('')

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/inbox/meta?limit=120')
      if (!response.ok) {
        const json = await response.json().catch(() => null)
        throw new Error(json?.message ?? 'No se pudo cargar el inbox social.')
      }

      const json = await response.json()
      const nextSummary: SocialInboxSummary | null = json?.summary ?? null
      setSummary(nextSummary)

      if (nextSummary?.items?.length) {
        setSelectedId((prev) => (prev && nextSummary.items.some((item) => item.id === prev) ? prev : nextSummary.items[0].id))
      } else {
        setSelectedId(null)
      }

      setStatusByItem((prev) => {
        const next = { ...prev }
        for (const item of nextSummary?.items ?? []) {
          next[item.id] = item.status
        }
        return next
      })

      setAssignedByItem((prev) => {
        const next = { ...prev }
        for (const item of nextSummary?.items ?? []) {
          next[item.id] = item.assignedTo?.id ?? null
        }
        return next
      })
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar el inbox social.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  useEffect(() => {
    setNoteDraft('')
  }, [selectedId])

  const filteredItems = useMemo(() => {
    const source = summary?.items ?? []
    const query = search.trim().toLowerCase()

    return source.filter((item) => {
      if (platformFilter !== 'all' && item.platform !== platformFilter) return false

      const currentStatus = statusByItem[item.id] ?? item.status
      if (statusFilter !== 'all' && currentStatus !== statusFilter) return false
      if (slaFilter !== 'all' && item.slaState !== slaFilter) return false

      if (query) {
        const haystack = `${item.author} ${item.message} ${item.accountLabel} ${item.postPreview}`.toLowerCase()
        if (!haystack.includes(query)) return false
      }

      return true
    })
  }, [platformFilter, search, slaFilter, statusByItem, statusFilter, summary?.items])

  const selectedItem = useMemo(
    () => filteredItems.find((item) => item.id === selectedId) ?? filteredItems[0] ?? null,
    [filteredItems, selectedId],
  )

  const statusStats = useMemo(() => {
    const counts: Record<InboxStatus, number> = { nuevo: 0, pendiente: 0, resuelto: 0 }
    for (const item of summary?.items ?? []) {
      const status = statusByItem[item.id] ?? item.status
      counts[status] += 1
    }
    return counts
  }, [statusByItem, summary?.items])

  async function persistThread(itemId: string, next: { status?: InboxStatus; assignedToId?: string | null }) {
    setSavingId(itemId)
    setError(null)

    try {
      const response = await fetch('/api/inbox/meta', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId: itemId,
          status: next.status ? mapStatusToApi(next.status) : undefined,
          assignedToId: next.assignedToId,
        }),
      })

      if (!response.ok) {
        const json = await response.json().catch(() => null)
        throw new Error(json?.message ?? 'No se pudo actualizar la conversacion.')
      }

      await loadData()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo actualizar la conversacion.')
    } finally {
      setSavingId(null)
    }
  }

  async function saveNote() {
    if (!selectedItem || noteDraft.trim().length < 2) return

    setSavingId(selectedItem.id)
    setError(null)

    try {
      const response = await fetch('/api/inbox/meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId: selectedItem.id,
          body: noteDraft.trim(),
        }),
      })

      if (!response.ok) {
        const json = await response.json().catch(() => null)
        throw new Error(json?.message ?? 'No se pudo guardar la nota.')
      }

      setNoteDraft('')
      await loadData()
    } catch (noteError) {
      setError(noteError instanceof Error ? noteError.message : 'No se pudo guardar la nota.')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div>
      <Breadcrumbs />

      <div className="mb-6 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Inbox social</h1>
          <p className="text-muted-foreground">Comentarios recientes de Facebook e Instagram para gestion comercial rapida.</p>
          {summary ? (
            <p className="text-xs text-muted-foreground mt-1">
              Cuentas analizadas: {summary.scannedAccounts} · Conversaciones: {summary.fetchedItems}
            </p>
          ) : null}
        </div>
        <Button variant="outline" onClick={() => void loadData()} disabled={loading}>
          {loading ? 'Actualizando...' : 'Actualizar'}
        </Button>
      </div>

      {summary ? (
        <div className="grid sm:grid-cols-4 gap-3 mb-4">
          <div className="surface-card p-4">
            <p className="text-xs text-muted-foreground">Modo</p>
            <p className="text-lg font-semibold uppercase">{summary.mode}</p>
          </div>
          <div className="surface-card p-4">
            <p className="text-xs text-muted-foreground">Nuevos</p>
            <p className="text-lg font-semibold">{statusStats.nuevo}</p>
          </div>
          <div className="surface-card p-4">
            <p className="text-xs text-muted-foreground">Pendientes</p>
            <p className="text-lg font-semibold">{statusStats.pendiente}</p>
          </div>
          <div className="surface-card p-4">
            <p className="text-xs text-muted-foreground">Resueltos</p>
            <p className="text-lg font-semibold">{statusStats.resuelto}</p>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="surface-muted p-3 mb-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      ) : null}

      {summary?.warnings?.length ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 mb-4">
          {summary.warnings.slice(0, 4).map((warning) => (
            <p key={warning} className="text-xs text-amber-700 dark:text-amber-300">{warning}</p>
          ))}
        </div>
      ) : null}

      <div className="grid xl:grid-cols-[360px_minmax(0,1fr)] gap-4">
        <div className="surface-card p-4 space-y-3">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar comentario, autor o cuenta..."
          />

          <div className="grid grid-cols-2 gap-2">
            <select
              className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm"
              value={platformFilter}
              onChange={(event) => setPlatformFilter(event.target.value as 'all' | InboxPlatform)}
            >
              <option value="all">Todas las redes</option>
              <option value="facebook">Facebook</option>
              <option value="instagram">Instagram</option>
            </select>

            <select
              className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as 'all' | InboxStatus)}
            >
              <option value="all">Todos los estados</option>
              <option value="nuevo">Nuevo</option>
              <option value="pendiente">Pendiente</option>
              <option value="resuelto">Resuelto</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <select
              className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm"
              value={slaFilter}
              onChange={(event) => setSlaFilter(event.target.value as 'all' | 'risk' | 'breached')}
            >
              <option value="all">Todo SLA</option>
              <option value="risk">En riesgo</option>
              <option value="breached">Vencido</option>
            </select>

            <div className="rounded-lg border border-border bg-muted px-3 py-2 text-xs text-muted-foreground flex items-center">
              {filteredItems.length} conversaciones
            </div>
          </div>

          <div className="max-h-[62vh] overflow-y-auto space-y-2 pr-1">
            {filteredItems.map((item) => {
              const status = statusByItem[item.id] ?? item.status
              const isActive = selectedItem?.id === item.id

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`w-full rounded-lg border p-3 text-left transition-colors ${
                    isActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs uppercase tracking-[0.08em] text-muted-foreground">{item.platform}</span>
                    <span className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-sm font-semibold">{item.author}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.message}</p>
                  <p className="text-xs mt-2">
                    Estado: <span className="font-semibold capitalize">{status}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    SLA: <span className="font-semibold uppercase">{item.slaState}</span>
                  </p>
                </button>
              )
            })}

            {!loading && filteredItems.length === 0 ? (
              <div className="rounded-lg border border-border p-6 text-center text-sm text-muted-foreground">
                No hay conversaciones para este filtro.
              </div>
            ) : null}
          </div>
        </div>

        <div className="surface-card p-5">
          {selectedItem ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">{selectedItem.platform}</p>
                  <h3 className="text-lg font-semibold">{selectedItem.author}</h3>
                  <p className="text-xs text-muted-foreground">{selectedItem.accountLabel}</p>
                </div>

                <select
                  className="rounded-lg border border-border bg-muted px-3 py-2 text-sm capitalize"
                  value={statusByItem[selectedItem.id] ?? selectedItem.status}
                  onChange={(event) => {
                    const nextStatus = event.target.value as InboxStatus
                    setStatusByItem((prev) => ({ ...prev, [selectedItem.id]: nextStatus }))
                    void persistThread(selectedItem.id, {
                      status: nextStatus,
                      assignedToId: assignedByItem[selectedItem.id] ?? selectedItem.assignedTo?.id ?? null,
                    })
                  }}
                  disabled={savingId === selectedItem.id}
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status} className="capitalize">
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-lg border border-border p-4">
                <p className="text-sm">{selectedItem.message}</p>
              </div>

              <div className="rounded-lg border border-border p-4 space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Asignado a</p>
                  <select
                    className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm"
                    value={assignedByItem[selectedItem.id] ?? selectedItem.assignedTo?.id ?? ''}
                    onChange={(event) => {
                      const nextAssigned = event.target.value || null
                      setAssignedByItem((prev) => ({ ...prev, [selectedItem.id]: nextAssigned }))
                      void persistThread(selectedItem.id, {
                        status: statusByItem[selectedItem.id] ?? selectedItem.status,
                        assignedToId: nextAssigned,
                      })
                    }}
                    disabled={savingId === selectedItem.id}
                  >
                    <option value="">Sin asignar</option>
                    {(summary?.assignees ?? []).map((assignee) => (
                      <option key={assignee.id} value={assignee.id}>
                        {assignee.name} · {assignee.role}
                      </option>
                    ))}
                  </select>
                </div>

                <p>
                  <span className="text-muted-foreground">Prioridad:</span>{' '}
                  <span className="font-semibold capitalize">{selectedItem.priority}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">SLA:</span>{' '}
                  <span
                    className={`font-semibold uppercase ${
                      selectedItem.slaState === 'breached'
                        ? 'text-destructive'
                        : selectedItem.slaState === 'risk'
                          ? 'text-amber-500'
                          : ''
                    }`}
                  >
                    {selectedItem.slaState}
                  </span>
                  {selectedItem.slaDueAt ? ` · ${new Date(selectedItem.slaDueAt).toLocaleString()}` : ''}
                </p>
                <p>
                  <span className="text-muted-foreground">Publicacion:</span>{' '}
                  <span className="font-semibold">{selectedItem.postPreview}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Fecha:</span>{' '}
                  <span className="font-semibold">{new Date(selectedItem.createdAt).toLocaleString()}</span>
                </p>
              </div>

              <div className="rounded-lg border border-border p-4 space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="text-sm font-semibold">Respuestas sugeridas</h4>
                    <span className="text-xs text-muted-foreground">{selectedItem.suggestedReplies.length}</span>
                  </div>
                  <div className="grid gap-2">
                    {selectedItem.suggestedReplies.map((reply) => (
                      <button
                        key={reply}
                        type="button"
                        className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-left text-sm transition-colors hover:border-primary/40"
                        onClick={() => setNoteDraft(reply)}
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-border pt-3">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="text-sm font-semibold">Notas internas</h4>
                    <span className="text-xs text-muted-foreground">{selectedItem.notes.length}</span>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1 mt-3">
                    {selectedItem.notes.map((note) => (
                      <div key={note.id} className="rounded-lg bg-muted/60 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold">{note.author.name}</p>
                          <p className="text-[11px] text-muted-foreground">{new Date(note.createdAt).toLocaleString()}</p>
                        </div>
                        <p className="text-sm mt-2">{note.body}</p>
                      </div>
                    ))}

                    {selectedItem.notes.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-border p-4 text-xs text-muted-foreground">
                        Aun no hay notas internas para esta conversacion.
                      </div>
                    ) : null}
                  </div>

                  <div className="space-y-2 mt-3">
                    <textarea
                      className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm min-h-24"
                      placeholder="Agregar contexto interno, siguiente accion o resultado de llamada..."
                      value={noteDraft}
                      onChange={(event) => setNoteDraft(event.target.value)}
                      disabled={savingId === selectedItem.id}
                    />
                    <div className="flex justify-end">
                      <Button size="sm" disabled={savingId === selectedItem.id || noteDraft.trim().length < 2} onClick={() => void saveNote()}>
                        Guardar nota
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-64 flex items-center justify-center text-muted-foreground">
              Selecciona una conversacion para ver detalle.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
