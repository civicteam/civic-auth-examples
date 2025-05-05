"use client";
import { CivicAuthIframeContainer, useUser } from "@civic/auth-web3/react";
import { useAutoConnect } from "@civic/auth-web3/wagmi";
import { useAccount, useBalance, useSendTransaction, useSwitchChain } from "wagmi";
import { formatEther } from "viem";
import { useCallback, useEffect, useState } from "react";
import { baseSepolia } from "wagmi/chains";


function Web3U({
  walletCreationInProgress,
}: {
  walletCreationInProgress?: boolean;
}) {
  const { isConnected, address, chain } = useAccount();
  const user = useUser();
  const isLoading = user.isLoading || walletCreationInProgress;
  const [receipientAddress, setRecipientAddress] = useState<string | null>(null);
  const [ethToSend, setEthToSend] = useState<number | null>(0.001);
    const [busySendingEth, setBusySendingEth] = useState(false);

  const ethBalance = useBalance({
    address,
    query: {
      refetchInterval: 3000,
    },
  });

  const formatBalanceEth = (balance: bigint | undefined) => {
    if (!balance) return (0.0).toFixed(5);
    return Number.parseFloat(formatEther(balance)).toFixed(5);
  };

  const { sendTransaction, error: sendTxError } = useSendTransaction();

  if(sendTxError) {
    console.log("Error sending transaction", sendTxError);
  }

  const sendEth =  useCallback(() => {
    if (!ethToSend || !receipientAddress) return;
    setBusySendingEth(true);
    sendTransaction({
      to: receipientAddress as `0x${string}`,
      value: BigInt(ethToSend * 1e18),
    }, {
        onSettled: () => {
            setBusySendingEth(false);
        }
    });
  }, [receipientAddress, ethToSend, sendTransaction]);

  console.log("Chain is", chain);

  return (
    <>
      {!isConnected || isLoading ? (
        <div>
          <div>Connecting wallet. Please wait...</div>
        </div>
      ) : null}
      {isConnected && !isLoading && <div
        className={`${!isConnected ? "pointer-events-none opacity-50" : ""} flex flex-col gap-4`}
      >
        <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
          <div className="flex flex-col">
            <span>Chain: {chain?.name}</span>
            <span>Wallet Address: {address}</span>
            <span>Wallet Balance: {formatBalanceEth(ethBalance?.data?.value)} ETH</span>
          </div>
        </div>

        <div className="flex flex-col" >
            <span>Send ETH to wallet:</span>
            ETH to send: <input type="number" className="bg-white text-black" placeholder="0.001" id="amount" onChange={(evt) => setEthToSend(parseFloat(evt.target.value))} />
            Recipient address: <input type="text" className="bg-white text-black" placeholder="0x..." id="recipient" onChange={(evt) => setRecipientAddress(evt.target.value)} />
            <button
               className={`mt-2 rounded px-4 py-2 text-white 
                ${!receipientAddress || !ethToSend || busySendingEth 
                  ? 'bg-blue-300 cursor-not-allowed' 
                  : 'bg-blue-500 hover:bg-blue-600'}`}
              disabled={!receipientAddress || !ethToSend || busySendingEth}
              onClick={sendEth}
            >{busySendingEth ? 'Sending transaction...' : 'Send transaction'}</button>
            {sendTxError && <div className="text-red-500 w-50">Error sending transaction</div>}
        </div>

      </div>}
    </>
  );
}

function Web3Zone() {
  const { user, isLoading, walletCreationInProgress } = useUser();
  useAutoConnect();

  if (!isLoading && !user)
    return (
      
        <CivicAuthIframeContainer />
      
    );

  return (
    <Web3U walletCreationInProgress={walletCreationInProgress} />
  );
}
export { Web3Zone };
