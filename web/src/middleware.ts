import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const secretKey = 'super-secret-key-for-mvp-only'
const key = new TextEncoder().encode(secretKey)

export async function middleware(request: NextRequest) {
  const session = request.cookies.get('session')?.value
  const isLoginPage = request.nextUrl.pathname.startsWith('/login')

  if (!session && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (session) {
    try {
      const { payload } = await jwtVerify(session, key, { algorithms: ['HS256'] })
      const role = payload.role as string

      if (isLoginPage) {
        return NextResponse.redirect(new URL('/', request.url))
      }

      const pathname = request.nextUrl.pathname

      // Wszyscy mogą przeglądać /policies, więc nie blokujemy tej trasy na poziomie middleware.
      // Dalsze zabezpieczenia przed edycją są zrealizowane w samym UI (policies/page.tsx, policies/[id]/page.tsx)
      // oraz w Server Actions.

      if (pathname.startsWith('/audit')) {
        const allowedRoles = ['AUDITOR', 'ADMIN']
        if (!allowedRoles.includes(role)) {
          return NextResponse.redirect(new URL('/requests', request.url))
        }
      }

    } catch (err) {
      if (!isLoginPage) {
        return NextResponse.redirect(new URL('/login', request.url))
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg).*)'],
}
