'use client'

import { useEffect, useMemo, useState } from 'react'
import { Edit2, Plus, RefreshCw, Trash2 } from 'lucide-react'

import { StatusBadge } from '@/components/base/status-badge'
import { AppModal } from '@/components/base/app-modal'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Platform = 'instagram' | 'facebook'
type AccountStatus = 'connected' | 'token_expiring' | 'disconnected'

interface ProjectOption {
  id: string
  name: string
  color: string
}

interface SocialAccountItem {
  id: string
  platform: Platform
  username: string
  type: string
  status: AccountStatus
  expiresAt: string | null
  oauthProvider?: string | null
  oauthConnected?: boolean
  connectedAt?: string | null
  tokenLastChecked?: string | null
  tokenScopes?: string[]
  pageId?: string | null
  pageName?: string | null
  instagramUserId?: string | null
  lastError?: string | null
  projectId: string
  createdAt: string
  updatedAt: string
  project: ProjectOption
}

interface MetaPageOption {
  pageId: string
  pageName: string
  instagramUserId: string | null
  isSelected: boolean
}

interface SocialAccountFormState {
  platform: Platform
  username: string
  type: string
  status: AccountStatus
  expiresAt: string
  projectId: string
}

const emptyForm: SocialAccountFormState = {
  platform: 'instagram',
  username: '',
  type: 'Business',
  status: 'connected',
  expiresAt: '',
  projectId: '',
}

const platformLabel: Record<Platform, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
}

