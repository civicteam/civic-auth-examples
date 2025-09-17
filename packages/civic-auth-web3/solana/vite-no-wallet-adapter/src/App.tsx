import {useEffect, useState} from "react";
import {clusterApiUrl, Connection, PublicKey} from "@solana/web3.js";
import {UserButton, useWallet } from "@civic/auth-web3/react";

const useConnection = () => {
  const [connection, setConnection] = useState<Connection | null>(null);

  useEffect(() => {
    const con = new Connection(clusterApiUrl("devnet"));
    setConnection(con);
  }, []);

  return {connection};
}

// A simple hook to get the wallet's balance in lamports
const useBalance = () => {
  const [balance, setBalance] = useState<number>();
  // The Solana Wallet Adapter hooks
  const { connection } = useConnection();
  const { address } = useWallet({ type: "solana"});

  const publicKey = address ? new PublicKey(address) : null;

  if (connection && publicKey) {
    connection.getBalance(publicKey).then(setBalance);
  }

  return balance;
};

// Separate component for the app content that needs access to hooks
const App = () => {
  // Get the Solana wallet balance
  const balance = useBalance();
  // Get the Solana address
  const { address } = useWallet({ type: "solana"});

  return (
    <div className="bg-black min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 items-center">
        <h1 className="text-4xl font-bold text-center mb-8">
          Civic Auth + Solana Wallet Example
        </h1>
        <p className="text-lg text-center text-gray-600 dark:text-gray-300 mb-8">
          Vite React with no Wallet Adapter integration
        </p>
        <UserButton theme="dark" />
        {address && (
          <div className="flex flex-col gap-4 items-center">
            <p className="text-lg">Wallet address: <span className="font-mono text-sm break-all">{address}</span></p>
            <p className="text-lg">Balance: <span className="font-semibold">{balance !== null && balance !== undefined ? `${balance / 1e9} SOL` : "Loading..."}</span></p>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
