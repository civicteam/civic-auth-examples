import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import {
  CookieStorage,
  resolveOAuthAccessCode,
  isLoggedIn,
  getUser,
  buildLoginUrl,
} from '@civic/auth/server';
import dotenv from 'dotenv';

dotenv.config();

import 'dotenv/config';


const app = express();
const PORT = process.env.PORT ?  parseInt(process.env.PORT) : 3000;

// Middleware to parse cookies
app.use(cookieParser());

const config = {
  clientId: process.env.CLIENT_ID!,
  redirectUrl: `http://localhost:${PORT}/auth/callback`,
};

// Tell Civic how to get cookies from your node server
class ExpressCookieStorage extends CookieStorage {
  constructor(private req: Request, private res: Response) {
    super({
      secure: process.env.NODE_ENV === "production",
    });
  }

  async get(key: string): Promise<string | null> {
    return this.req.cookies[key];
  }

  async set(key: string, value: string): Promise<void> {
    this.res.cookie(key, value, this.settings);
  }
}

// Middleware to attach CookieStorage to each request
app.use((req: Request, res: Response, next: NextFunction) => {
  req.storage = new ExpressCookieStorage(req, res);
  next();
});

// Endpoint to trigger redirect to Civic Auth OAuth server
app.get('/', async (req: Request, res: Response) => {
  const url = await buildLoginUrl(config, req.storage);

  res.redirect(url.toString());
});

// Endpoint to handle OAuth callback and resolve access code
app.get('/auth/callback', async (req: Request, res: Response) => {
  const { code, state } = req.query as { code: string; state: string };

  // Resolve OAuth access code and set session
  await resolveOAuthAccessCode(code, state, req.storage, config);
  res.redirect('/admin/hello');
});

// Authentication middleware to protect routes
const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  if (!isLoggedIn(req.storage)) return res.status(401).send('Unauthorized');
  next();
};

// Apply authentication middleware to any routes that need it
app.use('/admin', authMiddleware);

// Get the logged-in user information.
app.get('/admin/hello', async (req: Request, res: Response) => {
  const user = await getUser(req.storage);
  res.send(`Hello, ${user?.name}!`);
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
