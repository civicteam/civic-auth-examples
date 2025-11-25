/** @type {import('next').NextConfig} */
import { createCivicAuthPlugin } from "@civic/auth/nextjs";

const nextConfig = {};

const withCivicAuth = createCivicAuthPlugin({
  clientId: process.env.CLIENT_ID || "demo-client-1",
  oauthServer: process.env.AUTH_SERVER || "https://auth.civic.com/oauth",
  disableRefresh: false,
});

export default withCivicAuth(nextConfig);
