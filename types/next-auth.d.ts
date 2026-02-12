import 'next-auth'
import 'next-auth/jwt'

type AppUserRole = 'admin' | 'supervisor' | 'editor'

declare module 'next-auth' {
  interface User {
    role: AppUserRole
  }

  interface Session {
    user: {
      id: string
      role: AppUserRole
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    role?: AppUserRole
  }
}
