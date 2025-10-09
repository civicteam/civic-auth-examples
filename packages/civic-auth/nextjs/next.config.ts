import { createCivicAuthPlugin } from "@civic/auth/nextjs"
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: process.env.BASE_PATH || '',
  async headers() {
    return [
      {
        // Apply headers to all API routes including auth callback
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Private-Network',
            value: 'true',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
    ];
  },
};

const withCivicAuth = createCivicAuthPlugin({
  clientId: `${process.env.CLIENT_ID}`,
  // oauthServer is not necessary for production.
  oauthServer: process.env.AUTH_SERVER || 'https://auth.civic.com/oauth',
  basePath: process.env.BASE_PATH || '',
  // Set the loginSuccessUrl to send your users to a specific route after login. If not set, users will go to the root of your app.
  // This example app has a custom success route at /customSuccessRoute.
  loginSuccessUrl: process.env.LOGIN_SUCCESS_URL,
});

export default withCivicAuth(nextConfig)
