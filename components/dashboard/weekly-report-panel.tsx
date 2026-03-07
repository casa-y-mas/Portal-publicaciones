'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'

interface WeeklyExecutiveReport {
  generatedAt: string
  periodLabel: string
  overview: {
    totalPublished: number
    totalScheduledNext7d: number
    totalFailed: number
    failureRate: number
    pendingApproval: number
  }
  projects: Array<{
    projectId: string
    projectName: string
    published: number
    scheduledNext7d: number
    failed: number
  }>
  team: Array<{
    userId: string
    userName: string
    createdPosts: number
    approvedPosts: number
  }>
  inbox: {
    open: number
    risk: number
    breached: number
    resolvedToday: number
  }
  productivity: Array<{
    assigneeId: string
    assigneeName: string
    activeThreads: number
    resolvedToday: number
    avgResponseMinutes: number | null
    overdueThreads: number
  }>
}

export function WeeklyReportPanel({ initialReport }: { initialReport: WeeklyExecutiveReport }) {
  const [report, setReport] = useState(initialReport)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function generateReport() {
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const response = await fetch('/api/reports/weekly', { method: 'POST' })
      if (!response.ok) {
        const json = await response.json().catch(() => null)
        throw new Error(json?.message ?? 'No se pudo generar el reporte semanal.')
      }

      const json = await response.json()
      setReport(json.report)
      setSuccess('Reporte semanal generado y registrado en la bitacora.')
    } catch (reportError) {
      setError(reportError instanceof Error ? reportError.message : 'No se pudo generar el reporte semanal.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div>
          <h3 className="font-semibold">Reporte semanal ejecutivo</h3>
          <p className="text-xs text-muted-foreground mt-1">{report.periodLabel}</p>
        </div>
        <Button size="sm" onClick={generateReport} disabled={loading}>
          {loading ? 'Generando...' : 'Generar reporte'}
        </Button>
      </div>

      {error ? <p className="text-xs text-destructive mb-3">{error}</p> : null}
      {success ? <p className="text-xs text-primary mb-3">{success}</p> : null}

      <div className="grid md:grid-cols-5 gap-3 mb-4">
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs text-muted-foreground">Publicadas</p>
          <p className="text-xl font-bold">{report.overview.totalPublished}</p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs text-muted-foreground">Programadas 7d</p>
          <p className="text-xl font-bold">{report.overview.totalScheduledNext7d}</p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs text-muted-foreground">Fallidas</p>
          <p className="text-xl font-bold">{report.overview.totalFailed}</p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs text-muted-foreground">Tasa de fallo</p>
          <p className="text-xl font-bold">{report.overview.failureRate}%</p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs text-muted-foreground">Pendientes</p>
          <p className="text-xl font-bold">{report.overview.pendingApproval}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-lg border border-border p-4">
          <h4 className="text-sm font-semibold mb-3">Top proyectos</h4>
          <div className="space-y-2">
            {report.projects.slice(0, 5).map((project) => (
              <div key={project.projectId} className="flex items-center justify-between text-sm">
                <span>{project.projectName}</span>
                <span className="font-semibold">{project.published} pub. / {project.scheduledNext7d} prox.</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border p-4">
          <h4 className="text-sm font-semibold mb-3">Equipo</h4>
          <div className="space-y-2">
            {report.team.slice(0, 5).map((user) => (
              <div key={user.userId} className="flex items-center justify-between text-sm">
                <span>{user.userName}</span>
                <span className="font-semibold">{user.createdPosts} creadas / {user.approvedPosts} aprobadas</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
