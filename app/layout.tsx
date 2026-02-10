import { Sidebar } from "@/components/sidebar"
import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { Topbar } from "@/components/topbar"

import './globals.css'
import { LayoutClient } from './layout-client'

const _geist = Geist({ subsets: ['latin'] })
const _geistMono = Geist_Mono({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'InmoSocial Suite - Social Media Dashboard',
  description: 'Professional social media scheduling and management for real estate',
  generator: 'v0.app',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <Sidebar />
          <Topbar />
          <main className="pt-16 md:pt-16 md:ml-64 min-h-screen bg-background">
            <div className="p-4 md:p-8">
              {children}
            </div>
          </main>
        </ThemeProvider>
      </body>
    </html>
  )
}
