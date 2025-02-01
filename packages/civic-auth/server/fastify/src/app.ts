import { env } from 'bun';
import {
  Storage,
  CookieStorage,
  resolveOAuthAccessCode,
  isLoggedIn,
  getUser,
  buildLoginUrl,
  refreshTokens,
  buildLogoutRedirectUrl,
} from '@civic/auth/server';
import Fastify, { FastifyReply, FastifyRequest } from 'fastify';
import fastifyCookie from '@fastify/cookie';

declare module 'fastify' {
  export interface FastifyRequest {
    storage: Storage;
  }
}

const fastify = Fastify({ 
  logger: true,
  disableRequestLogging: false
});

const PORT = env.PORT ? parseInt(env.PORT) : 3000;

const config = {
  clientId: process.env.CLIENT_ID!,
  redirectUrl: `http://localhost:${PORT}/auth/callback`,
  postLogoutRedirectUrl: `http://localhost:${PORT}/auth/logoutcallback`,
};

class FastifyCookieStorage extends CookieStorage {
  constructor(private request: FastifyRequest, private reply: FastifyReply) {
    super({
      secure: false, // Set to true in production
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
}

await fastify.register(fastifyCookie, {
  secret: env.COOKIE_SECRET || "my-secret"
});

fastify.decorateRequest('storage', null);
fastify.addHook('preHandler', async (request, reply) => {
  request.storage = new FastifyCookieStorage(request, reply);
});

fastify.addHook('preHandler', async (request, reply) => {
  if (!request.url.includes('/admin')) return;

  const loggedIn = await isLoggedIn(request.storage);
  if (!loggedIn) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }
});

fastify.get('/', async (request, reply) => {
  if (await isLoggedIn(request.storage)) {
    return reply.redirect('/admin/hello');
  }
  const url = await buildLoginUrl(config, request.storage);
  return reply.redirect(url.toString());
});

fastify.get<{
  Querystring: { code: string; state: string };
}>('/auth/callback', async (request, reply) => {
  try {
    fastify.log.info('Received callback with code');
    const { code, state } = request.query;
    fastify.log.info(`Processing OAuth callback - Code: ${code}, State: ${state}`);

    await resolveOAuthAccessCode(code, state, request.storage, config);
    fastify.log.info('OAuth code resolved successfully');

    return reply.redirect('/admin/hello');
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
    const user = await getUser(request.storage);
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

fastify.get('/admin/refresh', async (request, reply) => {
  try {
    await refreshTokens(request.storage, config);
    return 'Tokens refreshed';
  } catch (error) {
    fastify.log.error('Refresh error:', error);
  }
});

fastify.get('/auth/logout', async (request, reply) => {
  try {
    const url = await buildLogoutRedirectUrl(config, request.storage);
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