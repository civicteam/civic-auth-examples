import { createCivicAuthPlugin } from '@civic/auth/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: process.env.BASE_PATH || '',
  reactStrictMode: true,
};

console.log("CLIENT ID IS", process.env.CLIENT_ID);

const withCivicAuth = createCivicAuthPlugin({
  clientId: `${process.env.CLIENT_ID}`,
  // oauthServer is not necessary for production.
  oauthServer: process.env.AUTH_SERVER || 'https://auth.civic.com/oauth',
  basePath: process.env.BASE_PATH || '',
  // Set the loginSuccessUrl to send your users to a specific route after login. If not set, users will go to the root of your app.
  loginSuccessUrl: process.env.LOGIN_SUCCESS_URL,
});

export default withCivicAuth(nextConfig);