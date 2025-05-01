import { createCivicAuthPlugin } from "@civic/auth-web3/nextjs";
const nextConfig = {};

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

const withCivicAuth = createCivicAuthPlugin({
    clientId: `${process.env.CLIENT_ID}`,
    oauthServer: process.env.AUTH_SERVER || 'https://auth.civic.com/oauth',
    ...(process.env.WEBPACK_ENABLE_SOLANA_WALLET_ADAPTER === "true" ? {enableSolanaWalletAdapter: true} : {}),
});

export default withCivicAuth(nextConfig);