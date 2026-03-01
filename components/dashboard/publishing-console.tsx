'use client'

import { useState } from 'react'
import { Loader2, PlayCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'

interface PublishingConsoleProps {
  snapshot: {
    mode: string
    dueNow: number
    nextHour: number
    disconnectedAccounts: number
    expiringAccounts: number
    checkedAt: string
  }
}

interface RunSummary {
  processed: number
  published: number
  failed: number
  skipped: number
  executedAt: string
}

export function PublishingConsole({ snapshot }: PublishingConsoleProps) {
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<RunSummary | null>(null)

  const runQueue = async () => {
    setRunning(true)
    setError(null)
    try {
      const response = await fetch('/api/publisher/run', { method: 'POST' })
      if (!response.ok) {
        const json = await response.json().catch(() => null)
        throw new Error(json?.message ?? 'No se pudo ejecutar la cola.')
      }

      const json = await response.json()
      setSummary({
        processed: json.processed ?? 0,
        published: json.published ?? 0,
        failed: json.failed ?? 0,
        skipped: json.skipped ?? 0,
        executedAt: json.executedAt ?? new Date().toISOString(),
      })
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : 'Error ejecutando la cola.')
    } finally {
      setRunning(false)
    }
  }

  return (
    <section className="surface-card p-6 enter-up">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-primary/80 mb-2">Motor de publicacion</p>
          <h3 className="text-lg font-semibold">Cola operativa</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Ejecuta publicaciones vencidas desde DB. Modo actual: <span className="font-semibold text-foreground uppercase">{snapshot.mode}</span>
          </p>
        </div>
        <Button onClick={runQueue} disabled={running}>
          {running ? <Loader2 size={16} className="mr-2 animate-spin" /> : <PlayCircle size={16} className="mr-2" />}
          {running ? 'Procesando...' : 'Ejecutar ahora'}
        </Button>
      </div>

      <div className="grid md:grid-cols-4 gap-3 mt-5">
        <div className="surface-muted p-3">
          <p className="text-xs text-muted-foreground">Vencidas ahora</p>
          <p className="text-2xl font-semibold mt-1">{snapshot.dueNow}</p>
        </div>
        <div className="surface-muted p-3">
          <p className="text-xs text-muted-foreground">Proxima hora</p>
          <p className="text-2xl font-semibold mt-1">{snapshot.nextHour}</p>
        </div>
        <div className="surface-muted p-3">
          <p className="text-xs text-muted-foreground">Cuentas desconectadas</p>
          <p className="text-2xl font-semibold mt-1">{snapshot.disconnectedAccounts}</p>
        </div>
        <div className="surface-muted p-3">
          <p className="text-xs text-muted-foreground">Tokens por expirar</p>
          <p className="text-2xl font-semibold mt-1">{snapshot.expiringAccounts}</p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-3">
        Ultima lectura de cola: {new Date(snapshot.checkedAt).toLocaleString()}
      </p>

      {error ? (
        <div className="surface-muted p-3 mt-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      ) : null}

      {summary ? (
        <div className="surface-muted p-3 mt-4 border-primary/30">
          <p className="text-sm text-primary">
            Ejecucion completada: {summary.processed} procesadas, {summary.published} publicadas, {summary.failed} fallidas, {summary.skipped} omitidas.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {new Date(summary.executedAt).toLocaleString()}
          </p>
        </div>
      ) : null}
    </section>
  )
}
