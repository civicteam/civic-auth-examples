import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useState } from "react";

// A simple hook to get the wallet's balance in lamports
const useBalance = () => {
  const [balance, setBalance] = useState<number>();
  // The Solana Wallet Adapter hooks
  const { connection } = useConnection();
  const { publicKey } = useWallet();

  if (publicKey) {
    connection.getBalance(publicKey).then(setBalance);
  }

  return balance;
};

// Separate component for the app content that needs access to hooks
const App = () => {
  // Get the Solana wallet balance
  const balance = useBalance();
  // Get the Solana address
  const { publicKey } = useWallet();

  return (
    <div className="min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 items-center">
        <h1 className="text-4xl font-bold text-center mb-8">
          Civic Auth + Solana Wallet Example
        </h1>
        <p className="text-lg text-center text-gray-600 dark:text-gray-300 mb-8">
          Vite React with Wallet Adapter integration
        </p>
        <WalletMultiButton />
        {publicKey && (
          <div className="flex flex-col gap-4 items-center">
            <p className="text-lg">Wallet address: <span className="font-mono text-sm break-all">{publicKey.toString()}</span></p>
            <p className="text-lg">Balance: <span className="font-semibold">{balance !== null && balance !== undefined ? `${balance / 1e9} SOL` : "Loading..."}</span></p>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
