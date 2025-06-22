import { type NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

const protectedRoutes = ['/dashboard', '/client-dashboard', '/freelancer-dashboard', '/tasks', '/find-freelancers', '/one-percent-club', '/build-together'];

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.some((prefix) => path.startsWith(prefix));

  const session = await getSession();

  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }

  if (session) {
    const dashboardUrl = session.role === 'client' ? '/client-dashboard' : '/freelancer-dashboard';

    // If logged in, redirect from auth pages or generic dashboard to the specific dashboard
    if (path.startsWith('/login') || path.startsWith('/signup') || path === '/dashboard') {
      return NextResponse.redirect(new URL(dashboardUrl, req.nextUrl));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
