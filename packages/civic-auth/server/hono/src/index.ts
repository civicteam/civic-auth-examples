import { Context } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';
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

  async clear(): Promise<void> {
    const cookies = this.c.req.cookie();
    for (const key in cookies) {
      setCookie(this.c, key, '', { 
        path: '/',
        maxAge: 0,
        expires: new Date(0)
      });
    }
  }
}

const app = new Hono();

// Middleware to attach CookieStorage to each request
app.use('*', async (c, next) => {
  const storage = new HonoCookieStorage(c)
  c.set('storage', storage);
  return next();
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
  const code = c.req.query('code') as string;
  const state = c.req.query('state') as string;

  await resolveOAuthAccessCode(code, state, c.get('storage'), config);
  return c.redirect('/admin/hello');
});

app.get('/auth/logout', async (c) => {
  const url = await buildLogoutRedirectUrl(config, c.get('storage'));
  return c.redirect(url.toString());
});

app.get('/auth/logoutcallback', async (c) => {
  await c.get('storage').clear();
  return c.redirect('/');
});

app.use('/admin/*', async (c, next) => {
  if (!isLoggedIn(c.get('storage'))) return c.text('Unauthorized', 401);
  return next();
});

app.get('/admin/hello', async (c) => {
  const user = await getUser(c.get('storage'));
  return c.html(`
    <html>
      <body>
        <h1>Hello, ${user?.name}!</h1>
        <button onclick="window.location.href='/auth/logout'">Logout</button>
      </body>
    </html>
  `);
});

serve({
  fetch: app.fetch,
  port: PORT,
});

console.log(`Server is running on http://localhost:${PORT}`);