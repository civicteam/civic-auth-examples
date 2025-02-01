import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import {
  CookieStorage,
  resolveOAuthAccessCode,
  isLoggedIn,
  getUser,
  buildLoginUrl,
  buildLogoutRedirectUrl,
} from '@civic/auth/server';
import dotenv from 'dotenv';

dotenv.config();

import 'dotenv/config';


const app = express();
const PORT = process.env.PORT ?  parseInt(process.env.PORT) : 3000;

app.use(cookieParser());

const config = {
  clientId: process.env.CLIENT_ID!,
  redirectUrl: `http://localhost:${PORT}/auth/callback`,
  postLogoutRedirectUrl: `http://localhost:${PORT}/auth/logoutcallback`,
};

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

  async clear(): Promise<void> {
    for (const key in this.req.cookies) {
      this.res.clearCookie(key);
    }
  }
}

app.use((req: Request, res: Response, next: NextFunction) => {
  req.storage = new ExpressCookieStorage(req, res);
  next();
});

app.get('/', async (req: Request, res: Response) => {
  if (await isLoggedIn(req.storage)) {
    return res.redirect('/admin/hello');
  }
  const url = await buildLoginUrl(config, req.storage);
  res.redirect(url.toString());
});

app.get('/auth/callback', async (req: Request, res: Response) => {
  const { code, state } = req.query as { code: string; state: string };

  await resolveOAuthAccessCode(code, state, req.storage, config);
  res.redirect('/admin/hello');
});

const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  if (!isLoggedIn(req.storage)) return res.status(401).send('Unauthorized');
  next();
};

app.use('/admin', authMiddleware);

app.get('/admin/hello', async (req: Request, res: Response) => {
  const user = await getUser(req.storage);
  res.setHeader('Content-Type', 'text/html');
  res.send(`
    <html>
      <body>
        <h1>Hello, ${user?.name}!</h1>
        <button onclick="window.location.href='/auth/logout'">Logout</button>
      </body>
    </html>
  `);
});

app.get('/auth/logout', async (req: Request, res: Response) => {
  const url = await buildLogoutRedirectUrl(config, req.storage);
  res.redirect(url.toString());
});

app.get('/auth/logoutcallback', async (req: Request, res: Response) => {
  const { state } = req.query as { state: string };
  console.log(`Logout-callback: state=${state}`);
  await req.storage.clear();
  res.redirect('/');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
