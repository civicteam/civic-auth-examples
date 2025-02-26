import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useState, useEffect } from "react";
import { useUser, UserButton } from "@civic/auth-web3/react";
import { userHasWallet } from "@civic/auth-web3";

// A simple hook to get the wallet's balance in lamports
const useBalance = () => {
  const [balance, setBalance] = useState<number>();
  const { connection } = useConnection();
  const { publicKey } = useWallet();

  useEffect(() => {
    if (publicKey) {
      connection.getBalance(publicKey).then(setBalance);
    }
  }, [publicKey, connection]);

  return balance;
};

// Separate component for the app content that needs access to hooks
const App = () => {
  // Get the Solana wallet balance
  const balance = useBalance();
  // Get the Solana address
  const { publicKey } = useWallet();
  // Get the Civic user context
  const userContext = useUser();
  // Track authentication state manually
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Update authentication state whenever userContext changes
  useEffect(() => {
    if (userContext) {
      setIsAuthenticated(userContext.authStatus === "authenticated");
      console.log("User Context:", userContext);
      console.log("Wallet Adapter PublicKey:", publicKey?.toString());
    }
  }, [userContext, publicKey]);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Civic Auth + Solana Demo</h1>
      
      <div style={{ display: "flex", gap: "10px", margin: "20px 0" }}>
        <UserButton />
        {isAuthenticated && <WalletMultiButton />}
      </div>

      {isAuthenticated ? (
        <>
          {publicKey ? (
            <div>
              <p>Wallet address: {publicKey.toString()}</p>
              <p>Balance: {balance !== undefined ? `${balance / 1e9} SOL` : "Loading..."}</p>
            </div>
          ) : (
            <p>Please connect a wallet using the "Select Wallet" button above.</p>
          )}
        </>
      ) : (
        <p>Please sign in with Civic to use this application.</p>
      )}
    </div>
  );
};

export default App;