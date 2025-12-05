// For Pages Router, we implement the "any backend" approach manually
// using the CivicAuth class from @civic/auth/server
import { NextApiRequest, NextApiResponse } from 'next'
import { CivicAuth, CookieStorage } from "@civic/auth/server";

// NextJS-specific CookieStorage implementation for API routes
class NextJSApiCookieStorage extends CookieStorage {
  constructor(
    private req: NextApiRequest,
    private res: NextApiResponse
  ) {
    super({
      secure: process.env.NODE_ENV === "production",
    });
  }

  async get(key: string): Promise<string | null> {
    return this.req.cookies[key] || null;
  }

  async set(key: string, value: string): Promise<void> {
    const cookieValue = `${key}=${value}; Path=/; HttpOnly; SameSite=Lax${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
    console.log('Setting cookie:', cookieValue);
    
    // Handle multiple cookies by getting existing Set-Cookie headers
    const existingCookies = this.res.getHeader('Set-Cookie') || [];
    const cookies: string[] = Array.isArray(existingCookies) 
      ? existingCookies.map(c => String(c))
      : [String(existingCookies)];
    cookies.push(cookieValue);
    this.res.setHeader('Set-Cookie', cookies);
  }

  async clear(): Promise<void> {
    // Clear all cookies - in a real implementation you'd track which cookies to clear
    const cookieNames = Object.keys(this.req.cookies);
    const clearCookies = cookieNames.map(name => `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`);
    this.res.setHeader('Set-Cookie', clearCookies);
  }

  async delete(key: string): Promise<void> {
    this.res.setHeader('Set-Cookie', `${key}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`);
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Create NextJS-specific storage implementation
    const storage = new NextJSApiCookieStorage(req, res);

    // Create auth config
    const authConfig = {
      clientId: process.env.NEXT_PUBLIC_CIVIC_CLIENT_ID!,
      redirectUrl: `http://localhost:3001/api/auth/callback`,
      postLogoutRedirectUrl: `http://localhost:3001/`,
    };

    // Create CivicAuth instance
    const civicAuth = new CivicAuth(storage, authConfig);
    
    // Extract the route path from the dynamic route
    const { civicauth } = req.query;
    const route = Array.isArray(civicauth) ? civicauth.join('/') : civicauth;
    
    switch (route) {
      case 'callback':
        // Handle OAuth callback
        console.log('Handling callback with params:', { code: req.query.code, state: req.query.state });
        const user = await civicAuth.handleCallback({
          req,
          code: req.query.code as string,
          state: req.query.state as string,
        });
        console.log('Callback result user:', user);
        if (user) {
          res.redirect(302, '/');
        } else {
          res.status(400).json({ error: 'Authentication failed' });
        }
        break;
        
      case 'logout':
        // Handle logout - clear cookies and redirect
        await storage.clear();
        res.redirect(302, authConfig.postLogoutRedirectUrl);
        break;
        
      default:
        res.status(404).json({ error: 'Not found' });
    }
    
  } catch (error) {
    console.error('Auth handler error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}