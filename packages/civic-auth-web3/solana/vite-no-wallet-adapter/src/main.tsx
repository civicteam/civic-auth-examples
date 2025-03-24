import { Buffer } from "buffer";
import { CivicAuthProvider } from "@civic/auth-web3/react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
// import dotenv from "dotenv";

// dotenv.config();


globalThis.Buffer = Buffer;

const CLIENT_ID = import.meta.env.VITE_CLIENT_ID;
const AUTH_SERVER = import.meta.env.VITE_AUTH_SERVER;
const WALLET_API_BASE_URL = import.meta.env.VITE_WALLET_API_BASE_URL;
if (!CLIENT_ID) throw new Error("CLIENT_ID is required");
// const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
// const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// biome-ignore lint/style/noNonNullAssertion: root is present in index.html
ReactDOM.createRoot(document.getElementById("root")!).render(
  // Wrap the content with the necessary providers to give access to hooks: solana wallet adapter & civic auth provider
    <CivicAuthProvider 
      clientId={CLIENT_ID} 
      config={{ oauthServer: AUTH_SERVER }}
      endpoints={{ wallet: WALLET_API_BASE_URL }}
    >
      <App />
    </CivicAuthProvider>
);
