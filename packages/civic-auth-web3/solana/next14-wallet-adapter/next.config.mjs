import { createCivicAuthPlugin } from "@civic/auth-web3/nextjs";
/** @type {import('next').NextConfig} */
const nextConfig = {};

const withCivicAuth = createCivicAuthPlugin({
  clientId: process.env.CLIENT_ID,
  enableSolanaWalletAdapter: true,
});

export default withCivicAuth(nextConfig);
