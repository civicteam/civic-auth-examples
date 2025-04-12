"use client";

import { CivicAuthProvider } from "@civic/auth-web3/nextjs";
import {clusterApiUrl} from "@solana/web3.js";
import {WalletModalProvider, WalletMultiButton} from "@solana/wallet-adapter-react-ui";
import {ConnectionProvider, WalletProvider} from "@solana/wallet-adapter-react";

export const Providers = ({ children }: { children: React.ReactNode }) => {
    return (
        <ConnectionProvider endpoint={clusterApiUrl("devnet")}>
            <WalletProvider wallets={[]} autoConnect>
                <WalletModalProvider>
                    <CivicAuthProvider
                        endpoints={{ wallet: process.env.NEXT_PUBLIC_WALLET_API_BASE_URL }}
                    >
                        <WalletMultiButton />
                        {children}
                    </CivicAuthProvider>
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    )
}