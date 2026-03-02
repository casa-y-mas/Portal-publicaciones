import { Breadcrumbs } from '@/components/breadcrumbs'
import { DashboardStats } from '@/components/dashboard/dashboard-stats'
import { ExecutiveInbox } from '@/components/dashboard/executive-inbox'
import { IncidentTray } from '@/components/dashboard/incident-tray'
import { OperationsCenter } from '@/components/dashboard/operations-center'
import { OptimizationLab } from '@/components/dashboard/optimization-lab'
import { PublishingConsole } from '@/components/dashboard/publishing-console'
import { UpcomingPostsTable } from '@/components/dashboard/upcoming-posts-table'
import { PublicationChart } from '@/components/dashboard/publication-chart'
import {
  getDashboardCommandCenter,
  getDashboardStats,
  getExecutiveInbox,
  getOperationalIncidents,
  getProjectOptimizationRecommendations,
  getUpcomingPosts,
} from '@/lib/dashboard-data'
import { getPublishingQueueSnapshot } from '@/lib/publishing'

export default async function DashboardPage() {
  const [stats, upcomingPosts, commandCenter, inbox, incidents, recommendations, publishingSnapshot] = await Promise.all([
    getDashboardStats(),
    getUpcomingPosts(6),
    getDashboardCommandCenter(),
    getExecutiveInbox(8),
    getOperationalIncidents(6),
    getProjectOptimizationRecommendations(6),
    getPublishingQueueSnapshot(),
  ])

  return (
    <div>
      <Breadcrumbs />

  

      <div className="grid gap-6">
        <DashboardStats stats={stats} />
        <ExecutiveInbox data={inbox} />
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
