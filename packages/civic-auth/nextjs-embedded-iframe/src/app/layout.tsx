import React, { ReactNode } from "react";
import { Providers } from "./providers";

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif" }}>
        <Providers iframeMode="embedded">{children}</Providers>
      </body>
    </html>
  );
};

export default Layout;
