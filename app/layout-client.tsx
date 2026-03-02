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
            <main className="min-h-screen bg-background pt-20 transition-colors md:ml-64 md:pt-20">
              <div className="mx-auto w-full max-w-[1600px] px-3 pb-24 pt-4 sm:px-4 md:px-8 md:pb-8 md:pt-6">
                {children}
              </div>
            </main>
          </>
        )}
      </ThemeProvider>
    </SessionProvider>
  )
}
