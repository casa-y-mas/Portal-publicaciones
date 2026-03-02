'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn, useSession } from 'next-auth/react'
import { LockKeyhole, ShieldCheck } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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
      setError('No fue posible iniciar sesion. Verifica tus credenciales.')
      return
    }

    router.push(result?.url ?? callbackUrl)
    router.refresh()
  }

  return (
    <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-xl items-center py-6 md:py-10 enter-up">
      <div className="absolute left-6 top-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute right-6 bottom-8 h-44 w-44 rounded-full bg-cyan-500/10 blur-3xl" />

      <section className="relative w-full overflow-hidden rounded-[2rem] border border-border bg-card/95 shadow-2xl backdrop-blur">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(61,191,174,0.14),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_30%)]" />

        <div className="relative z-10 px-6 py-8 sm:px-8 md:px-10">
          <div className="mx-auto w-full max-w-md">
           

            <div className="mb-8 space-y-3 text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
                <LockKeyhole size={13} />
                Entorno seguro
              </div>

              <div>
                <h1 className="text-4xl font-semibold tracking-tight text-foreground">Iniciar sesion</h1>
                <p className="mt-2 text-sm text-muted-foreground">Accede a tu espacio de trabajo.</p>
              </div>
            </div>

            <form onSubmit={onSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold block">Correo</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoComplete="email"
                  placeholder="tu@empresa.com"
                  className="h-12 rounded-2xl border-border/80 bg-background/70 px-4"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <label className="text-sm font-semibold block">Contrasena</label>
                  <Link href="/auth/forgot-password" className="text-xs font-medium text-primary hover:underline">
                    Recuperar acceso
                  </Link>
                </div>
                <Input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="Ingresa tu contrasena"
                  className="h-12 rounded-2xl border-border/80 bg-background/70 px-4"
                />
              </div>

              {error ? (
                <div className="rounded-2xl border border-destructive/25 bg-destructive/8 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              ) : null}

              <Button
                type="submit"
                disabled={isLoading}
                className="h-12 w-full rounded-2xl text-sm font-semibold shadow-[0_18px_40px_-18px_hsl(var(--primary)/0.7)]"
              >
                {isLoading ? 'Ingresando...' : 'Entrar al sistema'}
              </Button>
            </form>

            <div className="mt-6 flex items-center justify-center gap-3 rounded-2xl border border-border bg-muted/[0.22] px-4 py-3">
              <div className="rounded-2xl bg-primary/10 p-2 text-primary">
                <ShieldCheck size={14} />
              </div>
              <p className="text-xs text-muted-foreground">Acceso interno administrado por la empresa</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
