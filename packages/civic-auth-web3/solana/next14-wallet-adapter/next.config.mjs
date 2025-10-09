import { createCivicAuthPlugin } from "@civic/auth-web3/nextjs";

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

const nextConfig = {
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
    enableSolanaWalletAdapter: true,
    // oauthServer and wallet are not necessary for production.
    oauthServer: process.env.AUTH_SERVER || 'https://auth.civic.com/oauth',
    endpoints: { wallet: process.env.NEXT_PUBLIC_WALLET_API_BASE_URL }
});

export default withCivicAuth(nextConfig);