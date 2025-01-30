import { Context } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import {
  CookieStorage,
  resolveOAuthAccessCode,
  isLoggedIn,
  getUser,
  buildLoginUrl,
  buildLogoutRedirectUrl,
} from '@civic/auth/server';
import "dotenv/config";

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

const config = {
  clientId: process.env.CLIENT_ID!,
  redirectUrl: `http://localhost:${PORT}/auth/callback`,
  postLogoutRedirectUrl: `http://localhost:${PORT}/auth/logoutcallback`
};

class HonoCookieStorage extends CookieStorage {
  constructor(private c: Context) {
    super();
  }

  async get(key: string) {
    return getCookie(this.c, key) ?? null;
  }

  async set(key: string, value: string): void {
    setCookie(this.c, key, value);
  }

  async delete(key: string): void {
    deleteCookie(this.c, key);
  }
}

const app = new Hono();

// Debug middleware to log all cookies
app.use('*', async (c, next) => {
  const storage = new HonoCookieStorage(c);
  c.set('storage', storage);
  await next();
});

// Login endpoint
app.get('/', async (c) => {
  if (await isLoggedIn(c.get('storage'))) {
    return c.redirect('/admin/hello');
  }
  const url = await buildLoginUrl(config, c.get('storage'));
  return c.redirect(url.toString());
});

// Callback endpoint
app.get('/auth/callback', async (c) => {
  const code = c.req.query('code');
  const state = c.req.query('state');

  if (!code || !state) {
    return c.text('Invalid callback parameters', 400);
  }

  try {
    await resolveOAuthAccessCode(code, state, c.get('storage'), config);
  } catch (error) {
    console.error('Error resolving OAuth code:', error);
    return c.text('Authentication error', 500);
  }

  return c.redirect('/admin/hello');
});

// Logout endpoint
app.get('/auth/logout', async (c) => {
  const storage = c.get('storage') as HonoCookieStorage;
  
  const url = await buildLogoutRedirectUrl(config, storage);
  return c.redirect(url.toString());
});

// Logout callback endpoint
app.get('/auth/logoutcallback', async (c) => {
  const storage = c.get('storage') as HonoCookieStorage;
  const authCookies = ['access_token', 'refresh_token', 'id_token', 'code_verifier'];
  for (const cookie of authCookies) {
    await storage.delete(cookie);
  }
  return c.redirect('/');
});

// Auth middleware for admin routes
app.use('/admin/*', async (c, next) => {
  if (!await isLoggedIn(c.get('storage'))) {
    return c.text('Unauthorized', 401);
  }
  return next();
});

// Protected admin route
app.get('/admin/hello', async (c) => {
  const user = await getUser(c.get('storage'));
  return c.html(`
    <html>
      <body>
        <h1>Hello, ${user?.name}!</h1>
        <form action="/auth/logout" method="GET">
          <button type="submit">Logout</button>
        </form>
      </body>
    </html>
  `);
});

serve({
  fetch: app.fetch,
  port: PORT
});

console.log(`Server is running on http://localhost:${PORT}`);