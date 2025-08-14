import { createCivicAuthPlugin } from "@civic/auth-web3/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

const withCivicAuth = createCivicAuthPlugin({
  clientId: `${process.env.CLIENT_ID}`,
  // oauthServer and wallet are not necessary for production.
  oauthServer: process.env.AUTH_SERVER || 'https://auth.civic.com/oauth',
  // @ts-ignore - endpoints is valid at runtime but not in types
  endpoints: { wallet: process.env.NEXT_PUBLIC_WALLET_API_BASE_URL }
});

export default withCivicAuth(nextConfig);
