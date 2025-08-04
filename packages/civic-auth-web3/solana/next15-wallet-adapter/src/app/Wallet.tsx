"use client";

import { useState, useEffect } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import bs58 from "bs58";
import nacl from "tweetnacl";

const Wallet = () => {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();
  const [balance, setBalance] = useState<number>();
  const [signing, setSigning] = useState(false);
  const [signedTransaction, setSignedTransaction] = useState<Transaction>();
  const [txSignature, setTxSignature] = useState<string>();
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<string>();

  // Get wallet balance
  useEffect(() => {
    if (connection && publicKey) {
      connection.getBalance(publicKey).then(setBalance);
    }
  }, [connection, publicKey]);

  const handleSignTransaction = async () => {
    if (!publicKey || !signTransaction) return;

    try {
      setSigning(true);
      setTxSignature(undefined);
      setVerificationResult(undefined);
      setSignedTransaction(undefined);

      // Create a simple self-transfer transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: publicKey,
          lamports: 0.001 * LAMPORTS_PER_SOL,
        })
      );

      // Set recent blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      // Sign the transaction
      const signedTx = await signTransaction(transaction);
      setSignedTransaction(signedTx);
      
      // Get signature
      const signature = signedTx.signatures[0];
      const signatureBase58 = bs58.encode(signature);
      setTxSignature(signatureBase58);
    } catch (error) {
      console.error("Error signing transaction:", error);
    } finally {
      setSigning(false);
    }
  };

  const handleVerifySignature = async () => {
    if (!signedTransaction || !publicKey) return;

    try {
      setVerifying(true);

      const signature = signedTransaction.signatures[0];
      const message = signedTransaction.serializeMessage();
      const isValid = nacl.sign.detached.verify(
        message,
        signature,
        publicKey.toBytes()
      );
      
      setVerificationResult(
        isValid 
          ? "✓ Signature verified successfully" 
          : "✗ Signature verification failed"
      );
    } catch (error) {
      console.error("Error verifying signature:", error);
      setVerificationResult("Error verifying signature");
    } finally {
      setVerifying(false);
    }
  };

  if (!publicKey) return null;

  return (
    <div style={{ padding: '20px', maxWidth: '600px' }}>
      <div style={{ marginBottom: '20px' }}>
        <p><strong>Wallet:</strong> {publicKey.toString()}</p>
        <p><strong>Balance:</strong> {balance !== undefined ? `${balance / 1e9} SOL` : "Loading..."}</p>
      </div>
      
      <button
        onClick={handleSignTransaction}
        disabled={signing || !signTransaction}
        style={{
          padding: '12px 24px',
          backgroundColor: signing ? '#ccc' : '#0070f3',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: signing ? 'not-allowed' : 'pointer',
          fontSize: '16px'
        }}
      >
        {signing ? 'Signing...' : 'Sign Test Transaction'}
      </button>

      {txSignature && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ 
            padding: '12px', 
            backgroundColor: '#f5f5f5', 
            borderRadius: '6px',
            marginBottom: '10px'
          }}>
            <p style={{ margin: 0, wordBreak: 'break-all', fontSize: '14px' }}>
              <strong>Signature:</strong> {txSignature}
            </p>
          </div>
          
          <button
            onClick={handleVerifySignature}
            disabled={verifying}
            style={{
              padding: '8px 16px',
              backgroundColor: verifying ? '#ccc' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: verifying ? 'not-allowed' : 'pointer',
              marginBottom: '10px'
            }}
          >
            {verifying ? 'Verifying...' : 'Verify Signature'}
          </button>
          
          {verificationResult && (
            <div style={{ 
              padding: '12px',
              backgroundColor: verificationResult.includes('✓') ? '#d4edda' : '#f8d7da',
              color: verificationResult.includes('✓') ? '#155724' : '#721c24',
              borderRadius: '6px',
              border: `1px solid ${verificationResult.includes('✓') ? '#c3e6cb' : '#f5c6cb'}`,
              marginBottom: '10px'
            }}>
              {verificationResult}
            </div>
          )}
          
          <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
            Transaction signed but not submitted to blockchain
          </p>
        </div>
      )}
    </div>
  );
};

export default Wallet;
