// For Pages Router, we need to adapt the App Router handler
// This follows the "any backend" approach where we handle auth manually
import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Since we're following the "any backend" approach, we might need to implement
  // the OAuth flow manually or find a way to adapt the App Router handler
  
  // For now, let's try to use the existing handler if it can work with Pages Router
  try {
    // Import the handler from civic auth
    const { handler: civicHandler } = await import('@civic/auth/nextjs')
    
    // The App Router handler returns a Response object, but Pages Router expects
    // us to use res.json(), res.redirect(), etc.
    // This might be where we need to identify gaps
    
    const routeHandler = civicHandler()
    
    // Try to call the handler and see what happens
    const response = await routeHandler(req as any)
    
    // Convert Response to NextApiResponse
    if (response.status === 302) {
      const location = response.headers.get('location')
      if (location) {
        res.redirect(302, location)
        return
      }
    }
    
    const data = await response.text()
    res.status(response.status).send(data)
    
  } catch (error) {
    console.error('Auth handler error:', error)
    res.status(500).json({ error: 'Authentication failed' })
  }
}