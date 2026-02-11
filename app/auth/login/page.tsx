'use client'

import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function LoginPage() {
  return (
    <div className="max-w-md mx-auto py-10 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Login</h1>
        <p className="text-sm text-muted-foreground mt-1">Acceso para administradores, supervisores, editores y gerencia.</p>
      </div>

      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <div>
          <label className="text-sm font-semibold block mb-2">Email</label>
          <Input type="email" placeholder="usuario@inmosocial.com" />
        </div>
        <div>
          <label className="text-sm font-semibold block mb-2">Contrasena</label>
          <Input type="password" placeholder="********" />
        </div>
        <Button className="w-full">Iniciar sesion</Button>
        <div className="text-center">
          <Link href="/auth/forgot-password" className="text-sm text-primary hover:underline">
            Recuperar contrasena
          </Link>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">UI de autenticacion. En backend se conecta con proveedor real.</p>
    </div>
  )
}
