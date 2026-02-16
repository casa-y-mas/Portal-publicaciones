'use client'

import { Plus, RefreshCw, ShieldCheck, Trash2 } from 'lucide-react'

import { StatusBadge } from '@/components/base/status-badge'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { Button } from '@/components/ui/button'
import { socialAccounts } from '@/lib/mock-data'

export default function SocialAccountsPage() {
  const typeLabel: Record<string, string> = {
    Business: 'Empresa',
    Creator: 'Creador',
    Page: 'Pagina',
  }

  return (
    <div>
      <Breadcrumbs />

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="view-title">Cuentas sociales</h1>
          <p className="view-subtitle">OAuth Meta, tokens, permisos, pagina Facebook y cuenta Instagram vinculada.</p>
        </div>
        <Button>
          <Plus size={16} className="mr-2" />
          Conectar cuenta
        </Button>
      </div>

      <div className="surface-card p-6 mb-6">
        <h3 className="text-lg font-semibold mb-3">Flujo recomendado (fase 1)</h3>
        <div className="grid md:grid-cols-2 gap-6 text-sm text-muted-foreground">
          <div>
            <p className="font-semibold text-foreground mb-2">Instagram empresa/creador + paginas de Facebook</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Iniciar OAuth con Meta.</li>
              <li>Validar permisos de publicacion.</li>
              <li>Seleccionar pagina de Facebook.</li>
              <li>Seleccionar Instagram vinculada.</li>
            </ol>
          </div>
          <div>
            <p className="font-semibold text-foreground mb-2">Fase 2 / 3 (modular)</p>
            <p>TikTok, YouTube Shorts, X y LinkedIn se habilitan con conectores nuevos sin rehacer la interfaz.</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {socialAccounts.map((account) => {
          const normalizedStatus = account.status === 'token-expiring' ? 'token_expiring' : account.status
          return (
            <div key={account.id} className="surface-card p-6 flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold">{account.username}</h3>
                  <StatusBadge status={normalizedStatus} />
                </div>

                <div className="grid sm:grid-cols-4 gap-4 mt-4 mb-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Plataforma</p>
                    <p className="text-sm font-semibold text-foreground">{account.platform}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Tipo</p>
                    <p className="text-sm font-semibold text-foreground">{typeLabel[account.type] ?? account.type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Pagina Facebook</p>
                    <p className="text-sm font-semibold text-foreground">{account.pageName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Instagram vinculada</p>
                    <p className="text-sm font-semibold text-foreground">{account.linkedInstagram}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ShieldCheck size={14} />
                  OAuth activo • Expira: {new Date(account.expiresAt).toLocaleDateString()}
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <RefreshCw size={16} />
                </Button>
                <Button variant="destructive" size="sm">
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
