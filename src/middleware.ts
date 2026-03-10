import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Refresh session if expired - required for Server Components
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Optional: Protect routes based on auth status
  // const isAuthPage = req.nextUrl.pathname.startsWith('/auth/')
  // const isProtectedRoute = 
  //   req.nextUrl.pathname.startsWith('/client/') ||
  //   req.nextUrl.pathname.startsWith('/freelancer/') ||
  //   req.nextUrl.pathname.startsWith('/messages/')

  // if (!session && isProtectedRoute) {
  //   const redirectUrl = req.nextUrl.clone()
  //   redirectUrl.pathname = '/auth/login'
  //   redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname)
  //   return NextResponse.redirect(redirectUrl)
  // }

  // if (session && isAuthPage) {
  //   const redirectUrl = req.nextUrl.clone()
  //   // Redirect to appropriate dashboard based on role
  //   redirectUrl.pathname = '/client/dashboard'
  //   return NextResponse.redirect(redirectUrl)
  // }

  return res
}

// Specify which routes should be handled by middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
