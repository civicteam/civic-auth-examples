import { Buffer } from "buffer";
import { CivicAuthProvider } from "@civic/auth-web3/react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider, WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";

globalThis.Buffer = Buffer;

const CLIENT_ID = import.meta.env.VITE_CLIENT_ID;
if (!CLIENT_ID) throw new Error("CLIENT_ID is required");

const endpoint = clusterApiUrl("devnet");

// biome-ignore lint/style/noNonNullAssertion: root is present in index.html
ReactDOM.createRoot(document.getElementById("root")!).render(
  // Wrap the content with the necessary providers to give access to hooks: solana wallet adapter & civic auth provider
  <ConnectionProvider endpoint={endpoint}>
    <WalletProvider wallets={[]} autoConnect>
      <WalletModalProvider>
        <CivicAuthProvider clientId={CLIENT_ID}>
          <WalletMultiButton />
          <App />
        </CivicAuthProvider>
      </WalletModalProvider>
    </WalletProvider>
  </ConnectionProvider>,
);
