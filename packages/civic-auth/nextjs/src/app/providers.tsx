"use client";

import { CivicAuthProvider } from "@civic/auth/nextjs";
import type { ReactNode } from "react";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps): ReactNode {
  return (
      <CivicAuthProvider>
        {children}
      </CivicAuthProvider>
  );
}
