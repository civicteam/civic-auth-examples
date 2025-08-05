"use client";

import { useConnection } from "@solana/wallet-adapter-react";
import { useUser } from "@civic/auth-web3/react";
import { ExistingWeb3UserContext, userHasWallet } from "@civic/auth-web3";

import {
  Blockhash,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { useCallback, useState } from "react";

// Separate component for the app content that needs access to hooks
const SendTransaction = () => {
  const userContext = useUser();
  const wallet = userHasWallet(userContext)
    ? userContext.solana.wallet
    : undefined;
  const { connection } = useConnection();

  const [recipientAddress, setRecipientAddress] = useState<string | null>(null);
  const [solAmountToSend, setSolAmountToSend] = useState<number>(0.01);
  const [busySendingSol, setBusySendingSol] = useState(false);
  const [txSignature, setTxSignature] = useState<string | null>(null);

  const buildV0Tx = (
    userContext: ExistingWeb3UserContext,
    recipientAddress: PublicKey,
    blockhash: { blockhash: Blockhash; lastValidBlockHeight: number }
  ) => {
    // Create instructions
    const instruction = SystemProgram.transfer({
      fromPubkey: userContext.solana.wallet.publicKey!,
      toPubkey: new PublicKey(recipientAddress),
      lamports: solAmountToSend * LAMPORTS_PER_SOL,
    });

    // Use TransactionMessage to build a v0 transaction
    const messageV0 = new TransactionMessage({
      payerKey: userContext.solana.wallet.publicKey!,
      recentBlockhash: blockhash.blockhash,
      instructions: [instruction],
    }).compileToV0Message(); // 🔄 This compiles it to a v0 message

    return new VersionedTransaction(messageV0);
  };

  const buildLegacyTx = (
    userContext: ExistingWeb3UserContext,
    recipientAddress: PublicKey,
    blockhash: { blockhash: Blockhash; lastValidBlockHeight: number }
  ) => {
    return new Transaction({
      ...blockhash,
      feePayer: userContext.solana.wallet.publicKey,
    }).add(
      SystemProgram.transfer({
        fromPubkey: userContext.solana.wallet.publicKey!,
        toPubkey: recipientAddress,
        lamports: solAmountToSend * LAMPORTS_PER_SOL,
      })
    );
  };

  const sendSol = useCallback(async () => {
    if (!userHasWallet(userContext) || !wallet) {
      throw new Error("No wallet found");
    }
    if (!recipientAddress || !solAmountToSend) {
      throw Error("recipient address and SOL amount have to be set");
    }
    setBusySendingSol(true);

    if (!userHasWallet(userContext) || !userContext.solana.wallet.publicKey) {
      throw new Error("No wallet found");
    }

    let transaction: Transaction | VersionedTransaction;
    const blockhash = await connection.getLatestBlockhash();
    if (process.env.NEXT_PUBLIC_USE_V0_TX === "true") {
      console.log("Using v0 transaction");
      transaction = buildV0Tx(
        userContext,
        new PublicKey(recipientAddress),
        blockhash
      );
    } else {
      transaction = buildLegacyTx(
        userContext,
        new PublicKey(recipientAddress),
        blockhash
      );
    }

    const signature = await wallet.sendTransaction(transaction, connection);
    setTxSignature(signature);
    await connection.confirmTransaction({ signature, ...blockhash });
    setBusySendingSol(false);
    console.log("Sent transaction with signature", signature);
  }, [wallet, connection, recipientAddress, solAmountToSend, userContext]);

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
          onChange={(evt) => setRecipientAddress(evt.target.value)}
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
