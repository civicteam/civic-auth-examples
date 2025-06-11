import { CivicAuthProvider } from '@civic/auth/nextjs';
import type { AppProps } from 'next/app';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <CivicAuthProvider>
      <Component {...pageProps} />
    </CivicAuthProvider>
  );
}
