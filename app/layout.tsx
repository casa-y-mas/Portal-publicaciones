import React from "react"
import type { Metadata } from 'next'
import { Manrope, Playfair_Display, Geist_Mono } from 'next/font/google'

import './globals.css'
import { LayoutClient } from './layout-client'

const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope' })
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })

export const metadata: Metadata = {
  title: 'InmoSocial Suite - Panel de redes sociales',
  description: 'Programacion y gestion profesional de redes sociales para bienes raices',
  generator: 'v0.app',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${manrope.variable} ${playfair.variable} ${geistMono.variable} antialiased`}>
        <LayoutClient>{children}</LayoutClient>
      </body>
    </html>
  )
}
