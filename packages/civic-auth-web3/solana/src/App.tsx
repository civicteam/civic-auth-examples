import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useState, useEffect } from "react";
import { useUser, UserButton } from "@civic/auth-web3/react";
import { userHasWallet } from "@civic/auth-web3";
import { PublicKey } from "@solana/web3.js";

const App = () => {
  const userContext = useUser();
  
  const { connection } = useConnection();
  const { publicKey, connected, connect } = useWallet();
  
  // State for balances and auth
  const [externalBalance, setExternalBalance] = useState<number | undefined>();
  const [civicBalance, setCivicBalance] = useState<number | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Update authentication state whenever userContext changes
  useEffect(() => {
    if (userContext) {
      setIsAuthenticated(userContext.authStatus === "authenticated");
      console.log("User Context:", userContext);
    }
  }, [userContext]);

  // Effect to fetch external wallet balance
  useEffect(() => {
    const fetchExternalBalance = async () => {
      if (publicKey) {
        try {
          const balance = await connection.getBalance(publicKey);
          setExternalBalance(balance);
        } catch (error) {
          console.error("Error fetching external wallet balance:", error);
          setExternalBalance(undefined);
        }
      }
    };
    
    fetchExternalBalance();
  }, [publicKey, connection]);

  // Effect to fetch Civic wallet balance
  useEffect(() => {
    const fetchCivicBalance = async () => {
      if (userHasWallet(userContext) && userContext.solana?.address) {
        try {
          const walletPublicKey = new PublicKey(userContext.solana.address);
          const walletBalance = await connection.getBalance(walletPublicKey);
          setCivicBalance(walletBalance);
        } catch (error) {
          console.error("Error fetching Civic wallet balance:", error);
          setCivicBalance(null);
        }
      }
    };
    
    fetchCivicBalance();
  }, [userContext, connection]);

  // Connect the embedded Civic wallet
  const connectExistingWallet = async () => {
    try {
      await connect();
      console.log("Connected to wallet");
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  };

  // Create a Civic wallet if the user doesn't have one
  const createWallet = () => {
    if (userContext.user && !userHasWallet(userContext)) {
      return userContext.createWallet().then(connectExistingWallet);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Civic Auth + Solana Demo</h1>
      
      <div style={{ display: "flex", gap: "10px", margin: "20px 0" }}>
        <UserButton />
        {isAuthenticated && <WalletMultiButton />}
      </div>

      {isAuthenticated ? (
        <div>
          {!userHasWallet(userContext) ? (
            <p><button onClick={createWallet}>Connect Wallet</button></p>
          ) : (
            <>
              <h3>Civic Embedded Wallet</h3>
              <p>Wallet address: {userContext.solana?.address}</p>
              <p>Balance: {
                civicBalance !== null
                  ? `${(civicBalance / 1e9).toFixed(9)} SOL`
                  : 'Loading...'
              }</p>
              <p>External wallet: {connected ? 'Connected' : 'Not connected'}</p>
              
              {publicKey && (
                <>
                  <h3>Connected External Wallet</h3>
                  <p>Wallet address: {publicKey.toString()}</p>
                  <p>Balance: {externalBalance !== undefined ? `${externalBalance / 1e9} SOL` : "Loading..."}</p>
                </>
              )}
            </>
          )}
        </div>
      ) : (
        <p>Please sign in with Civic to use this application.</p>
      )}
    </div>
  );
};

export default App;