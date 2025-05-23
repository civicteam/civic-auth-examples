import { Buffer } from "buffer";
import { CivicAuthProvider } from "@civic/auth-web3/react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";

import "@solana/wallet-adapter-react-ui/styles.css"

globalThis.Buffer = Buffer;

const CLIENT_ID = import.meta.env.VITE_CLIENT_ID;
if (!CLIENT_ID) throw new Error("CLIENT_ID is required");

// AUTH_SERVER and WALLET_API_BASE_URL are not necessary for production.
const AUTH_SERVER = import.meta.env.VITE_AUTH_SERVER || "https://auth.civic.com/oauth";
const WALLET_API_BASE_URL = import.meta.env.VITE_WALLET_API_BASE_URL;

const endpoint = clusterApiUrl("devnet");

// biome-ignore lint/style/noNonNullAssertion: root is present in index.html
ReactDOM.createRoot(document.getElementById("root")!).render(
  // Wrap the content with the necessary providers to give access to hooks: solana wallet adapter & civic auth provider
  <ConnectionProvider endpoint={endpoint}>
    <WalletProvider wallets={[]} autoConnect>
      <WalletModalProvider>
        <CivicAuthProvider 
          clientId={CLIENT_ID} 
          // oauthServer and wallet are not necessary for production.
          config={{ oauthServer: AUTH_SERVER || 'https://auth.civic.com/oauth'}}
          endpoints={{ wallet: WALLET_API_BASE_URL }}
        >
          <App />
        </CivicAuthProvider>
      </WalletModalProvider>
    </WalletProvider>
  </ConnectionProvider>,
);
