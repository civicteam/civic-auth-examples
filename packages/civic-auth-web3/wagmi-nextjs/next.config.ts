import type { NextConfig } from "next";

import { createCivicAuthPlugin } from "@civic/auth-web3/nextjs";
const withCivicAuth = createCivicAuthPlugin({
  // eslint-disable-next-line no-undef
  clientId: `${process.env.CLIENT_ID}`,
  // eslint-disable-next-line no-undef
  oauthServer: `${process.env.AUTH_SERVER}`,
});

const nextConfig: NextConfig = {
  /* config options here */
};

export default withCivicAuth(nextConfig);;
