import { Buffer } from "buffer";
import { CivicAuthProvider } from "@civic/auth-web3/react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";

globalThis.Buffer = Buffer;

const CLIENT_ID = import.meta.env.VITE_CLIENT_ID;
if (!CLIENT_ID) throw new Error("CLIENT_ID is required");

// biome-ignore lint/style/noNonNullAssertion: root is present in index.html
ReactDOM.createRoot(document.getElementById("root")!).render(
  // Wrap the content with the necessary providers to give access to hooks: solana wallet adapter & civic auth provider
        <CivicAuthProvider clientId={CLIENT_ID} endpoints={{
            auth: import.meta.env.VITE_AUTH_SERVER
        }}>
          <App />
        </CivicAuthProvider>
);
