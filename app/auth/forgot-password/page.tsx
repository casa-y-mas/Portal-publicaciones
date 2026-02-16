'use client'

import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function ForgotPasswordPage() {
  return (
    <div className="max-w-md mx-auto py-10 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Recuperar contrasena</h1>
        <p className="text-sm text-muted-foreground mt-1">Enviaremos un enlace para restablecer tu acceso.</p>
      </div>

      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <div>
          <label className="text-sm font-semibold block mb-2">Correo</label>
          <Input type="email" placeholder="usuario@inmosocial.com" />
        </div>
        <Button className="w-full">Enviar enlace</Button>
        <div className="text-center">
          <Link href="/auth/login" className="text-sm text-primary hover:underline">
            Volver a inicio de sesion
          </Link>
        </div>
      </div>
    </div>
  )
}
