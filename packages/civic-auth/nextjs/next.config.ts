import { createCivicAuthPlugin } from "@civic/auth/nextjs"
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

const withCivicAuth = createCivicAuthPlugin({
  // oauthServer: `${process.env.AUTH_SERVER}`,
  clientId: `${process.env.CLIENT_ID}`
});

export default withCivicAuth(nextConfig)