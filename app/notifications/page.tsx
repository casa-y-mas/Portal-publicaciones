'use client'

import { useState } from 'react'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { Button } from '@/components/ui/button'
import { notifications } from '@/lib/mock-data'

export default function NotificationsPage() {
  const [items, setItems] = useState(notifications)

  const markAllAsRead = () => {
    setItems((prev) => prev.map((item) => ({ ...item, read: true })))
  }

  return (
    <div>
      <Breadcrumbs />

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Notifications</h1>
          <p className="text-muted-foreground">Alertas de fallos, tokens, aprobaciones y publicaciones exitosas.</p>
        </div>
        <Button variant="outline" onClick={markAllAsRead}>Marcar todas como leidas</Button>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className={`border rounded-lg p-4 ${item.read ? 'bg-card border-border' : 'bg-primary/5 border-primary/30'}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{item.title}</p>
                <p className="text-sm text-muted-foreground mt-1">{item.message}</p>
              </div>
              <span className="text-xs text-muted-foreground">{item.createdAt.toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
