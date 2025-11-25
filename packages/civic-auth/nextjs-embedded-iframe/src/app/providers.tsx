import React, { ReactNode } from "react";
import { CivicAuthProvider } from "@civic/auth/nextjs";

const Providers = ({
  children,
  iframeMode = "modal",
}: {
  children: ReactNode;
  iframeMode?: "embedded" | "modal";
}) => {
  return (
    <CivicAuthProvider
      logging={{
        enabled: process.env.NEXT_PUBLIC_DEBUG !== "false",
        level: "debug",
      }}
      displayMode="iframe"
      iframeMode={iframeMode}
    >
      {children}
    </CivicAuthProvider>
  );
};

export { Providers };
