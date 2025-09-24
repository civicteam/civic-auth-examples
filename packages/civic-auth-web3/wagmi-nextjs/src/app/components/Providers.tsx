import { CivicAuthProvider } from "@civic/auth-web3/nextjs";

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return <CivicAuthProvider>{children}</CivicAuthProvider>;
};
