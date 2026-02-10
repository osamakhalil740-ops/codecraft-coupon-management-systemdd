import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/profile',
  '/stores/create',
  '/coupons/create',
  '/admin',
];

// Routes that require specific roles
const roleRoutes = {
  '/admin': ['SUPER_ADMIN'],
  '/stores/create': ['STORE_OWNER', 'SUPER_ADMIN'],
  '/stores/manage': ['STORE_OWNER', 'SUPER_ADMIN'],
  '/affiliate': ['AFFILIATE', 'SUPER_ADMIN'],
};

// Public routes (no authentication required)
const publicRoutes = [
  '/',
  '/auth/login',
  '/auth/register',
  '/auth/verify-email',
  '/auth/reset-password',
  '/auth/forgot-password',
  '/marketplace',
  '/stores',
  '/coupons',
];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Enforce HTTPS in production
  if (
    process.env.NODE_ENV === 'production' &&
    request.headers.get('x-forwarded-proto') !== 'https'
  ) {
    return NextResponse.redirect(
      `https://${request.headers.get('host')}${pathname}`,
      301
    );
  }

  // Get token from request
  let token;
  try {
    token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET,
    });
  } catch (error) {
    // If token parsing fails, continue without authentication
    console.error('Token parsing failed:', error);
    token = null;
  }

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  // Create response with security headers
  let response = NextResponse.next();

  // Security headers
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // CSRF Protection - Add token to response headers
  if (token) {
    response.headers.set('X-User-Id', token.userId as string);
  }

  // Redirect to login if accessing protected route without authentication
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check role-based access
  for (const [route, allowedRoles] of Object.entries(roleRoutes)) {
    if (pathname.startsWith(route)) {
      if (!token) {
        const loginUrl = new URL('/auth/login', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
      }

      const userRole = token.role as string;
      if (!allowedRoles.includes(userRole)) {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
    }
  }

  // Check if user is active
  if (token && !token.isActive) {
    // Clear session and redirect to login
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('error', 'AccountDisabled');
    response = NextResponse.redirect(loginUrl);
    response.cookies.delete('next-auth.session-token');
    response.cookies.delete('next-auth.csrf-token');
    return response;
  }

  // Redirect authenticated users away from auth pages
  if (token && pathname.startsWith('/auth/')) {
    const publicAuthPages = ['/auth/verify-email', '/auth/reset-password'];
    const isPublicAuthPage = publicAuthPages.some((page) => pathname.startsWith(page));
    
    if (!isPublicAuthPage) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (handled separately)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, robots.txt, sitemap.xml, manifest.json
     * - public folder assets (icons, images, etc.)
     * - service worker and PWA files
     */
    '/((?!api|_next/static|_next/image|favicon\\.ico|favicon\\.svg|robots\\.txt|sitemap\\.xml|manifest\\.json|icons/|sw\\.js|service-worker\\.js|workbox-.*\\.js|offline\\.html|.*\\.css|.*\\.js$).*)',
  ],
};
