'use client'

import { Breadcrumbs } from '@/components/breadcrumbs'
import { socialAccounts } from '@/lib/mock-data'
import { Button } from '@/components/ui/button'
import { AlertCircle, Check, RefreshCw, Trash2, Plus, ShieldCheck } from 'lucide-react'

export default function SocialAccountsPage() {
  const getStatusColor = (status: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      connected: {
        bg: 'bg-green-500/10',
        text: 'text-green-600 dark:text-green-300',
        border: 'border-green-500/20',
      },
      'token-expiring': {
        bg: 'bg-orange-500/10',
        text: 'text-orange-600 dark:text-orange-300',
        border: 'border-orange-500/20',
      },
    }
    return colors[status] || colors.connected
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      connected: 'Conectada',
      'token-expiring': 'Token por expirar',
    }
    return labels[status] || status
  }

  return (
    <div>
      <Breadcrumbs />

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Social Accounts</h1>
          <p className="text-muted-foreground">OAuth Meta, tokens, permisos, pagina Facebook y cuenta Instagram vinculada.</p>
        </div>
        <Button>
          <Plus size={16} className="mr-2" />
          Conectar cuenta
        </Button>
      </div>

      <div className="bg-card border border-border rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold mb-3">Flujo recomendado (Fase 1)</h3>
        <div className="grid md:grid-cols-2 gap-6 text-sm text-muted-foreground">
          <div>
            <p className="font-semibold text-foreground mb-2">Instagram Business/Creator + Facebook Pages</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Iniciar OAuth con Meta.</li>
              <li>Validar permisos de publicacion.</li>
              <li>Seleccionar pagina de Facebook.</li>
              <li>Seleccionar Instagram vinculada.</li>
            </ol>
          </div>
          <div>
            <p className="font-semibold text-foreground mb-2">Fase 2 / 3 (modular)</p>
            <p>TikTok, YouTube Shorts, X y LinkedIn se habilitan por conectores nuevos sin rehacer UI.</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {socialAccounts.map((account) => {
          const colors = getStatusColor(account.status)

          return (
            <div key={account.id} className={`bg-card border-2 rounded-lg p-6 flex items-start justify-between ${colors.border}`}>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold">{account.username}</h3>
                  <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${colors.bg} ${colors.text}`}>
                    {account.status === 'token-expiring' ? <AlertCircle size={14} /> : <Check size={14} />}
                    {getStatusLabel(account.status)}
                  </div>
                </div>

                <div className="grid sm:grid-cols-4 gap-4 mt-4 mb-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Plataforma</p>
                    <p className="text-sm font-semibold text-foreground">{account.platform}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Tipo</p>
                    <p className="text-sm font-semibold text-foreground">{account.type}</p>
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

              <div className="flex gap-2 ml-4">
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
