import { Context } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import {
  CookieStorage,
  CivicAuth
} from '@civic/auth/server';
import "dotenv/config";

// Type augmentation for Hono Context
declare module 'hono' {
  interface ContextVariableMap {
    storage: HonoCookieStorage;
    civicAuth: CivicAuth;
  }
}

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

const config = {
  clientId: process.env.CLIENT_ID!,
  // oauthServer is not necessary for production.
  oauthServer: process.env.AUTH_SERVER || 'https://auth.civic.com/oauth',
  redirectUrl: `http://localhost:${PORT}/auth/callback`,
  loginSuccessUrl: process.env.LOGIN_SUCCESS_URL,
  postLogoutRedirectUrl: `http://localhost:${PORT}/`,
};

class HonoCookieStorage extends CookieStorage {
  constructor(private c: Context) {
    // Detect if we're running on HTTPS (production) or HTTP (localhost)
    const isHttps = c.req.header('x-forwarded-proto') === 'https' || c.req.url.startsWith('https://');

    super({
      secure: isHttps, // Use secure cookies for HTTPS
      sameSite: isHttps ? "none" : "lax", // none for HTTPS cross-origin, lax for localhost
      httpOnly: false, // Allow frontend JavaScript to access cookies
      path: "/", // Ensure cookies are available for all paths
    });
  }

  async get(key: string): Promise<string | null> {
    return getCookie(this.c, key) ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    setCookie(this.c, key, value, this.settings);
  }

  async delete(key: string): Promise<void> {
    deleteCookie(this.c, key);
  }

  async clear(): Promise<void> {
    // Get all cookies
    const cookieHeader = this.c.req.header('cookie') || '';
    const cookies = cookieHeader.split(';')
      .map(cookie => cookie.trim().split('=')[0])
      .filter(Boolean);
    
    // Delete each cookie
    for (const key of cookies) {
      await this.delete(key);
    }
  }
}

const app = new Hono();

// Add storage and civicAuth to each request
app.use('*', async (c, next) => {
  const storage = new HonoCookieStorage(c);
  c.set('storage', storage);
  c.set('civicAuth', new CivicAuth(storage, config));
  await next();
});

// Auth middleware for /admin routes
app.use('/admin/*', async (c, next) => {
  if (!(await c.get('civicAuth').isLoggedIn())) {
    return c.text('Unauthorized', 401);
  }
  await next();
});

// Auth middleware for /customSuccessRoute
app.use('/customSuccessRoute', async (c, next) => {
  if (!(await c.get('civicAuth').isLoggedIn())) {
    return c.text('Unauthorized', 401);
  }
  await next();
});

app.get('/', async (c) => {
  const url = await c.get('civicAuth').buildLoginUrl();
  return c.redirect(url.toString());
});

app.get('/auth/login-url', async (c) => {
  const frontendState = c.req.query('state');

  const url = await c.get('civicAuth').buildLoginUrl({
    state: frontendState,
  });
  
  return c.redirect(url.toString());
});

app.get('/auth/callback', async (c) => {
  try {
    const code = c.req.query('code') as string;
    const state = c.req.query('state') as string;

    const result = await c.get('civicAuth').handleCallback({
      code,
      state,
      req: c.req.raw as any,
    });

    if (result.redirectTo) {
      return c.redirect(result.redirectTo);
    }

    if (result.content) {
      return c.html(result.content as string);
    }

    return c.json({ error: 'Internal server error' }, 500);
  } catch (error) {
    console.error('Callback error:', error);
    return c.redirect('/?error=auth_failed');
  }
});

app.get('/auth/logout', async (c) => {
  try {
    const urlString = await c.get('civicAuth').buildLogoutRedirectUrl();
    await c.get('civicAuth').clearTokens();

    // Convert to URL object to modify parameters
    const url = new URL(urlString);
    // Remove the state parameter to avoid it showing up in the frontend URL
    url.searchParams.delete('state');

    return c.redirect(url.toString());
  } catch (error) {
    console.error('Logout error:', error);
    // If logout URL generation fails, clear tokens and redirect to home
    await c.get('civicAuth').clearTokens();
    return c.redirect('/');
  }
});

app.get('/auth/logoutcallback', async (c) => {
  try {
    const state = c.req.query('state');
    console.log(`Logout-callback: state=${state}`);
    await c.get('storage').clear();
    return c.redirect('/');
  } catch (error) {
    console.error('Logout callback error:', error);
    return c.text(`Logout callback failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
  }
});

app.get('/admin/hello', async (c) => {
  try {
    const user = await c.get('civicAuth').getUser();
    return c.html(`
      <html>
        <body>
          <h1>Hello, ${user?.name}!</h1>
          <button onclick="window.location.href='/auth/logout'">Logout</button>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Failed to get user info:', error);
    return c.text(`Failed to get user info: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
  }
});

app.get('/customSuccessRoute', async (c) => {
  try {
    const user = await c.get('civicAuth').getUser();
    return c.html(`
      <html>
        <body>
          <h1>Hello, ${user?.name}!</h1>
          <p>Custom success route</p>
          <button onclick="window.location.href='/auth/logout'">Logout</button>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Failed to get user info:', error);
    return c.text(`Failed to get user info: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
  }
});

serve({
  fetch: app.fetch,
  port: PORT
});

console.log(`Server is running on http://localhost:${PORT}`);