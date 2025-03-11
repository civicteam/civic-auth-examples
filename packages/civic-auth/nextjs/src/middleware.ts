import { authMiddleware } from '@civic/auth/nextjs/middleware'

export default authMiddleware();

export const config = {
  // include the paths you wish to secure here
  matcher: [
    /*
     * Match all request paths except those starting with:
     * - _next (static files)
     * - favicon.ico, sitemap.xml, robots.txt
     */
    '/((?!_next|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}