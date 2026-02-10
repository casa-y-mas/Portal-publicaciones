'use client'

import React from "react"

import { ThemeProvider } from 'next-themes'
import { Sidebar } from '@/components/sidebar'
import { Topbar } from '@/components/topbar'

export function LayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <Sidebar />
      <Topbar />
      <main className="pt-16 md:pt-16 md:ml-64 min-h-screen bg-background">
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </ThemeProvider>
  )
}
