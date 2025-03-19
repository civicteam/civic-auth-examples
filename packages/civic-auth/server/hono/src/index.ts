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
  redirectUrl: `http://localhost:${PORT}/auth/callback`,
  postLogoutRedirectUrl: `http://localhost:${PORT}/auth/logoutcallback`,
};

class HonoCookieStorage extends CookieStorage {
  constructor(private c: Context) {
    super({
      secure: process.env.NODE_ENV === "production",
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
  if (!c.get('civicAuth').isLoggedIn()) {
    return c.text('Unauthorized', 401);
  }
  await next();
});

app.get('/', async (c) => {
  const url = await c.get('civicAuth').buildLoginUrl();
  return c.redirect(url.toString());
});

app.get('/auth/callback', async (c) => {
  try {
    const code = c.req.query('code') as string;
    const state = c.req.query('state') as string;

    await c.get('civicAuth').resolveOAuthAccessCode(code, state);
    return c.redirect('/admin/hello');
  } catch (error) {
    console.error('Callback error:', error);
    return c.text(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
  }
});

app.get('/auth/logout', async (c) => {
  try {
    const url = await c.get('civicAuth').buildLogoutRedirectUrl();
    return c.redirect(url.toString());
  } catch (error) {
    console.error('Logout error:', error);
    return c.text(`Logout failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
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
    if (!user) return c.redirect("/");
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

serve({
  fetch: app.fetch,
  port: PORT
});

console.log(`Server is running on http://localhost:${PORT}`);
