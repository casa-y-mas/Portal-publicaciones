'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn, useSession } from 'next-auth/react'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function LoginPage() {
  const router = useRouter()
  const { status } = useSession()
  const callbackUrl = '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace(callbackUrl)
    }
  }, [status, router])

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsLoading(true)

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
      callbackUrl,
    })

    setIsLoading(false)

    if (result?.error) {
      setError('Credenciales invalidas o usuario inactivo.')
      return
    }

    router.push(result?.url ?? callbackUrl)
    router.refresh()
  }

  return (
    <div className="max-w-md mx-auto py-10 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Login</h1>
        <p className="text-sm text-muted-foreground mt-1">Acceso para administradores, supervisores, editores y gerencia.</p>
      </div>

      <form onSubmit={onSubmit} className="bg-card border border-border rounded-lg p-6 space-y-4">
        <div>
          <label className="text-sm font-semibold block mb-2">Email</label>
          <Input
            type="email"
            placeholder="usuario@inmosocial.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <div>
          <label className="text-sm font-semibold block mb-2">Contrasena</label>
          <Input
            type="password"
            placeholder="********"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            autoComplete="current-password"
          />
        </div>
        {error ? <p className="text-sm text-red-500">{error}</p> : null}
        <Button className="w-full" type="submit" disabled={isLoading}>
          {isLoading ? 'Ingresando...' : 'Iniciar sesion'}
        </Button>
        <div className="text-center">
          <Link href="/auth/forgot-password" className="text-sm text-primary hover:underline">
            Recuperar contrasena
          </Link>
        </div>
      </form>

      <p className="text-xs text-muted-foreground">Usuario demo del seed: cualquier email seeded + contrasena Admin123!</p>
    </div>
  )
}
