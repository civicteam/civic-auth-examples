"use client";

import { useConnection } from "@solana/wallet-adapter-react";
import { useUser } from "@civic/auth-web3/react";
import { userHasWallet, Web3UserContextType } from "@civic/auth-web3";

import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { useCallback, useState } from "react";

// Separate component for the app content that needs access to hooks
const SendTransaction = () => {
  const userContext = useUser();
  const wallet = userHasWallet(userContext)
    ? userContext.solana.wallet
    : undefined;
  const { connection } = useConnection();

  const [recipientAddress, setReceipientAddress] = useState<string>(
    "6GyYxtn4tQPgGS3WhZeeLeC6TqsNUSKqfZLH1MUhAoGe"
  );
  const [solAmountToSend, setSolAmountToSend] = useState<number>(0.01);
  const [busySendingSol, setBusySendingSol] = useState(false);
  const [txSignature, setTxSignature] = useState<string | null>(null);

  const sendSol = useCallback(async () => {
    if (!userHasWallet(userContext) || !wallet) {
      throw new Error("No wallet found");
    }
    setBusySendingSol(true);

    if (!userHasWallet(userContext) || !userContext.solana.wallet.publicKey) {
      throw new Error("No wallet found");
    }

    const blockhash = await connection.getLatestBlockhash();

    const transaction = new Transaction({
      ...blockhash,
      feePayer: userContext.solana.wallet.publicKey,
    }).add(
      SystemProgram.transfer({
        fromPubkey: userContext.solana.wallet.publicKey,
        toPubkey: new PublicKey(recipientAddress),
        lamports: solAmountToSend * LAMPORTS_PER_SOL,
      })
    );

    const signature = await wallet.sendTransaction(transaction, connection);
    setTxSignature(signature);
    await connection.confirmTransaction({ signature, ...blockhash });
    setBusySendingSol(false);
    console.log("Sent transaction with signature", signature);
  }, [wallet, connection, recipientAddress, solAmountToSend]);

  if (!userContext.user) {
    return (
      <>
        <span>User not logged in.</span>
      </>
    );
  }

  if (!wallet) {
    return (
      <>
        <span>Wallet not connected yet...</span>
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col w-full">
        <span>Send SOL to wallet:</span>
        SOL to send:{" "}
        <input
          type="number"
          className="bg-white text-black"
          placeholder="0.001"
          id="amount"
          onChange={(evt) => setSolAmountToSend(parseFloat(evt.target.value))}
        />
        Recipient address:{" "}
        <input
          type="text"
          className="bg-white text-black"
          id="recipient"
          onChange={(evt) => setReceipientAddress(evt.target.value)}
        />
        <button
          className={`mt-2 rounded px-4 py-2 text-white 
                ${
                  !recipientAddress || !solAmountToSend || busySendingSol
                    ? "bg-blue-300 cursor-not-allowed"
                    : "bg-blue-500 hover:bg-blue-600"
                }`}
          disabled={!recipientAddress || !solAmountToSend || busySendingSol}
          onClick={sendSol}
        >
          {busySendingSol ? "Sending transaction..." : "Send transaction"}
        </button>
        {txSignature && <span>{`Transaction signature: ${txSignature}`}</span>}
      </div>
    </>
  );
};

export default SendTransaction;
