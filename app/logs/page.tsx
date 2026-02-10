'use client'

import { useState } from 'react'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { logEntries } from '@/lib/mock-data'
import { Button } from '@/components/ui/button'
import { ChevronDown, Copy } from 'lucide-react'

export default function LogsPage() {
  const [expandedLog, setExpandedLog] = useState<string | null>(null)

  const getStatusColor = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) {
      return 'bg-green-500/10 text-green-600 dark:text-green-400'
    }
    if (statusCode >= 400 && statusCode < 500) {
      return 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
    }
    if (statusCode >= 500) {
      return 'bg-red-500/10 text-red-600 dark:text-red-400'
    }
    return 'bg-gray-500/10 text-gray-600 dark:text-gray-400'
  }

  return (
    <div>
      <Breadcrumbs />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Logs</h1>
        <p className="text-muted-foreground">Technical activity and debugging information</p>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-6 py-3 text-left font-semibold text-muted-foreground">Post ID</th>
                <th className="px-6 py-3 text-left font-semibold text-muted-foreground">Platform</th>
                <th className="px-6 py-3 text-left font-semibold text-muted-foreground">Status</th>
                <th className="px-6 py-3 text-left font-semibold text-muted-foreground">Result</th>
                <th className="px-6 py-3 text-left font-semibold text-muted-foreground">Time</th>
                <th className="px-6 py-3 text-left font-semibold text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {logEntries.map(log => (
                <tr
                  key={log.id}
                  className="border-b border-border hover:bg-muted/30 transition-colors"
                >
                  <td className="px-6 py-4 font-mono text-xs">{log.postId}</td>
                  <td className="px-6 py-4">{log.platform}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full font-semibold ${getStatusColor(log.statusCode)}`}>
                      {log.statusCode}
                    </span>
                  </td>
                  <td className="px-6 py-4 capitalize">{log.result}</td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {log.timestamp.toLocaleDateString()} {log.timestamp.toLocaleTimeString()}
                  </td>
                  <td className="px-6 py-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setExpandedLog(expandedLog === log.id ? null : log.id)
                      }
                    >
                      <ChevronDown
                        size={16}
                        className={`transition-transform ${
                          expandedLog === log.id ? 'rotate-180' : ''
                        }`}
                      />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Expanded log details */}
        {expandedLog && (
          <div className="border-t border-border p-6 bg-muted/50 font-mono text-xs">
            {logEntries.find(l => l.id === expandedLog) && (
              <div className="space-y-6">
                {logEntries.find(l => l.id === expandedLog)?.errorMessage && (
                  <div>
                    <h4 className="font-semibold text-red-600 dark:text-red-400 mb-2">Error Message</h4>
                    <p className="bg-background p-3 rounded-lg text-red-600 dark:text-red-400 break-all">
                      {logEntries.find(l => l.id === expandedLog)?.errorMessage}
                    </p>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-foreground">Request Payload</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2"
                    >
                      <Copy size={14} />
                    </Button>
                  </div>
                  <pre className="bg-background p-3 rounded-lg overflow-x-auto text-foreground">
                    {JSON.stringify(
                      logEntries.find(l => l.id === expandedLog)?.requestPayload,
                      null,
                      2
                    )}
                  </pre>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-foreground">Response Payload</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2"
                    >
                      <Copy size={14} />
                    </Button>
                  </div>
                  <pre className="bg-background p-3 rounded-lg overflow-x-auto text-foreground">
                    {JSON.stringify(
                      logEntries.find(l => l.id === expandedLog)?.responsePayload,
                      null,
                      2
                    )}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
