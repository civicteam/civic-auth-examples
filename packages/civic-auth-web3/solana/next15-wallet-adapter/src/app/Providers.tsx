import { CivicAuthProvider } from "@civic/auth-web3/nextjs";

import "@solana/wallet-adapter-react-ui/styles.css";

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return <CivicAuthProvider>{children}</CivicAuthProvider>;
};
