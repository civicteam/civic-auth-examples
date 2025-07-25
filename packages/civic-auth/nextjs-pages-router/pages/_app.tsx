import type { AppProps } from 'next/app'
// Try to use the React SDK directly instead of NextJS-specific wrapper
import { CivicAuthProvider } from "@civic/auth/react";

export default function App({ Component, pageProps }: AppProps) {
  // Gap identified: React SDK requires manual clientId configuration
  // In App Router, this is handled automatically by the NextJS wrapper
  const clientId = process.env.NEXT_PUBLIC_CIVIC_CLIENT_ID!;
  
  return (
    <CivicAuthProvider 
      clientId={clientId}
      redirectUrl={`http://localhost:3001/api/auth/callback`}
    >
      <Component {...pageProps} />
    </CivicAuthProvider>
  )
}