import { Breadcrumbs } from '@/components/breadcrumbs'
import { DashboardStats } from '@/components/dashboard/dashboard-stats'
import { ExecutiveInbox } from '@/components/dashboard/executive-inbox'
import { IncidentTray } from '@/components/dashboard/incident-tray'
import { OperationsCenter } from '@/components/dashboard/operations-center'
import { OptimizationLab } from '@/components/dashboard/optimization-lab'
import { PublishingConsole } from '@/components/dashboard/publishing-console'
import { UpcomingPostsTable } from '@/components/dashboard/upcoming-posts-table'
import { PublicationChart } from '@/components/dashboard/publication-chart'
import { WeeklyReportPanel } from '@/components/dashboard/weekly-report-panel'
import {
  getDashboardCommandCenter,
  getDashboardStats,
  getExecutiveInbox,
  getOperationalIncidents,
  getProjectOptimizationRecommendations,
  getUpcomingPosts,
} from '@/lib/dashboard-data'
import { getWeeklyExecutiveReport } from '@/lib/executive-reports'
import { getMetaAnalyticsSummary } from '@/lib/meta-analytics'
import { getInboxAgentProductivitySummary, getInboxSlaSummary } from '@/lib/meta-inbox'
import { getPublishingQueueSnapshot } from '@/lib/publishing'

export default async function DashboardPage() {
  const [stats, upcomingPosts, commandCenter, inbox, incidents, recommendations, publishingSnapshot, metaSummary, inboxSla, inboxProductivity, weeklyReport] = await Promise.all([
    getDashboardStats(),
    getUpcomingPosts(6),
    getDashboardCommandCenter(),
    getExecutiveInbox(8),
    getOperationalIncidents(6),
    getProjectOptimizationRecommendations(6),
    getPublishingQueueSnapshot(),
    getMetaAnalyticsSummary(7),
    getInboxSlaSummary(),
    getInboxAgentProductivitySummary(),
    getWeeklyExecutiveReport(),
  ])

  return (
    <div>
      <Breadcrumbs />

  

      <div className="grid gap-6">
        <DashboardStats stats={stats} />
        <ExecutiveInbox data={inbox} />
        <WeeklyReportPanel initialReport={weeklyReport} />
        <div className="surface-card p-6 enter-up">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
            <h3 className="text-lg font-semibold">Rendimiento Meta (7 dias)</h3>
            <span className="text-xs rounded-full border border-border px-2 py-1 text-muted-foreground">
              {metaSummary.mode === 'live' ? 'Live' : 'Mock'}
            </span>
          </div>
          <div className="grid md:grid-cols-4 gap-3">
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">Alcance</p>
              <p className="text-xl font-bold">{metaSummary.totals.reach.toLocaleString()}</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">Impresiones</p>
              <p className="text-xl font-bold">{metaSummary.totals.impressions.toLocaleString()}</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">Interacciones</p>
              <p className="text-xl font-bold">{metaSummary.totals.engagements.toLocaleString()}</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">Engagement</p>
              <p className="text-xl font-bold">{metaSummary.totals.engagementRate}%</p>
            </div>
          </div>
        </div>
        <div className="surface-card p-6 enter-up">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
            <h3 className="text-lg font-semibold">SLA de inbox comercial</h3>
            <a href="/inbox" className="text-xs text-primary">Abrir inbox</a>
          </div>
          <div className="grid md:grid-cols-4 gap-3 mb-4">
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">Abiertos</p>
              <p className="text-xl font-bold">{inboxSla.totalOpen}</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">En riesgo</p>
              <p className="text-xl font-bold text-amber-500">{inboxSla.risk}</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">Vencidos</p>
              <p className="text-xl font-bold text-destructive">{inboxSla.breached}</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">Resueltos hoy</p>
              <p className="text-xl font-bold">{inboxSla.resolvedToday}</p>
            </div>
          </div>
          <div className="space-y-2">
            {inboxSla.byAssignee.slice(0, 4).map((item) => (
              <div key={item.assigneeId} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                <span className="font-medium">{item.assigneeName}</span>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>Abiertos: <span className="font-semibold text-foreground">{item.open}</span></span>
                  <span>Riesgo: <span className="font-semibold text-amber-500">{item.risk}</span></span>
                  <span>Vencidos: <span className="font-semibold text-destructive">{item.breached}</span></span>
                </div>
              </div>
            ))}
            {inboxSla.byAssignee.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                Aun no hay conversaciones abiertas en inbox.
              </div>
            ) : null}
          </div>
        </div>
        <div className="surface-card p-6 enter-up">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
            <h3 className="text-lg font-semibold">Productividad de community managers</h3>
            <a href="/inbox" className="text-xs text-primary">Ver detalle</a>
          </div>
          <div className="space-y-2">
            {inboxProductivity.items.slice(0, 5).map((item) => (
              <div key={item.assigneeId} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                <div>
                  <p className="font-medium">{item.assigneeName}</p>
                  <p className="text-xs text-muted-foreground">
                    Tiempo medio respuesta: {item.avgResponseMinutes !== null ? `${item.avgResponseMinutes} min` : 'Sin datos'}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>Activos: <span className="font-semibold text-foreground">{item.activeThreads}</span></span>
                  <span>Resueltos hoy: <span className="font-semibold text-foreground">{item.resolvedToday}</span></span>
                  <span>Vencidos: <span className="font-semibold text-destructive">{item.overdueThreads}</span></span>
                </div>
              </div>
            ))}
            {inboxProductivity.items.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                Aun no hay suficiente actividad para medir productividad.
              </div>
            ) : null}
          </div>
        </div>
        <PublishingConsole snapshot={publishingSnapshot} />
        <OperationsCenter data={commandCenter} />

        <div className="grid md:grid-cols-2 gap-6">
          <PublicationChart />
          <IncidentTray incidents={incidents} />
        </div>

        <div className="surface-card p-6 enter-up">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Distribucion por red social</h3>
            <p className="text-xs text-muted-foreground mt-1">Peso de contenido por plataforma</p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Instagram</span>
              <div className="flex items-center gap-2">
                <div className="w-28 h-2.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: '65%' }} />
                </div>
                <span className="text-sm font-semibold">65%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Facebook</span>
              <div className="flex items-center gap-2">
                <div className="w-28 h-2.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-accent" style={{ width: '25%' }} />
                </div>
                <span className="text-sm font-semibold">25%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">TikTok</span>
              <div className="flex items-center gap-2">
                <div className="w-28 h-2.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500" style={{ width: '10%' }} />
                </div>
                <span className="text-sm font-semibold">10%</span>
              </div>
            </div>
          </div>
        </div>

        <UpcomingPostsTable posts={upcomingPosts} />
        <OptimizationLab recommendations={recommendations} />
      </div>
    </div>
  )
}
