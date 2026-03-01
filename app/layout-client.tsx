'use client'

import React, { Suspense } from 'react'
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
            <Suspense fallback={<div className="fixed top-0 right-0 left-0 md:left-64 h-16 z-30 border-b border-border bg-background/75 backdrop-blur-xl" />}>
              <Topbar />
            </Suspense>
            <main className="pt-20 md:ml-64 min-h-screen bg-background transition-colors">
              <div className="mx-auto w-full max-w-[1600px] p-4 md:p-8">{children}</div>
            </main>
          </>
        )}
      </ThemeProvider>
    </SessionProvider>
  )
}
