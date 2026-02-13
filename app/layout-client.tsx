'use client'

import React from "react"
import { usePathname } from 'next/navigation'
import { SessionProvider } from 'next-auth/react'

import { ThemeProvider } from 'next-themes'
import { Sidebar } from '@/components/sidebar'
import { Topbar } from '@/components/topbar'

export function LayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isAuthPage = pathname.startsWith('/auth/')

  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {isAuthPage ? (
          <main className="min-h-screen bg-background transition-colors">
            <div className="p-4 md:p-8">{children}</div>
          </main>
        ) : (
          <>
            <Sidebar />
            <Topbar />
            <main className="pt-16 md:pt-16 md:ml-64 min-h-screen bg-background transition-colors">
              <div className="p-4 md:p-8">{children}</div>
            </main>
          </>
        )}
      </ThemeProvider>
    </SessionProvider>
  )
}
