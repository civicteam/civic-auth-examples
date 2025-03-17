"use client";

import {useState} from "react";
import {useConnection, useWallet} from "@solana/wallet-adapter-react";

// A simple hook to get the wallet's balance in lamports
const useBalance = () => {
  const [balance, setBalance] = useState<number>();
  // The Solana Wallet Adapter hooks
  const { connection } = useConnection();
  const { publicKey } = useWallet();

  if (connection && publicKey) {
    connection.getBalance(publicKey).then(setBalance);
  }

  return balance;
};

// Separate component for the app content that needs access to hooks
const Wallet = () => {
  // Get the Solana wallet balance
  const balance = useBalance();
  // Get the Solana address
  const { publicKey } = useWallet();

  return (
    <>
      {publicKey && (
        <div>
          <p>Wallet address: {publicKey.toString()}</p>
          <p>Balance: {balance ? `${balance / 1e9} SOL` : "Loading..."}</p>
        </div>
      )}
    </>
  );
};

export default Wallet;
