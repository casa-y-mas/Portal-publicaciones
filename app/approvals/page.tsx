import { Breadcrumbs } from '@/components/breadcrumbs'
import { ApprovalsBoard } from '@/components/approvals/approvals-board'
import { getApprovalBoardData } from '@/lib/dashboard-data'

export default async function ApprovalsPage() {
  const data = await getApprovalBoardData()

  return (
    <div>
      <Breadcrumbs />

      <div className="mb-8">
        <h1 className="view-title">Aprobaciones</h1>
        <p className="view-subtitle">Cola real de revision conectada a publicaciones pendientes y su historial de resolucion.</p>
      </div>

      <ApprovalsBoard initialPending={data.pending} recent={data.recent} />
    </div>
  )
}
