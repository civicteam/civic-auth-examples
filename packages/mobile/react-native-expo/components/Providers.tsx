import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "./ErrorBoundary";
// import { WagmiProvider } from "wagmi";
// import { wagmiConfig } from "@/config/wagmi";

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <ErrorBoundary>
      {/*<WagmiProvider config={wagmiConfig}>*/}
      <AuthProvider>{children}</AuthProvider>
      {/*</WagmiProvider>*/}
    </ErrorBoundary>
  );
};
