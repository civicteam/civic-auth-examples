import express, { Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { CookieStorage, CivicAuth } from "@civic/auth/server";
import dotenv from "dotenv";

dotenv.config();

import "dotenv/config";
import { getWallets } from "@civic/auth-web3/server";
import { UserDetails } from "node_modules/@civic/auth-web3/dist/types.js";
import { BaseUser } from "node_modules/@civic/auth/dist/types.js";


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
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

app.use(cookieParser());

const config = {
  clientId: process.env.CLIENT_ID!,
  // oauthServer is not necessary for production.
  oauthServer: process.env.AUTH_SERVER || 'https://auth.civic.com/oauth',
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

  try {
    await req.civicAuth.resolveOAuthAccessCode(code, state);
    res.redirect("/admin/dashboard");
  } catch (error) {
    console.error("Error during authentication or wallet creation:", error);
    res.status(500).send("Authentication or wallet creation failed");
  }
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

app.get("/admin/dashboard", async (req: Request, res: Response) => {
  const user = await req.civicAuth.getUser();
  const tokens = await req.civicAuth.getTokens();
  const userDetails = {
    ...user as BaseUser & UserDetails & { idToken: string },
    idToken: tokens?.idToken || "",
  };

  if (!user) return res.status(401).send("Unathorized");

  console.log("Creating wallet for authenticated user...", userDetails);
  const wallets = await getWallets(userDetails);
  console.log("Wallet creation completed successfully");
  
  res.setHeader("Content-Type", "text/html");
  res.send(`
    <html>
      <head>
        <title>Civic Auth + Wallet Dashboard</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .container { max-width: 600px; margin: 0 auto; }
          .success { color: #28a745; }
          .info { color: #17a2b8; }
          button { padding: 10px 20px; margin: 10px 0; cursor: pointer; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🎉 Welcome, ${user?.name}!</h1>
          <div class="success">
            <p>✅ Authentication successful</p>
            <p>✅ Wallet created/verified on backend</p>
            <p>✅ Wallets: ${wallets.map((wallet) => wallet.walletAddress).join(", ")}</p>
          </div>
          <div class="info">
            <h3>User Details:</h3>
            <p><strong>Name:</strong> ${user?.name}</p>
            <p><strong>Email:</strong> ${user?.email || 'Not provided'}</p>
          </div>
          <p>Your wallet has been automatically created and is ready to use!</p>
          <button onclick="window.location.href='/auth/logout'">Logout</button>
        </div>
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
  console.log(`🚀 Civic Auth + Wallet Server is running on http://localhost:${PORT}`);
  console.log(`📝 Make sure to set your CLIENT_ID in the environment variables`);
}); 