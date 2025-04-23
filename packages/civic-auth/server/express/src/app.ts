import express, { Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { CookieStorage, CivicAuth } from "@civic/auth/server";
import dotenv from "dotenv";

dotenv.config();

// Extend the Express Request type
declare global {
  namespace Express {
    interface Request {
      storage: ExpressCookieStorage;
      civicAuth: CivicAuth;
    }
  }
}

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(cookieParser());

const config = {
  clientId: process.env.CLIENT_ID!,
  oauthServer: process.env.AUTH_SERVER!,
  redirectUrl: `http://localhost:${PORT}/auth/callback`,
  postLogoutRedirectUrl: `http://localhost:${PORT}/`,
};

class ExpressCookieStorage extends CookieStorage {
  constructor(
    private req: Request,
    private res: Response
  ) {
    super({
      secure: process.env.NODE_ENV === "production",
    });
  }

  async get(key: string): Promise<string | null> {
    return Promise.resolve(this.req.cookies[key] ?? null);
  }

  async set(key: string, value: string): Promise<void> {
    this.res.cookie(key, value, this.settings);
  }
  
  async clear(): Promise<void> {
    for (const key in this.req.cookies) {
      this.res.clearCookie(key);
    }
  }

  async delete(key: string): Promise<void> {
    this.res.clearCookie(key);
  }
}

app.use((req: Request, res: Response, next: NextFunction) => {
  req.storage = new ExpressCookieStorage(req, res);
  req.civicAuth = new CivicAuth(req.storage, config);
  next();
});

app.get('/', async (req: Request, res: Response) => {
  const url = await req.civicAuth.buildLoginUrl();

  res.redirect(url.toString());
});

app.get('/auth/callback', async (req: Request, res: Response) => {
  const { code, state } = req.query as { code: string; state: string };

  await req.civicAuth.resolveOAuthAccessCode(code, state);
  res.redirect('/admin/hello');
});

const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.civicAuth.isLoggedIn()) return res.status(401).send("Unauthorized");
  next();
};

app.use("/admin", authMiddleware);

app.get("/admin/hello", async (req: Request, res: Response) => {
  const user = await req.civicAuth.getUser();
  if (!user) return res.redirect("/");

  res.setHeader("Content-Type", "text/html");
  res.send(`
    <html>
      <body>
        <h1>Hello, ${user?.name}!</h1>
        <button onclick="window.location.href='/auth/logout'">Logout</button>
      </body>
    </html>
  `);
});

app.get("/auth/logout", async (req: Request, res: Response) => {
  const url = await req.civicAuth.buildLogoutRedirectUrl();
  res.redirect(url.toString());
});

app.get("/auth/logoutcallback", async (req: Request, res: Response) => {
  const { state } = req.query as { state: string };
  await req.storage.clear();
  res.redirect("/");
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});