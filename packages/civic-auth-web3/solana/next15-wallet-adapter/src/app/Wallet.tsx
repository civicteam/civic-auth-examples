"use client";

import { useState, useEffect } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import bs58 from "bs58";
import nacl from "tweetnacl";

const Wallet = () => {
  const { connection } = useConnection();
  const { publicKey, signMessage } = useWallet();
  const [balance, setBalance] = useState<number>();
  const [signing, setSigning] = useState(false);
  const [message] = useState("Hello, World!");
  const [signedMessage, setSignedMessage] = useState<Uint8Array>();
  const [signature, setSignature] = useState<string>();
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<string>();

  // Get wallet balance
  useEffect(() => {
    if (connection && publicKey) {
      connection.getBalance(publicKey).then(setBalance);
    }
  }, [connection, publicKey]);

  const handleSignMessage = async () => {
    if (!publicKey || !signMessage) return;

    try {
      setSigning(true);
      setSignature(undefined);
      setVerificationResult(undefined);
      setSignedMessage(undefined);

      // Convert message to bytes
      const messageBytes = new TextEncoder().encode(message);
      
      // Sign the message
      const signedBytes = await signMessage(messageBytes);
      setSignedMessage(signedBytes);
      
      // Convert signature to base58
      const signatureBase58 = bs58.encode(signedBytes);
      setSignature(signatureBase58);
    } catch (error) {
      console.error("Error signing message:", error);
    } finally {
      setSigning(false);
    }
  };

  const handleVerifySignature = async () => {
    if (!signedMessage || !publicKey) return;

    try {
      setVerifying(true);

      const messageBytes = new TextEncoder().encode(message);
      const isValid = nacl.sign.detached.verify(
        messageBytes,
        signedMessage,
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

      <div style={{ marginBottom: '20px' }}>
        <p><strong>Message to sign:</strong> "{message}"</p>
      </div>
      
      <button
        onClick={handleSignMessage}
        disabled={signing || !signMessage}
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
        {signing ? 'Signing...' : 'Sign Message'}
      </button>

      {signature && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ 
            padding: '12px', 
            backgroundColor: '#f5f5f5', 
            borderRadius: '6px',
            marginBottom: '10px'
          }}>
            <p style={{ margin: 0, wordBreak: 'break-all', fontSize: '14px' }}>
              <strong>Signature:</strong> {signature}
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
        </div>
      )}
    </div>
  );
};

export default Wallet;
