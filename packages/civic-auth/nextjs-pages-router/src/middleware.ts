import { authMiddleware } from '@civic/auth/nextjs/middleware';
import { NextRequest, NextResponse } from 'next/server';

export default function middleware(request: NextRequest) {
  return authMiddleware()(request);
}

export const config = {
  // include the paths you wish to secure here
  matcher: [
    /*
     * Match all request paths except those starting with:
     * - _next (static files)
     * - api/auth (auth API routes)
     * - favicon.ico, sitemap.xml, robots.txt
     */
    '/((?!_next|api/auth|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
