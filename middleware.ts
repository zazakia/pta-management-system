import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database } from '@/lib/supabase/types';

const protectedRoutes = '/dashboard';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const res = NextResponse.next();
  
  // Create a Supabase client configured to use cookies
  const supabase = createMiddlewareClient<Database>({ req: request, res });

  // Refresh session if expired - required for Server Components
  const { data: { session } } = await supabase.auth.getSession();

  const isProtectedRoute = pathname.startsWith(protectedRoutes);

  // If accessing protected route without session, redirect to login
  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  // If accessing auth pages with session, redirect to dashboard
  if (session && (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up'))) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return res;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
  runtime: 'nodejs'
};
