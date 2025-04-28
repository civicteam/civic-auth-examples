import { createCivicAuthPlugin } from "@civic/auth/nextjs"
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

const withCivicAuth = createCivicAuthPlugin({
  clientId: `${process.env.CLIENT_ID || "78f0bf99-cc9a-45b3-b0e9-a9498fb386c7"}`,
  callbackUrl: '/api/myCustomCivicRoute'
});

export default withCivicAuth(nextConfig)