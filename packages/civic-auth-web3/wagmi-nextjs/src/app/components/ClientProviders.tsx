"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Chain, http } from "viem";
import { createConfig, WagmiProvider } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { embeddedWallet } from "@civic/auth-web3/wagmi";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: 1000,
    },
  },
});

// Configure chains and RPC URLs.
export const supportedChains = [mainnet, sepolia] as [
  Chain,
  ...Chain[],
];

const wagmiConfig = createConfig({
  chains: [ mainnet, sepolia ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
  connectors: [
    embeddedWallet(),
  ],
});

export const ClientProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        {children}
      </WagmiProvider>
    </QueryClientProvider>
  );
};
