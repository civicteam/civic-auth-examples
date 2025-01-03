import { env } from 'bun';
import {
  Storage,
  CookieStorage,
  resolveOAuthAccessCode,
  isLoggedIn,
  getUser,
  buildLoginUrl,
  buildLogoutRedirectUrl,
  refreshTokens,
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
};

// Map fastify cookies to the Storage interface
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
      path: '/',
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
      this.reply.clearCookie(key);
    }
  }
}

// Register plugins with await
await fastify.register(fastifyCookie, {
  secret: env.COOKIE_SECRET || 'my-secret',
});

// Attach storage to each request
fastify.decorateRequest('storage', null);
fastify.addHook('preHandler', async (request, reply) => {
  request.storage = new FastifyCookieStorage(request, reply);
});

// Authentication hook for protected routes
fastify.addHook('preHandler', async (request, reply) => {
  if (!request.url.includes('/admin')) return;

  const loggedIn = await isLoggedIn(request.storage);
  if (!loggedIn) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }
});

// Routes
fastify.get('/', async (request, reply) => {
  fastify.log.info('Starting login process');
  const url = await buildLoginUrl(config, request.storage);
  fastify.log.info(`Redirecting to: ${url.toString()}`);
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
    return `Hello, ${user?.name}!`;
  } catch (error) {
    fastify.log.error(error);
    return reply.status(500).send({ error: 'Failed to get user info' });
  }
});

fastify.get('/admin/refresh', async (request, reply) => {
  try {
    await refreshTokens(request.storage, config);
    return 'Tokens refreshed';
  } catch (error) {
    fastify.log.error(error);
    return reply.status(500).send({ error: 'Failed to refresh tokens' });
  }
});

// Build the logout URL and redirect to it
fastify.get('/auth/logout', async (request, reply) => {
  const url = await buildLogoutRedirectUrl({
    ...config,
    postLogoutRedirectUrl: `http://localhost:${PORT}/auth/logoutcallback`,
  }, request.storage);
  return reply.redirect(url.toString());
});

// Handle post-logout callback and clear session
fastify.get<{
  Querystring: { state: string }
}>('/auth/logoutcallback', async (request, reply) => {
  const { state } = request.query;
  console.log(`Logout-callback: state=${state}`);
  await request.storage.clear();
  return reply.redirect('/');
});

try {
  await fastify.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`Server is running on http://localhost:${PORT}`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
