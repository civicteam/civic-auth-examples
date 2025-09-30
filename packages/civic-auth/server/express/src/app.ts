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

const config = {
  clientId: process.env.CLIENT_ID!,
  // oauthServer is not necessary for production.
  oauthServer: process.env.AUTH_SERVER || 'https://auth.civic.com/oauth',
  redirectUrl: `http://localhost:${PORT}/auth/callback`,
  loginSuccessUrl: process.env.LOGIN_SUCCESS_URL || `http://localhost:${PORT}/admin/hello`,
  postLogoutRedirectUrl: `http://localhost:${PORT}/`,
};

class ExpressCookieStorage extends CookieStorage {
  constructor(
    private req: Request,
    private res: Response
  ) {
    // Detect if we're running on HTTPS (production) or HTTP (localhost)
    const isHttps = req.secure || req.headers["x-forwarded-proto"] === "https";

    super({
      secure: isHttps, // Use secure cookies for HTTPS
      sameSite: isHttps ? "none" : "lax", // none for HTTPS cross-origin, lax for localhost
      httpOnly: false, // Allow frontend JavaScript to access cookies
      path: "/", // Ensure cookies are available for all paths
    });
  }

  async get(key: string): Promise<string | null> {
    return this.req.cookies[key] ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    this.res.cookie(key, value, this.settings);
    this.req.cookies[key] = value; // Store for immediate access within same request
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

app.get("/auth/login-url", async (req: Request, res: Response) => {
  const frontendState = req.query.state as string | undefined;

  const url = await req.civicAuth!.buildLoginUrl({
    state: frontendState,
  });
  
  res.redirect(url.toString());
});

app.get("/auth/callback", async (req: Request, res: Response) => {
  const { code, state } = req.query as { code: string; state: string };

  try {
    const result = await req.civicAuth.handleCallback({
      code,
      state,
      req,
    });

    if (result.redirectTo) {
      return res.redirect(result.redirectTo);
    }

    if (result.content) {
      return res.send(result.content);
    }

    res.status(500).json({ error: "Internal server error" });
  } catch (error) {
    res.redirect("/?error=auth_failed");
  }
});

const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!(await req.civicAuth.isLoggedIn())) return res.status(401).send("Unauthorized");
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
  try {
    const urlString = await req.civicAuth.buildLogoutRedirectUrl();
    await req.civicAuth.clearTokens();

    // Convert to URL object to modify parameters
    const url = new URL(urlString);
    // Remove the state parameter to avoid it showing up in the frontend URL
    url.searchParams.delete("state");

    res.redirect(url.toString());
  } catch (error) {
    console.error("Logout error:", error);
    // If logout URL generation fails, clear tokens and redirect to home
    await req.civicAuth.clearTokens();
    res.redirect("/");
  }
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