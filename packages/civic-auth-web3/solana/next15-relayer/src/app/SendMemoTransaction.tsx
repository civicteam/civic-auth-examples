"use client";

import { useUser } from "@civic/auth-web3/react";
import { userHasWallet } from "@civic/auth-web3";
import {
  PublicKey,
  Transaction,
  TransactionInstruction,
  Connection,
} from "@solana/web3.js";
import { useCallback, useState } from "react";

const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

const SendMemoTransaction = () => {
  const userContext = useUser();
  const wallet = userHasWallet(userContext)
    ? userContext.solana.wallet
    : undefined;

  const [memoText, setMemoText] = useState<string>("Hello from Civic Auth!");
  const [busySending, setBusySending] = useState(false);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sendMemo = useCallback(async () => {
    if (!userHasWallet(userContext) || !wallet) {
      throw new Error("No wallet found");
    }
    
    if (!memoText) {
      setError("Please enter a memo text");
      return;
    }

    setBusySending(true);
    setError(null);
    setTxSignature(null);

    try {
      if (!wallet.publicKey) {
        throw new Error("Wallet public key not available");
      }

      // Create connection to Solana
      const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com";
      const connection = new Connection(rpcUrl, "confirmed");

      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash();

      // Create memo instruction
      const memoInstruction = new TransactionInstruction({
        keys: [],
        programId: MEMO_PROGRAM_ID,
        data: Buffer.from(memoText, "utf-8"),
      });

      // Create transaction without fee payer (relay will set it)
      const transaction = new Transaction();
      transaction.add(memoInstruction);
      transaction.recentBlockhash = blockhash;
      // Don't set feePayer - the relay will add itself as fee payer

      // Sign the transaction with the wallet
      const signedTransaction = await wallet.signTransaction(transaction);

      // Serialize the transaction
      const serializedTransaction = signedTransaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      });

      // Send to relay service
      const relayUrl = process.env.NEXT_PUBLIC_RELAY_URL || "http://localhost:3001/relay";
      const response = await fetch(relayUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Include the JWT token from the user context
          "Authorization": `Bearer ${userContext.user?.jwt}`,
        },
        body: JSON.stringify({
          tx: Buffer.from(serializedTransaction).toString("base64"),
          network: "devnet",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Relay error: ${response.status}`);
      }

      const result = await response.json();
      setTxSignature(result.signature);
      console.log("Sent transaction via relay with signature", result.signature);
    } catch (err) {
      console.error("Error sending memo:", err);
      setError(err instanceof Error ? err.message : "Failed to send memo");
    } finally {
      setBusySending(false);
    }
  }, [wallet, memoText, userContext]);

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
      <div className="flex flex-col w-full gap-4">
        <h2 className="text-xl font-bold">Send Memo Transaction via Relay</h2>
        <div className="flex flex-col gap-2">
          <label htmlFor="memo">Memo text:</label>
          <input
            type="text"
            className="bg-white text-black p-2 rounded"
            placeholder="Enter your memo"
            id="memo"
            value={memoText}
            onChange={(evt) => setMemoText(evt.target.value)}
          />
        </div>
        <button
          className={`rounded px-4 py-2 text-white 
                ${
                  !memoText || busySending
                    ? "bg-blue-300 cursor-not-allowed"
                    : "bg-blue-500 hover:bg-blue-600"
                }`}
          disabled={!memoText || busySending}
          onClick={sendMemo}
        >
          {busySending ? "Sending transaction..." : "Send Memo via Relay"}
        </button>
        {error && (
          <div className="text-red-500">
            Error: {error}
          </div>
        )}
        {txSignature && (
          <div className="text-green-500">
            Transaction sent successfully!
            <br />
            <a
              href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              View on Solana Explorer
            </a>
          </div>
        )}
      </div>
    </>
  );
};

export default SendMemoTransaction;