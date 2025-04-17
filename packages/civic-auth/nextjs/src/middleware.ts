import { authMiddleware } from '@civic/auth/nextjs/middleware'

export default authMiddleware();

export const config = {
  // include the paths you wish to secure here
  matcher: [
    '/authenticated',
  ],
}
