import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

const PUBLIC_ROUTES = new Set(['/auth/login', '/auth/forgot-password', '/api/health/db'])

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const isAuthPage = pathname.startsWith('/auth/')

    if (isAuthPage && req.nextauth.token) {
      return NextResponse.redirect(new URL('/dashboard', req.nextUrl))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        const pathname = req.nextUrl.pathname
        const isAuthRoute = pathname.startsWith('/api/auth')
        const isPublicRoute = PUBLIC_ROUTES.has(pathname)
        const isPublicUpload = pathname.startsWith('/uploads/')
        const isPublisherWithToken =
          (pathname === '/api/publisher/run' || pathname.startsWith('/api/publisher/')) &&
          typeof process.env.PUBLISHER_RUN_TOKEN === 'string' &&
          process.env.PUBLISHER_RUN_TOKEN.length > 0 &&
          req.headers.get('x-publisher-token') === process.env.PUBLISHER_RUN_TOKEN

        if (isAuthRoute || isPublicRoute || isPublicUpload || isPublisherWithToken) return true
        return !!token
      },
    },
  },
)

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|uploads/).*)'],
}
