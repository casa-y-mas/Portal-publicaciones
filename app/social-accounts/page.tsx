'use client'

import { Breadcrumbs } from '@/components/breadcrumbs'
import { socialAccounts } from '@/lib/mock-data'
import { Button } from '@/components/ui/button'
import { AlertCircle, Check, RefreshCw, Trash2, Plus } from 'lucide-react'

export default function SocialAccountsPage() {
  const getStatusColor = (status: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      connected: {
        bg: 'bg-green-500/10',
        text: 'text-green-600 dark:text-green-400',
        border: 'border-green-500/20',
      },
      'token-expiring': {
        bg: 'bg-orange-500/10',
        text: 'text-orange-600 dark:text-orange-400',
        border: 'border-orange-500/20',
      },
    }
    return colors[status] || colors.connected
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      connected: 'Connected',
      'token-expiring': 'Token Expiring Soon',
    }
    return labels[status] || status
  }

  const getStatusIcon = (status: string) => {
    return status === 'token-expiring' ? AlertCircle : Check
  }

  return (
    <div>
      <Breadcrumbs />

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Social Accounts</h1>
          <p className="text-muted-foreground">Manage connected social media accounts</p>
        </div>
        <Button>
          <Plus size={16} className="mr-2" />
          Connect Account
        </Button>
      </div>

      <div className="space-y-4">
        {socialAccounts.map(account => {
          const colors = getStatusColor(account.status)
          const StatusIcon = getStatusIcon(account.status)

          return (
            <div
              key={account.id}
              className={`bg-card border-2 rounded-lg p-6 flex items-start justify-between ${colors.border}`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold">{account.username}</h3>
                  <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${colors.bg} ${colors.text}`}>
                    <StatusIcon size={14} />
                    {getStatusLabel(account.status)}
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-4 mt-4 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Platform</p>
                    <p className="text-sm font-semibold text-foreground">{account.platform}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Type</p>
                    <p className="text-sm font-semibold text-foreground">{account.type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Token Expires</p>
                    <p className="text-sm font-semibold text-foreground">{new Date(account.expiresAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {account.status === 'token-expiring' && (
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 mt-4">
                    <p className="text-sm text-orange-600 dark:text-orange-400">
                      ⚠️ Your token will expire soon. Please refresh it to maintain the connection.
                    </p>
                  </div>
                )}
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

      {/* Integration guide */}
      <div className="bg-card border border-border rounded-lg p-6 mt-8">
        <h3 className="text-lg font-semibold mb-4">How to Connect Accounts</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold mb-2">Instagram Business</h4>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Go to Meta Business Suite</li>
              <li>Select your Instagram account</li>
              <li>Generate access token</li>
              <li>Paste the token here</li>
            </ol>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Facebook Pages</h4>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Open Facebook Developer</li>
              <li>Create new app</li>
              <li>Get Page Access Token</li>
              <li>Connect in settings</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
