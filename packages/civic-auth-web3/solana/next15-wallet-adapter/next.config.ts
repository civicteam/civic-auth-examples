import { createCivicAuthPlugin } from "@civic/auth-web3/nextjs";
const nextConfig = {};

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

const withCivicAuth = createCivicAuthPlugin({
    clientId: `${process.env.CLIENT_ID}`,
    // oauthServer and wallet are not necessary for production.
    oauthServer: process.env.AUTH_SERVER || 'https://auth.civic.com/oauth',
    // @ts-ignore - endpoints is valid at runtime but not in types
    endpoints: { wallet: process.env.NEXT_PUBLIC_WALLET_API_BASE_URL },
    ...(process.env.WEBPACK_ENABLE_SOLANA_WALLET_ADAPTER === "true" ? {enableSolanaWalletAdapter: true} : {}),
});

export default withCivicAuth(nextConfig);