import express, { Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { CookieStorage, CivicAuth, type AuthConfig } from "@civic/auth/server";

import dotenv from "dotenv";

dotenv.config();

import "dotenv/config";

// Type alias for requests with auth properties
type RequestWithAuth = Request & {
  storage?: any;
  civicAuth?: CivicAuth;
};

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3020;

const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",")
  : [
      "http://localhost:5174", // frontend
      "http://localhost:3020", // backend
      "http://127.0.0.1:5174", // frontend on 127.0.0.1
      "http://127.0.0.1:3020", // backend on 127.0.0.1
    ];

// CORS configuration for frontend integration
app.use(
  cors({
    origin: corsOrigins,
    credentials: true, // Allow cookies to be sent cross-origin
    optionsSuccessStatus: 200,
    // Explicitly allow cookie headers
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
    exposedHeaders: ["Set-Cookie"],
  })
);

// Middleware to parse cookies
app.use(cookieParser());

const config: AuthConfig = {
  clientId: process.env.CLIENT_ID!,
  redirectUrl:
    process.env.REDIRECT_URL ?? `http://localhost:3020/auth/callback`, // Use 127.0.0.1 for reliable cookie handling
  oauthServer: process.env.OAUTH_SERVER ?? "https://auth.civic.com/oauth",
  postLogoutRedirectUrl:
    process.env.POST_LOGOUT_REDIRECT_URL ?? `http://localhost:5174`,
  loginSuccessUrl:
    process.env.LOGIN_SUCCESS_URL ?? "http://localhost:3020/admin/hello",
};

// Simple cookie storage for session management
class ExpressCookieStorage extends CookieStorage {
  constructor(private req: Request, private res: Response) {
    // Detect if we're running on HTTPS (ngrok, production) or HTTP (localhost)
    const isHttps = req.secure || req.headers["x-forwarded-proto"] === "https";

    super({
      secure: isHttps, // Use secure cookies for HTTPS (ngrok, production)
      sameSite: isHttps ? "none" : "lax", // none for HTTPS cross-origin, lax for localhost
      httpOnly: false, // Allow frontend JavaScript to access cookies for integration
      path: "/", // Ensure cookies are available for all paths
      // maxAge: 10 * 60 * 1000, // 10 minutes (for debugging)
    });

    console.log("🍪 Cookie settings:", {
      secure: this.settings.secure,
      sameSite: this.settings.sameSite,
      isHttps,
      host: req.headers.host,
      protocol: req.protocol,
    });
  }

  async get(key: string): Promise<string | null> {
    const value = this.req.cookies[key] ?? null;
    return Promise.resolve(value);
  }

  async set(key: string, value: string): Promise<void> {
    this.res.cookie(key, value, this.settings);
    this.req.cookies[key] = value; // Store for immediate access within same request
  }

  async delete(key: string): Promise<void> {
    this.res.clearCookie(key);
  }
}

// Middleware to attach CookieStorage and CivicAuth to each request
app.use((req: Request, res: Response, next: NextFunction) => {
  const authReq = req as RequestWithAuth;
  authReq.storage = new ExpressCookieStorage(req, res);

  // Create and attach the civicAuth instance
  authReq.civicAuth = new CivicAuth(authReq.storage, config);
  next();
});

// Authentication routes

// Login route - redirect to OAuth provider
app.get("/auth/login", async (req: RequestWithAuth, res: Response) => {
  try {
    // ✅ Extract frontend state to preserve display mode information
    const frontendState = req.query.state as string | undefined;

    console.log("🔗 Login endpoint called with state:", frontendState);

    // Pass the frontend state to preserve iframe configuration
    const url = await req.civicAuth!.buildLoginUrl({
      state: frontendState,
    });

    res.redirect(url.toString());
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Failed to initiate login" });
  }
});

// Callback route - handle OAuth callback
app.get("/auth/callback", async (req: RequestWithAuth, res: Response) => {
  console.log("🔑 Callback endpoint called with query:", req.query);
  const { code, state } = req.query as { code: string; state: string };

  console.log(
    "🔑 Callback endpoint called with code:",
    code,
    "and state:",
    state
  );
  try {
    const result = await req.civicAuth!.handleCallback({
      code,
      state,
      req,
    });

    console.log("🔑 Callback result:", result);

    if (result.redirectTo) {
      return res.redirect(result.redirectTo);
    }

    if (result.content) {
      return res.send(result.content);
    }

    res.status(500).json({ error: "Internal server error" });
  } catch (error) {
    console.error("Callback error:", error);
    res.redirect("/?error=auth_failed");
  }
});

// Logout route - build logout URL and redirect
app.get("/auth/logout", async (req: RequestWithAuth, res: Response) => {
  try {
    const urlString = await req.civicAuth!.buildLogoutRedirectUrl();
    await req.civicAuth!.clearTokens();

    // Convert to URL object to modify parameters
    const url = new URL(urlString);

    // Remove the state parameter to avoid it showing up in the frontend URL
    url.searchParams.delete("state");

    res.redirect(url.toString());
  } catch (error) {
    console.error("Logout error:", error);
    // If logout URL generation fails, clear tokens and redirect to home
    await req.civicAuth!.clearTokens();
    res.redirect(config.postLogoutRedirectUrl || "http://localhost:5174");
  }
});

// Refresh route - refresh tokens for frontend integration
app.post("/auth/refresh", async (req: RequestWithAuth, res: Response) => {
  try {
    const isLoggedIn = await req.civicAuth!.isLoggedIn();
    if (!isLoggedIn) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    await req.civicAuth!.refreshTokens();
    res.json({ success: true, message: "Tokens refreshed" });
  } catch (error) {
    res.status(500).json({ error: "Token refresh failed" });
  }
});

// User route - get current user info
app.get("/auth/user", async (req: RequestWithAuth, res: Response) => {
  try {
    const isLoggedIn = await req.civicAuth!.isLoggedIn();

    if (!isLoggedIn) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = await req.civicAuth!.getUser();
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: "Failed to get user" });
  }
});

// Endpoint to trigger redirect to Civic Auth OAuth server
app.get("/", async (req: RequestWithAuth, res: Response) => {
  const url = await req.civicAuth!.buildLoginUrl();

  // Serve our test page instead of auto-redirecting
  res.redirect(url.toString());
});

// Authentication middleware to protect routes
const authMiddleware = async (
  req: RequestWithAuth,
  res: Response,
  next: NextFunction
) => {
  if (!(await req.civicAuth!.isLoggedIn())) {
    return res.status(401).send("Unauthorized");
  }
  next();
};

// Apply authentication middleware to /admin routes
app.use("/admin", authMiddleware);

// Protected route to get logged-in user information
app.get("/admin/hello", async (req: RequestWithAuth, res: Response) => {
  const user = await req.civicAuth!.getUser();
  res.setHeader("Content-Type", "text/html");
  res.send(
    `Hello, ${
      user?.name || user?.email || "User"
    }! logout <a href="/auth/logout">here</a>`
  );
});

app.get("/admin/refresh", async (req: RequestWithAuth, res: Response) => {
  await req.civicAuth!.refreshTokens();
  res.send("Tokens refreshed");
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
