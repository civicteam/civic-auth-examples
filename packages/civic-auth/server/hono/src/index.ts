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
  postLogoutRedirectUrl: `http://localhost:${PORT}/`,
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

app.use('*', async (c, next) => {
  const storage = new HonoCookieStorage(c);
  c.set('storage', storage);
  await next();
});

app.get('/', async (c) => {
  const url = await buildLoginUrl(config, c.get('storage'));
  return c.redirect(url.toString());
});

app.get('/auth/callback', async (c) => {
  const code = c.req.query('code') as string
  const state = c.req.query('state') as string

  await resolveOAuthAccessCode(code, state, c.get('storage'), config);
  return c.redirect('/admin/hello');
});

app.get('/auth/logout', async (c) => {
  try {
    const url = await buildLogoutRedirectUrl(config, c.get('storage'));
    return c.redirect(url.toString());
  } catch (error) {
    console.error('Logout error:', error);
    return c.text(`Logout failed: ${error.message}`, 500);
  }
});

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