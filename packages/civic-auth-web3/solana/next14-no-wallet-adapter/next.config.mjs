import { createCivicAuthPlugin } from "@civic/auth-web3/nextjs";
/** @type {import('next').NextConfig} */
const nextConfig = {};

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

const withCivicAuth = createCivicAuthPlugin({
  oauthServer: `${process.env.AUTH_SERVER}`,
  clientId: `${process.env.CLIENT_ID}`,
  redirectUrl: `http://localhost:${PORT}/api/auth/callback`,
  postLogoutRedirectUrl: `http://localhost:${PORT}/`,
});

export default withCivicAuth(nextConfig);
