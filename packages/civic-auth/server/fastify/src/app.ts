import { env } from 'bun';
import {
  CookieStorage,
  CivicAuth
} from '@civic/auth/server';
import Fastify, { FastifyReply, FastifyRequest } from 'fastify';
import fastifyCookie from '@fastify/cookie';
import dotenv from 'dotenv';

dotenv.config();

// Extend Fastify types to include our storage and civicAuth properties
declare module 'fastify' {
  export interface FastifyRequest {
    storage: CookieStorage;
    civicAuth: CivicAuth;
  }
}

const fastify = Fastify({ 
  logger: true,
  disableRequestLogging: false
});

const PORT = env.PORT ? parseInt(env.PORT) : 3000;

const config = {
  clientId: process.env.CLIENT_ID!,
  // oauthServer is not necessary for production.
  oauthServer: process.env.AUTH_SERVER || 'https://auth.civic.com/oauth',
  loginSuccessUrl: process.env.LOGIN_SUCCESS_URL,
  redirectUrl: `http://localhost:${PORT}/auth/callback`,
  postLogoutRedirectUrl: `http://localhost:${PORT}/`,
};

class FastifyCookieStorage extends CookieStorage {
  constructor(private request: FastifyRequest, private reply: FastifyReply) {
    super({
      secure: process.env.NODE_ENV === "production",
    });
  }

  async get(key: string): Promise<string | null> {
    const value = this.request.cookies[key];
    fastify.log.info({ action: 'get_cookie', key, value });
    return value ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    fastify.log.info({ action: 'set_cookie', key, valueLength: value.length });
    const cookieOptions = {
      ...this.settings,
      path: '/'
    };
    
    try {
      this.reply.setCookie(key, value, cookieOptions);
      fastify.log.info(`Cookie ${key} set successfully`);
    } catch (error) {
      fastify.log.error(`Error setting cookie ${key}:`, error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    const cookies = this.request.cookies;
    for (const key in cookies) {
      this.reply.clearCookie(key, { path: '/' });
    }
  }

  async delete(key: string): Promise<void> {
    this.reply.clearCookie(key, { path: '/' });
  }
}

await fastify.register(fastifyCookie, {
  secret: env.COOKIE_SECRET || "my-secret"
});

// Add Private Network Access headers to allow OAuth callback from public auth server
fastify.addHook('onRequest', async (request, reply) => {
  reply.header('Access-Control-Allow-Private-Network', 'true');
  reply.header('Access-Control-Allow-Origin', '*');
});

// Decorate request with storage and civicAuth
fastify.decorateRequest('storage', null);
fastify.decorateRequest('civicAuth', null);

// Add storage and civicAuth to each request
fastify.addHook('preHandler', async (request, reply) => {
  request.storage = new FastifyCookieStorage(request, reply);
  request.civicAuth = new CivicAuth(request.storage, config);
});

// Auth middleware for /admin routes and /customSuccessRoute
fastify.addHook('preHandler', async (request, reply) => {
  if (!request.url.includes('/admin') && !request.url.includes('/customSuccessRoute')) return;

  if (!request.civicAuth.isLoggedIn()) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }
});

fastify.get('/', async (request, reply) => {
  const url = await request.civicAuth.buildLoginUrl();
  return reply.redirect(url.toString());
});

fastify.get<{
  Querystring: { code: string; state: string };
}>('/auth/callback', async (request, reply) => {
  try {
    fastify.log.info('Received callback with code');
    const { code, state } = request.query;
    fastify.log.info(`Processing OAuth callback - Code: ${code}, State: ${state}`);

    await request.civicAuth.resolveOAuthAccessCode(code, state);
    fastify.log.info('OAuth code resolved successfully');

    const redirectUrl = config.loginSuccessUrl || '/admin/hello';
    return reply.redirect(redirectUrl);
  } catch (error) {
    fastify.log.error('Callback error:', error);
    return reply.status(500).send({ 
      error: 'Authentication failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

fastify.get('/admin/hello', async (request, reply) => {
  try {
    const user = await request.civicAuth.getUser();
    reply.type('text/html');
    return `
      <html>
        <body>
          <h1>Hello, ${user?.name}!</h1>
          <button onclick="window.location.href='/auth/logout'">Logout</button>
        </body>
      </html>
    `;
  } catch (error) {
    fastify.log.error('Failed to get user info', error);
  }
});

fastify.get('/customSuccessRoute', async (request, reply) => {
  try {
    const user = await request.civicAuth.getUser();
    reply.type('text/html');
    return `
      <html>
        <body>
          <h1>Hello, ${user?.name}!</h1>
          <p>Custom success route</p>
          <button onclick="window.location.href='/auth/logout'">Logout</button>
        </body>
      </html>
    `;
  } catch (error) {
    fastify.log.error('Failed to get user info', error);
  }
});

fastify.get('/auth/logout', async (request, reply) => {
  try {
    const url = await request.civicAuth.buildLogoutRedirectUrl();
    return reply.redirect(url.toString());
  } catch (error) {
    fastify.log.error('Logout error:', error);
    throw error;
  }
});

fastify.get<{
  Querystring: { state: string };
}>('/auth/logoutcallback', async (request, reply) => {
  try {
    const { state } = request.query;
    fastify.log.info(`Logout callback - state: ${state}`);
    await request.storage.clear();
    return reply.redirect('/');
  } catch (error) {
    fastify.log.error('Logout callback error:', error);
  }
});

try {
  await fastify.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`Server is running on http://localhost:${PORT}`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}