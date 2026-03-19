import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // 1. Refresh session - Crucial for Server Components
  const { data: { session } } = await supabase.auth.getSession()

  const url = req.nextUrl.clone()
  const isAuthPage = url.pathname.startsWith('/auth')
  const isProtectedRoute = url.pathname.startsWith('/freelancer') || 
                           url.pathname.startsWith('/client') || 
                           url.pathname.startsWith('/api')

  // 2. Redirect Unauthenticated Users
  if (!session && isProtectedRoute && !isAuthPage) {
    url.pathname = '/auth/login'
    url.searchParams.set('redirectedFrom', req.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // 3. Handle Authenticated Users on Auth Pages (Login/Signup)
  if (session && isAuthPage) {
    const role = session.user.user_metadata?.role
    
    // Reality Check: If role is missing, we don't force a dashboard, 
    // we let them through or send them to a default.
    if (role === 'freelancer') {
      url.pathname = '/freelancer/dashboard'
    } else {
      url.pathname = '/client/dashboard'
    }
    return NextResponse.redirect(url)
  }

  // 4. Fallthrough: Let the request proceed to the intended page
  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}