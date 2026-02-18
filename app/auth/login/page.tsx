'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn, useSession } from 'next-auth/react'
import { Building2, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react'

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

  function loadDemoCredentials() {
    setEmail('maria@inmosocial.com')
    setPassword('Admin123!')
    setError('')
  }

  return (
    <div className="relative mx-auto w-full max-w-6xl py-4 md:py-8 enter-up">
      <div className="absolute -left-10 top-20 h-36 w-36 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute -right-8 bottom-6 h-44 w-44 rounded-full bg-accent/20 blur-3xl" />

      <div className="relative grid overflow-hidden rounded-3xl border border-border bg-card/90 backdrop-blur lg:grid-cols-2">
        <section className="relative hidden p-8 lg:flex lg:flex-col lg:justify-between bg-gradient-to-br from-primary/20 via-primary/8 to-accent/10">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1 text-xs text-muted-foreground">
              <Building2 size={14} />
              Plataforma inmobiliaria
            </div>

            <div>
              <h1 className="text-4xl leading-tight font-semibold tracking-tight" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                Gestion profesional de publicaciones y proyectos
              </h1>
              <p className="mt-4 max-w-md text-sm text-muted-foreground">
                Centraliza aprobaciones, calendarios de contenido, activos multimedia y trazabilidad operativa desde una sola interfaz.
              </p>
            </div>
          </div>

          <div className="grid gap-3">
            <div className="rounded-2xl border border-border bg-background/70 p-4">
              <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Seguridad</p>
              <p className="mt-1 text-sm font-semibold">Control por roles y sesiones protegidas</p>
            </div>
            <div className="rounded-2xl border border-border bg-background/70 p-4">
              <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Operacion</p>
              <p className="mt-1 text-sm font-semibold">Programacion, aprobacion y auditoria en tiempo real</p>
            </div>
          </div>
        </section>

        <section className="p-6 md:p-10">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                <Sparkles size={13} />
                Acceso seguro
              </div>
              <h2 className="text-3xl font-semibold tracking-tight">Iniciar sesion</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Ingresa con tu cuenta para administrar contenido, proyectos y aprobaciones.
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold block">Correo</label>
                <Input
                  type="email"
                  placeholder="usuario@inmosocial.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoComplete="email"
                  className="h-11 rounded-xl bg-background/80"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold block">Contrasena</label>
                  <Link href="/auth/forgot-password" className="text-xs text-primary hover:underline">
                    Recuperar acceso
                  </Link>
                </div>
                <Input
                  type="password"
                  placeholder="********"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  autoComplete="current-password"
                  className="h-11 rounded-xl bg-background/80"
                />
              </div>

              {error ? (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              ) : null}

              <Button className="h-11 w-full rounded-xl font-semibold" type="submit" disabled={isLoading}>
                {isLoading ? 'Ingresando...' : 'Entrar al panel'}
              </Button>
            </form>

            <div className="mt-6 rounded-2xl border border-border bg-muted/30 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Acceso de demostracion</p>
                  <p className="text-xs text-muted-foreground">Carga credenciales del usuario admin de la semilla.</p>
                </div>
                <Button type="button" variant="outline" size="sm" className="rounded-lg" onClick={loadDemoCredentials}>
                  Usar demo
                </Button>
              </div>
              <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                <p className="inline-flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-primary" />
                  Correo: maria@inmosocial.com
                </p>
                <p className="inline-flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-primary" />
                  Contrasena: Admin123!
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
