import type { AuthStorage } from '@civic/auth';
import {
  CookieStorage,
  resolveOAuthAccessCode,
  isLoggedIn,
  getUser,
  buildLoginUrl,
  buildLogoutRedirectUrl,
  refreshTokens
} from '@civic/auth/server';
import { serve } from '@hono/node-server';
import { type Context, Hono } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';
import "dotenv/config";

type Variables = { storage: AuthStorage };

export const app = new Hono<{ Variables: Variables }>();
const PORT = process.env.PORT ?  parseInt(process.env.PORT) : 3000;

const config = {
  clientId: process.env.CLIENT_ID!,
  redirectUrl: `http://localhost:${PORT}/auth/callback`,
  oauthServer: process.env.OAUTH_SERVER ?? "https://auth.civic.com/oauth",
}

// Map hono cookies to the CookieStorage interface
class HonoCookieStorage extends CookieStorage {
  constructor(private c: Context) {
    super();
  }

  async get(key: string): Promise<string | null> {
    return Promise.resolve(getCookie(this.c, key) ?? null);
  }

  async set(key: string, value: string): Promise<void> {
    setCookie(this.c, key, value);
  }
}

// Middleware to attach CookieStorage to each request
app.use('*', async (c, next) => {
  const storage = new HonoCookieStorage(c)
  c.set('storage', storage);
  return next();
});

// Endpoint to trigger redirect to Civic Auth OAuth server
app.get('/', async (c) => {
  const url = await buildLoginUrl(config, c.get('storage'));

  return c.redirect(url.toString());
});

// Endpoint to handle OAuth callback and resolve access code
app.get('/auth/callback', async (c) => {
  const code = c.req.query('code') as string
  const state = c.req.query('state') as string

  // Resolve OAuth access code and set session
  await resolveOAuthAccessCode(code, state, c.get('storage'), config);
  return c.redirect('/admin/hello');
});

// Authentication middleware to protect routes
// Apply to /admin routes
app.use('/admin/*', async (c, next) => {
  if (!(await isLoggedIn(c.get('storage')))) return c.text('Unauthorized', 401);

  return next();
});

// Protected route to get logged-in user information
app.get('/admin/hello', async (c) => {
  const user = await getUser(c.get('storage'));
  return c.text(`Hello, ${user?.name}!`);
});

app.get('/admin/refresh', async (c) => {
  await refreshTokens(c.get('storage'), config);
  c.text('Tokens refreshed');
});

// Build the logout URL and redirect to it
app.get('/auth/logout', async (c) => {
  const url = await buildLogoutRedirectUrl({
    ...config,
    postLogoutRedirectUrl: `http://localhost:${PORT}/auth/logoutcallback`,
  }, c.get('storage'));
  return c.redirect(url.toString());
});

// Handle post-logout callback and clear session
app.get('/auth/logoutcallback', async (c) => {
  const state = c.req.query('state');
  console.log(`Logout-callback: state=${state}`);

  // clear all cookies
  const allCookies = getCookie(c);
  for (const key in allCookies) {
    setCookie(c, key, '', { maxAge: 0 });
  }

  return c.redirect('/');
});

serve({
  fetch: app.fetch,
  port: PORT,
});

console.log(`Server is running on http://localhost:${PORT}`);
