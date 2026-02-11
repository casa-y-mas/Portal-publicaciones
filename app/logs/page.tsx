'use client'

import { useState } from 'react'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { auditTrail, logEntries } from '@/lib/mock-data'
import { Button } from '@/components/ui/button'
import { ChevronDown, Copy } from 'lucide-react'

export default function LogsPage() {
  const [expandedLog, setExpandedLog] = useState<string | null>(null)

  const getStatusColor = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) return 'bg-green-500/10 text-green-600 dark:text-green-300'
    if (statusCode >= 400 && statusCode < 500) return 'bg-orange-500/10 text-orange-600 dark:text-orange-300'
    if (statusCode >= 500) return 'bg-red-500/10 text-red-600 dark:text-red-300'
    return 'bg-gray-500/10 text-gray-600 dark:text-gray-300'
  }

  const selected = logEntries.find((entry) => entry.id === expandedLog)

  return (
    <div>
      <Breadcrumbs />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Logs</h1>
        <p className="text-muted-foreground">Intentos de publicacion, payload/response y auditoria de cambios.</p>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-6 py-3 text-left font-semibold text-muted-foreground">Post ID</th>
                <th className="px-6 py-3 text-left font-semibold text-muted-foreground">Plataforma</th>
                <th className="px-6 py-3 text-left font-semibold text-muted-foreground">Status</th>
                <th className="px-6 py-3 text-left font-semibold text-muted-foreground">Resultado</th>
                <th className="px-6 py-3 text-left font-semibold text-muted-foreground">Hora</th>
                <th className="px-6 py-3 text-left font-semibold text-muted-foreground">Accion</th>
              </tr>
            </thead>
            <tbody>
              {logEntries.map((log) => (
                <tr key={log.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs">{log.postId}</td>
                  <td className="px-6 py-4">{log.platform}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full font-semibold ${getStatusColor(log.statusCode)}`}>{log.statusCode}</span>
                  </td>
                  <td className="px-6 py-4 capitalize">{log.result}</td>
                  <td className="px-6 py-4 text-muted-foreground">{log.timestamp.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <Button variant="ghost" size="sm" onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}>
                      <ChevronDown size={16} className={`transition-transform ${expandedLog === log.id ? 'rotate-180' : ''}`} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selected && (
          <div className="border-t border-border p-6 bg-muted/50 font-mono text-xs space-y-6">
            {selected.errorMessage && (
              <div>
                <h4 className="font-semibold text-red-500 mb-2">Error</h4>
                <p className="bg-background p-3 rounded-lg break-all">{selected.errorMessage}</p>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-foreground">Payload</h4>
                <Button variant="ghost" size="sm" className="h-6 px-2">
                  <Copy size={14} />
                </Button>
              </div>
              <pre className="bg-background p-3 rounded-lg overflow-x-auto text-foreground">{JSON.stringify(selected.requestPayload, null, 2)}</pre>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-2">Response</h4>
              <pre className="bg-background p-3 rounded-lg overflow-x-auto text-foreground">{JSON.stringify(selected.responsePayload, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Auditoria de cambios</h3>
        <div className="space-y-3">
          {auditTrail.map((event) => (
            <div key={event.id} className="border border-border rounded-lg p-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold">{event.action}</p>
                <p className="text-xs text-muted-foreground">{event.at.toLocaleString()}</p>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {event.user} • {event.target}
              </p>
              <p className="text-sm mt-1">{event.details}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