export default function SocialAccountsPage() {
  const [items, setItems] = useState<SocialAccountItem[]>([])
  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [actingId, setActingId] = useState<string | null>(null)
  const [pagesLoadingFor, setPagesLoadingFor] = useState<string | null>(null)
  const [pagesByAccount, setPagesByAccount] = useState<Record<string, MetaPageOption[]>>({})

  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<SocialAccountItem | null>(null)
  const [form, setForm] = useState<SocialAccountFormState>(emptyForm)

  const connectedCount = useMemo(() => items.filter((item) => item.status === 'connected').length, [items])
  const expiringCount = useMemo(() => items.filter((item) => item.status === 'token_expiring').length, [items])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [accountsResponse, projectsResponse] = await Promise.all([
        fetch('/api/social-accounts'),
        fetch('/api/projects'),
      ])

      if (!accountsResponse.ok || !projectsResponse.ok) {
        throw new Error('No se pudieron cargar las cuentas sociales.')
      }

      const accountsJson = await accountsResponse.json()
      const projectsJson = await projectsResponse.json()

      setItems(accountsJson.items ?? [])
      setProjects(projectsJson.items ?? [])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Error cargando cuentas sociales.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const resetForm = () => {
    setForm({
      ...emptyForm,
      projectId: projects[0]?.id ?? '',
    })
  }

  const openCreateModal = () => {
    setSuccess(null)
    setError(null)
    setEditing(null)
    setForm({
      ...emptyForm,
      projectId: projects[0]?.id ?? '',
    })
    setCreating(true)
  }

  const openEditModal = (account: SocialAccountItem) => {
    setSuccess(null)
    setError(null)
    setCreating(false)
    setEditing(account)
    setForm({
      platform: account.platform,
      username: account.username,
      type: account.type,
      status: account.status,
      expiresAt: account.expiresAt ? account.expiresAt.slice(0, 10) : '',
      projectId: account.projectId,
    })
  }

  const submitCreate = async () => {
    setSubmitting(true)
    setError(null)
    setSuccess(null)
    try {
      const expiresAt = form.expiresAt ? new Date(`${form.expiresAt}T00:00:00.000Z`).toISOString() : ''
      const response = await fetch('/api/social-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: form.platform,
          username: form.username.trim(),
          type: form.type.trim(),
          status: form.status,
          expiresAt,
          projectId: form.projectId,
        }),
      })

      if (!response.ok) {
        const json = await response.json().catch(() => null)
        throw new Error(json?.message ?? 'No se pudo crear la cuenta social.')
      }

      setCreating(false)
      resetForm()
      setSuccess('Cuenta social registrada correctamente.')
      await loadData()
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Error creando cuenta social.')
    } finally {
      setSubmitting(false)
    }
  }

  const submitUpdate = async () => {
    if (!editing) return

    setSubmitting(true)
    setError(null)
    setSuccess(null)
    try {
      const expiresAt = form.expiresAt ? new Date(`${form.expiresAt}T00:00:00.000Z`).toISOString() : ''
      const response = await fetch(`/api/social-accounts/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: form.platform,
          username: form.username.trim(),
          type: form.type.trim(),
          status: form.status,
          expiresAt,
          projectId: form.projectId,
        }),
      })

      if (!response.ok) {
        const json = await response.json().catch(() => null)
        throw new Error(json?.message ?? 'No se pudo actualizar la cuenta social.')
      }

      setEditing(null)
      resetForm()
      setSuccess('Cuenta social actualizada.')
      await loadData()
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Error actualizando cuenta social.')
    } finally {
      setSubmitting(false)
    }
  }

  const renewAccount = async (account: SocialAccountItem) => {
    setActingId(account.id)
    setError(null)
    setSuccess(null)
    try {
      const nextExpiry = new Date()
      nextExpiry.setDate(nextExpiry.getDate() + 45)

      const response = await fetch(`/api/social-accounts/${account.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'connected',
          expiresAt: nextExpiry.toISOString(),
        }),
      })

      if (!response.ok) {
        const json = await response.json().catch(() => null)
        throw new Error(json?.message ?? 'No se pudo renovar la cuenta social.')
      }

      setSuccess(`Cuenta ${account.username} renovada manualmente.`)
      await loadData()
    } catch (renewError) {
      setError(renewError instanceof Error ? renewError.message : 'Error renovando cuenta social.')
    } finally {
      setActingId(null)
    }
  }

  const startOAuth = async (account: SocialAccountItem) => {
    setActingId(account.id)
    setError(null)
    setSuccess(null)
    try {
      const startResponse = await fetch(`/api/social-accounts/${account.id}/oauth/start`, { method: 'POST' })
      if (!startResponse.ok) {
        const json = await startResponse.json().catch(() => null)
        throw new Error(json?.message ?? 'No se pudo iniciar OAuth.')
      }

      const startJson = await startResponse.json()
      if (startJson.item.requiresRedirect && startJson.item.authUrl) {
        window.location.href = startJson.item.authUrl
        return
      }

      const callbackResponse = await fetch(`/api/social-accounts/${account.id}/oauth/callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state: startJson.item.state,
          code: `demo_${account.platform}`,
          pageId: `page_${account.id.slice(0, 8)}`,
          pageName: account.project.name,
          instagramUserId: account.platform === 'instagram' ? `ig_${account.id.slice(0, 8)}` : '',
          scopes: startJson.item.scopes,
        }),
      })

      if (!callbackResponse.ok) {
        const json = await callbackResponse.json().catch(() => null)
        throw new Error(json?.message ?? 'No se pudo completar OAuth.')
      }

      setSuccess(`OAuth base conectado para ${account.username}. Ya puedes sustituir el flujo simulado por Meta real.`)
      await loadData()
    } catch (oauthError) {
      setError(oauthError instanceof Error ? oauthError.message : 'Error iniciando OAuth.')
    } finally {
      setActingId(null)
    }
  }

  const disconnectOAuth = async (account: SocialAccountItem) => {
    setActingId(account.id)
    setError(null)
    setSuccess(null)
    try {
      const response = await fetch(`/api/social-accounts/${account.id}/oauth/disconnect`, { method: 'POST' })
      if (!response.ok) {
        const json = await response.json().catch(() => null)
        throw new Error(json?.message ?? 'No se pudo desconectar OAuth.')
      }

      setSuccess(`OAuth desconectado para ${account.username}.`)
      await loadData()
    } catch (disconnectError) {
      setError(disconnectError instanceof Error ? disconnectError.message : 'Error desconectando OAuth.')
    } finally {
      setActingId(null)
    }
  }

  const deleteAccount = async (account: SocialAccountItem) => {
    if (!confirm(`Eliminar la cuenta ${account.username}?`)) return

    setActingId(account.id)
    setError(null)
    setSuccess(null)
    try {
      const response = await fetch(`/api/social-accounts/${account.id}`, { method: 'DELETE' })
      if (!response.ok) {
        const json = await response.json().catch(() => null)
        throw new Error(json?.message ?? 'No se pudo eliminar la cuenta social.')
      }

      setSuccess('Cuenta social eliminada.')
      await loadData()
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Error eliminando cuenta social.')
    } finally {
      setActingId(null)
    }
  }

  const loadMetaPages = async (account: SocialAccountItem) => {
    setPagesLoadingFor(account.id)
    try {
      const response = await fetch(`/api/social-accounts/${account.id}/oauth/pages`)
      if (!response.ok) {
        const json = await response.json().catch(() => null)
        throw new Error(json?.message ?? 'No se pudieron cargar las paginas de Meta.')
      }

      const json = await response.json()
      const pages: MetaPageOption[] = json?.item?.pages ?? []
      setPagesByAccount((prev) => ({ ...prev, [account.id]: pages }))
    } catch (pagesError) {
      setError(pagesError instanceof Error ? pagesError.message : 'Error cargando paginas de Meta.')
    } finally {
      setPagesLoadingFor(null)
    }
  }

  const selectMetaPage = async (account: SocialAccountItem, pageId: string) => {
    if (!pageId) return
    setActingId(account.id)
    setError(null)
    setSuccess(null)
    try {
      const response = await fetch(`/api/social-accounts/${account.id}/oauth/pages`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId }),
      })
      if (!response.ok) {
        const json = await response.json().catch(() => null)
        throw new Error(json?.message ?? 'No se pudo seleccionar la pagina.')
      }

      setSuccess('Pagina de Facebook configurada correctamente.')
      await Promise.all([loadData(), loadMetaPages(account)])
    } catch (selectError) {
      setError(selectError instanceof Error ? selectError.message : 'Error seleccionando pagina.')
    } finally {
      setActingId(null)
    }
  }

  const formBody = (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-semibold block mb-2">Plataforma</label>
          <select
            className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm"
            value={form.platform}
            onChange={(event) => setForm((prev) => ({ ...prev, platform: event.target.value as Platform }))}
          >
            <option value="instagram">Instagram</option>
            <option value="facebook">Facebook</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-semibold block mb-2">Tipo</label>
          <Input value={form.type} onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))} />
        </div>
      </div>

      <div>
        <label className="text-sm font-semibold block mb-2">Usuario / pagina</label>
        <Input value={form.username} onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))} />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-semibold block mb-2">Estado</label>
          <select
            className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm"
            value={form.status}
            onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as AccountStatus }))}
          >
            <option value="connected">Conectada</option>
            <option value="token_expiring">Token por expirar</option>
            <option value="disconnected">Desconectada</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-semibold block mb-2">Expira</label>
          <Input type="date" value={form.expiresAt} onChange={(event) => setForm((prev) => ({ ...prev, expiresAt: event.target.value }))} />
        </div>
      </div>

      <div>
        <label className="text-sm font-semibold block mb-2">Proyecto</label>
        <select
          className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm"
          value={form.projectId}
          onChange={(event) => setForm((prev) => ({ ...prev, projectId: event.target.value }))}
        >
          <option value="" disabled>
            Seleccionar proyecto
          </option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  )

  return (
    <div>
      <Breadcrumbs />

      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="view-title">Cuentas sociales</h1>
          <p className="view-subtitle">Inventario real por proyecto para dejar lista la capa de publicacion y futura integracion OAuth.</p>
        </div>
        <Button onClick={openCreateModal} disabled={loading || projects.length === 0}>
          <Plus size={16} className="mr-2" />
          Nueva cuenta
        </Button>
      </div>

      {error ? (
        <div className="surface-muted p-3 mb-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      ) : null}

      {success ? (
        <div className="surface-muted p-3 mb-4 border-primary/30">
          <p className="text-sm text-primary">{success}</p>
        </div>
      ) : null}

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="surface-card p-5">
          <p className="text-sm text-muted-foreground">Cuentas registradas</p>
          <p className="text-3xl font-bold mt-2">{items.length}</p>
        </div>
        <div className="surface-card p-5">
          <p className="text-sm text-muted-foreground">Conectadas</p>
          <p className="text-3xl font-bold mt-2">{connectedCount}</p>
        </div>
        <div className="surface-card p-5">
          <p className="text-sm text-muted-foreground">Con token por expirar</p>
          <p className="text-3xl font-bold mt-2">{expiringCount}</p>
        </div>
      </div>

      <div className="surface-card p-6 mb-6">
        <h3 className="text-lg font-semibold mb-3">Estado de integracion</h3>
        <p className="text-sm text-muted-foreground">
          Esta pantalla conecta OAuth de Meta, permite elegir pagina por cuenta y deja listo el token operativo para publicar en Facebook.
        </p>
      </div>

      {loading ? (
        <div className="surface-card p-12 text-center text-muted-foreground">Cargando cuentas sociales...</div>
      ) : (
        <div className="space-y-4">
          {items.map((account) => (
            <div key={account.id} className="surface-card p-6 flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h3 className="text-lg font-semibold">{account.username}</h3>
                  <StatusBadge status={account.status} />
                  <span
                    className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
                    style={{
                      backgroundColor: `${account.project.color}22`,
                      color: account.project.color,
                    }}
                  >
                    {account.project.name}
                  </span>
                </div>

                <div className="grid sm:grid-cols-4 gap-4 mt-4 mb-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Plataforma</p>
                    <p className="text-sm font-semibold text-foreground">{platformLabel[account.platform]}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Tipo</p>
                    <p className="text-sm font-semibold text-foreground">{account.type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Actualizada</p>
                    <p className="text-sm font-semibold text-foreground">{new Date(account.updatedAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Expira</p>
                    <p className="text-sm font-semibold text-foreground">
                      {account.expiresAt ? new Date(account.expiresAt).toLocaleDateString() : 'Sin fecha'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>OAuth: {account.oauthConnected ? 'Conectado' : 'Pendiente'}</span>
                  {account.oauthProvider ? <span>Proveedor: {account.oauthProvider}</span> : null}
                  {account.pageName ? <span>Pagina: {account.pageName}</span> : null}
                  {account.lastError ? <span className="text-destructive">Error: {account.lastError}</span> : null}
                </div>

                {(account.platform === 'facebook' || account.platform === 'instagram') && account.oauthConnected ? (
                  <div className="mt-4 rounded-lg border border-border p-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadMetaPages(account)}
                        disabled={pagesLoadingFor === account.id || actingId === account.id}
                      >
                        {pagesLoadingFor === account.id ? 'Cargando paginas...' : 'Cargar paginas de Meta'}
                      </Button>

                      {(pagesByAccount[account.id]?.length ?? 0) > 0 ? (
                        <select
                          className="rounded-lg border border-border bg-muted px-3 py-2 text-sm min-w-56"
                          value={account.pageId ?? ''}
                          onChange={(event) => selectMetaPage(account, event.target.value)}
                          disabled={actingId === account.id}
                        >
                          <option value="" disabled>
                            Seleccionar pagina de Meta
                          </option>
                          {pagesByAccount[account.id]?.map((page) => (
                            <option key={page.pageId} value={page.pageId}>
                              {page.pageName}
                            </option>
                          ))}
                        </select>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="flex gap-2 flex-wrap justify-end">
                {account.oauthConnected ? (
                  <Button variant="secondary" size="sm" onClick={() => disconnectOAuth(account)} disabled={actingId === account.id}>
                    Desconectar OAuth
                  </Button>
                ) : (
                  <Button variant="secondary" size="sm" onClick={() => startOAuth(account)} disabled={actingId === account.id}>
                    Iniciar OAuth
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => openEditModal(account)} disabled={actingId === account.id}>
                  <Edit2 size={16} />
                </Button>
                <Button variant="outline" size="sm" onClick={() => renewAccount(account)} disabled={actingId === account.id}>
                  <RefreshCw size={16} />
                </Button>
                <Button variant="destructive" size="sm" onClick={() => deleteAccount(account)} disabled={actingId === account.id}>
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          ))}

          {items.length === 0 ? (
            <div className="surface-card p-12 text-center text-muted-foreground">No hay cuentas sociales registradas.</div>
          ) : null}
        </div>
      )}

      <AppModal
        open={creating}
        onOpenChange={setCreating}
        title="Nueva cuenta social"
        footer={(
          <>
            <Button variant="outline" onClick={() => setCreating(false)}>
              Cancelar
            </Button>
            <Button onClick={submitCreate} disabled={submitting}>
              {submitting ? 'Guardando...' : 'Guardar'}
            </Button>
          </>
        )}
      >
        {formBody}
      </AppModal>

      <AppModal
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) setEditing(null)
        }}
        title="Editar cuenta social"
        footer={(
          <>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button onClick={submitUpdate} disabled={submitting}>
              {submitting ? 'Actualizando...' : 'Actualizar'}
            </Button>
          </>
        )}
      >
        {formBody}
      </AppModal>
    </div>
  )
}
