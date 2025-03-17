import { createCivicAuthPlugin } from "@civic/auth-web3/nextjs";
const nextConfig = {};

const withCivicAuth = createCivicAuthPlugin({
    clientId: process.env.CLIENT_ID!,
    enableSolanaWalletAdapter: true
});

export default withCivicAuth(nextConfig);
