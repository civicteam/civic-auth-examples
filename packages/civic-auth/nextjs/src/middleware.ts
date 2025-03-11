import { authMiddleware } from '@civic/auth/nextjs/middleware';
import { NextRequest } from 'next/server';

// Create a custom middleware wrapper function for debugging
const customMiddleware = (req: NextRequest) => {
  // Log headers and cookies
  console.log('Auth headers:', JSON.stringify(req.headers));
  console.log('Auth cookies:', req.cookies);
  
  // Then call the original auth middleware
  return authMiddleware()(req);
};

export default customMiddleware;

export const config = {
  matcher: [
    '/((?!_next|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};