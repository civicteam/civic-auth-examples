import express, { Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { CookieStorage, CivicAuth } from "@civic/auth/server";
import dotenv from "dotenv";

dotenv.config();

import "dotenv/config";

// Extend the Express Request type to include our civicAuth property
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

// Add Private Network Access headers to allow OAuth callback from public auth server
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

const config = {
  clientId: process.env.CLIENT_ID!,
  // oauthServer is not necessary for production.
  oauthServer: process.env.AUTH_SERVER || 'https://auth.civic.com/oauth',
  redirectUrl: `http://localhost:${PORT}/auth/callback`,
  loginSuccessUrl: process.env.LOGIN_SUCCESS_URL,
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

  async delete(key: string): Promise<void> {
    this.res.clearCookie(key);
  }
}

app.use((req: Request, res: Response, next: NextFunction) => {
  req.storage = new ExpressCookieStorage(req, res);
  // Create and attach the civicAuth instance
  req.civicAuth = new CivicAuth(req.storage, config);
  next();
});

app.get("/", async (req: Request, res: Response) => {
  const url = await req.civicAuth.buildLoginUrl();
  res.redirect(url.toString());
});

app.get("/auth/callback", async (req: Request, res: Response) => {
  const { code, state } = req.query as { code: string; state: string };

  await req.civicAuth.resolveOAuthAccessCode(code, state);
  const redirectUrl = config.loginSuccessUrl || "/admin/hello";
  res.redirect(redirectUrl);
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
app.use("/customSuccessRoute", authMiddleware);

app.get("/admin/hello", async (req: Request, res: Response) => {
  const user = await req.civicAuth.getUser();
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

app.get("/customSuccessRoute", async (req: Request, res: Response) => {
  const user = await req.civicAuth.getUser();
  res.setHeader("Content-Type", "text/html");
  res.send(`
    <html>
      <body>
        <h1>Hello, ${user?.name}!</h1>
        <p>Custom success route</p>
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
  console.log(`Logout-callback: state=${state}`);
  await req.storage.clear();
  res.redirect("/");
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});