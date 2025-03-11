import { CivicAuthProvider } from "@civic/auth/nextjs";
import type { ReactNode } from 'react';

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <CivicAuthProvider>
          {children}
        </CivicAuthProvider>
      </body>
    </html>
  );
}