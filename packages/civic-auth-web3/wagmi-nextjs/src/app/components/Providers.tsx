"use client";

import { FC, PropsWithChildren } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CivicAuthProvider } from "@civic/auth-web3/nextjs";
import { polygonAmoy, baseSepolia, sepolia, xdcTestnet } from "viem/chains";
import { Chain, http } from "viem";
import { createConfig, WagmiProvider } from "wagmi";
import { embeddedWallet } from "@civic/auth-web3/wagmi";

const queryClient = new QueryClient();

// Configure chains and RPC URLs.
export const supportedChains = [baseSepolia] as [
  Chain,
  ...Chain[],
];

const wagmiConfig = createConfig({
  chains: supportedChains,
  transports: {
    [baseSepolia.id]: http(),
  },
  connectors: [embeddedWallet()],
  ssr: true,
});

// Add this type for the Providers props
type ProvidersProps = PropsWithChildren<{
  onSessionEnd?: () => void;
}>;

export const Providers: FC<ProvidersProps> = ({ children }) => {
  return (
      <QueryClientProvider client={queryClient}>
            <WagmiProvider config={wagmiConfig}>
              {/* The need for initialChain here will be removed in an upcoming version of @civic/auth-web3 */}
              <CivicAuthProvider initialChain={baseSepolia}>
                {children}
              </CivicAuthProvider>
            </WagmiProvider>
      </QueryClientProvider>
  );
};
