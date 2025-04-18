import { createCivicAuthPlugin } from "@civic/auth-web3/nextjs";
const nextConfig = {};

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

const withCivicAuth = createCivicAuthPlugin({
    clientId: `${process.env.CLIENT_ID}`,
    callbackUrl: `http://localhost:${PORT}/api/auth/callback`,
});

export default withCivicAuth(nextConfig);
