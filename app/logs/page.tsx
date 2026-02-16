'use client'

import { useState } from 'react'
import { ChevronDown, Copy } from 'lucide-react'

import { StatusBadge } from '@/components/base/status-badge'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { auditTrail, logEntries } from '@/lib/mock-data'

function mapCodeToStatus(statusCode: number) {
  if (statusCode >= 200 && statusCode < 300) return 'success'
  if (statusCode >= 400 && statusCode < 500) return 'warning'
  if (statusCode >= 500) return 'error'
  return 'info'
}

function mapResultLabel(result: string) {
  if (result === 'success') return 'Exito'
  if (result === 'error') return 'Error'
  if (result === 'queued') return 'En cola'
  return result
}

export default function LogsPage() {
  const [expandedLog, setExpandedLog] = useState<string | null>(null)
  const selected = logEntries.find((entry) => entry.id === expandedLog)

  return (
    <div>
      <Breadcrumbs />

      <div className="mb-8">
        <h1 className="view-title">Registros</h1>
        <p className="view-subtitle">Intentos de publicacion, solicitud/respuesta y auditoria de cambios.</p>
      </div>

      <div className="surface-card overflow-hidden mb-8">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>ID publicacion</TableHead>
              <TableHead>Plataforma</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Resultado</TableHead>
              <TableHead>Hora</TableHead>
              <TableHead>Accion</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logEntries.map((log) => (
              <TableRow key={log.id} className="hover:bg-muted/30">
                <TableCell className="font-mono text-xs">{log.postId}</TableCell>
                <TableCell>{log.platform}</TableCell>
                <TableCell>
                  <StatusBadge status={mapCodeToStatus(log.statusCode)} label={`${log.statusCode}`} />
                </TableCell>
                <TableCell className="capitalize">{mapResultLabel(log.result)}</TableCell>
                <TableCell className="text-muted-foreground">{log.timestamp.toLocaleString()}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}>
                    <ChevronDown size={16} className={`transition-transform ${expandedLog === log.id ? 'rotate-180' : ''}`} />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {selected ? (
          <div className="border-t border-border p-6 bg-muted/50 font-mono text-xs space-y-6">
            {selected.errorMessage ? (
              <div>
                <h4 className="font-semibold text-destructive mb-2">Error</h4>
                <p className="bg-background p-3 rounded-lg break-all">{selected.errorMessage}</p>
              </div>
            ) : null}

            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-foreground">Solicitud</h4>
                <Button variant="ghost" size="sm" className="h-6 px-2">
                  <Copy size={14} />
                </Button>
              </div>
              <pre className="bg-background p-3 rounded-lg overflow-x-auto text-foreground">
                {JSON.stringify(selected.requestPayload, null, 2)}
              </pre>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-2">Respuesta</h4>
              <pre className="bg-background p-3 rounded-lg overflow-x-auto text-foreground">
                {JSON.stringify(selected.responsePayload, null, 2)}
              </pre>
            </div>
          </div>
        ) : null}
      </div>

      <div className="surface-card p-6">
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
