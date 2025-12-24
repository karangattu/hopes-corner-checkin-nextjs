import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { hasAccess, getDefaultPath, type UserRole } from '@/lib/supabase/roles';

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/offline.html', '/service-worker.js'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/service-worker.js' ||
    pathname.includes('.') // static files
  ) {
    return NextResponse.next();
  }

  // Check if it's a public route
  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // Update session and get user
  const { user, supabaseResponse } = await updateSession(request);
  const role = (user?.user_metadata?.role as UserRole | undefined) || 'checkin';

  // If not authenticated and trying to access protected route
  if (!user && !isPublicRoute) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);

    // Create redirect response
    const response = NextResponse.redirect(loginUrl);
    // Copy cookies from supabaseResponse to ensure session is cleared if needed
    supabaseResponse.cookies.getAll().forEach(cookie => {
      response.cookies.set(cookie.name, cookie.value, cookie);
    });
    return response;
  }

  // If authenticated and trying to access login page, redirect to default
  if (user && pathname === '/login') {
    const redirectPath = getDefaultPath(role);
    if (redirectPath !== pathname) {
      const response = NextResponse.redirect(new URL(redirectPath, request.url));
      // Copy cookies from supabaseResponse (important for session update)
      supabaseResponse.cookies.getAll().forEach(cookie => {
        response.cookies.set(cookie.name, cookie.value, cookie);
      });
      return response;
    }
  }

  // Check role-based access for protected routes
  if (user && !isPublicRoute) {
    const hasRouteAccess = hasAccess(role, pathname);

    // Root path redirects to check-in
    if (pathname === '/') {
      const response = NextResponse.redirect(new URL('/check-in', request.url));
      supabaseResponse.cookies.getAll().forEach(cookie => {
        response.cookies.set(cookie.name, cookie.value, cookie);
      });
      return response;
    }

    // If user doesn't have access, redirect to their default page
    if (!hasRouteAccess) {
      const defaultPath = getDefaultPath(role);
      if (defaultPath !== pathname) {
        const response = NextResponse.redirect(new URL(defaultPath, request.url));
        supabaseResponse.cookies.getAll().forEach(cookie => {
          response.cookies.set(cookie.name, cookie.value, cookie);
        });
        return response;
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (manifest.json, icons, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json)$).*)',
  ],
};
