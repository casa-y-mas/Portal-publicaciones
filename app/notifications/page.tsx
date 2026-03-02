'use client'

import { useEffect, useState } from 'react'

import { Breadcrumbs } from '@/components/breadcrumbs'
import { Button } from '@/components/ui/button'

interface NotificationItem {
  id: string
  type: string
  title: string
  message: string
  href: string | null
  read: boolean
  createdAt: string
}

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadNotifications = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/notifications')
      if (!response.ok) {
        throw new Error('No se pudieron cargar las notificaciones.')
      }
      const json = await response.json()
      setItems(json.items ?? [])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Error cargando notificaciones.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications', { method: 'PATCH' })
      if (!response.ok) throw new Error('No se pudieron marcar como leidas.')
      const json = await response.json()
      setItems(json.items ?? [])
    } catch (markError) {
      setError(markError instanceof Error ? markError.message : 'Error actualizando notificaciones.')
    }
  }

  return (
    <div>
      <Breadcrumbs />

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Notificaciones</h1>
          <p className="text-muted-foreground">Alertas reales de fallos, tokens, aprobaciones y ejecucion operativa.</p>
        </div>
        <Button variant="outline" onClick={markAllAsRead} disabled={items.length === 0}>
          Marcar todas como leidas
        </Button>
      </div>

      {error ? (
        <div className="surface-muted p-3 mb-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      ) : null}

      {loading ? (
        <div className="surface-card p-8 text-center text-muted-foreground">Cargando notificaciones...</div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className={`border rounded-lg p-4 ${item.read ? 'bg-card border-border' : 'bg-primary/5 border-primary/30'}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{item.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">{item.message}</p>
                  {item.href ? (
                    <a href={item.href} className="inline-block text-xs text-primary mt-2">
                      Abrir
                    </a>
                  ) : null}
                </div>
                <span className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleString()}</span>
              </div>
            </div>
          ))}

          {items.length === 0 ? (
            <div className="surface-card p-8 text-center text-muted-foreground">No hay notificaciones registradas.</div>
          ) : null}
        </div>
      )}
    </div>
  )
}
