'use client'

import { useState } from 'react'
import { CheckCircle, Clock, XCircle } from 'lucide-react'

import { StatusBadge } from '@/components/base/status-badge'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { Button } from '@/components/ui/button'
import { approvals } from '@/lib/mock-data'

export default function ApprovalsPage() {
  const [pendingApprovals, setPendingApprovals] = useState(approvals.filter((approval) => approval.status === 'pending'))
  const [rejectionReason, setRejectionReason] = useState<string | null>(null)
  const [rejectionPostId, setRejectionPostId] = useState<string | null>(null)

  const handleApprove = (id: string) => {
    setPendingApprovals((prev) => prev.filter((approval) => approval.id !== id))
  }

  const handleReject = (id: string) => {
    setRejectionPostId(id)
  }

  const submitRejection = () => {
    if (rejectionReason && rejectionPostId) {
      setPendingApprovals((prev) => prev.filter((approval) => approval.id !== rejectionPostId))
      setRejectionReason(null)
      setRejectionPostId(null)
    }
  }

  const approvedItems = approvals.filter((approval) => approval.status === 'approved')

  return (
    <div>
      <Breadcrumbs />

      <div className="mb-8">
        <h1 className="view-title">Approvals</h1>
        <p className="view-subtitle">Review and approve pending posts</p>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Pending Review ({pendingApprovals.length})</h2>
          <div className="space-y-4">
            {pendingApprovals.map((item) => (
              <div key={item.id} className="surface-card p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{item.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Created by {item.creator} • {item.submittedAt.toLocaleDateString()}
                    </p>
                  </div>
                  <Clock size={20} className="text-muted-foreground" />
                </div>

                <div className="surface-muted p-4 mb-4">
                  <p className="text-sm text-muted-foreground mb-2">Caption:</p>
                  <p className="text-foreground">{item.caption}</p>
                </div>

                <div className="grid sm:grid-cols-3 gap-4 mb-6">
                  <div>
                    <p className="text-xs text-muted-foreground">Platforms</p>
                    <div className="flex gap-1 mt-1">
                      {item.platforms.map((platform) => (
                        <span key={platform} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                          {platform}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Scheduled For</p>
                    <p className="text-sm font-semibold mt-1">{item.proposedDate.toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Time</p>
                    <p className="text-sm font-semibold mt-1">
                      {item.proposedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                {rejectionPostId === item.id ? (
                  <div className="surface-muted p-4 mb-4 space-y-3">
                    <label className="text-sm font-semibold text-foreground block">Reason for Rejection</label>
                    <textarea
                      className="w-full bg-background border border-border rounded-lg p-3 text-foreground placeholder-muted-foreground resize-none"
                      rows={3}
                      placeholder="Explain why this post was rejected..."
                      value={rejectionReason || ''}
                      onChange={(event) => setRejectionReason(event.target.value)}
                    />
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setRejectionPostId(null)
                          setRejectionReason(null)
                        }}
                      >
                        Cancel
                      </Button>
                      <Button size="sm" variant="destructive" onClick={submitRejection} disabled={!rejectionReason}>
                        Confirm Rejection
                      </Button>
                    </div>
                  </div>
                ) : null}

                <div className="flex gap-3">
                  <Button className="flex-1" onClick={() => handleApprove(item.id)}>
                    <CheckCircle size={16} className="mr-2" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 bg-transparent"
                    onClick={() => handleReject(item.id)}
                    disabled={rejectionPostId === item.id}
                  >
                    <XCircle size={16} className="mr-2" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}

            {pendingApprovals.length === 0 ? (
              <div className="surface-card p-12 text-center">
                <CheckCircle size={32} className="mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground">No pending approvals</p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="border-t border-border pt-6">
          <h2 className="text-xl font-semibold mb-4">Approval History</h2>
          <div className="space-y-2">
            {approvedItems.map((item) => (
              <div key={item.id} className="surface-card p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold">{item.title}</p>
                  <p className="text-sm text-muted-foreground">Approved • {item.proposedDate.toLocaleDateString()}</p>
                </div>
                <StatusBadge status="approved" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
