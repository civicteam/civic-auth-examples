"use client";

import { CivicAuthProvider } from "@civic/auth-web3/nextjs";
import {clusterApiUrl} from "@solana/web3.js";
import {WalletModalProvider, WalletMultiButton} from "@solana/wallet-adapter-react-ui";
import {ConnectionProvider, WalletProvider} from "@solana/wallet-adapter-react";

import "@solana/wallet-adapter-react-ui/styles.css"

export const Providers = ({ children }: { children: React.ReactNode }) => {
    return (
        <ConnectionProvider endpoint={clusterApiUrl("devnet")}>
            <WalletProvider wallets={[]} autoConnect>
                <WalletModalProvider>
                    <CivicAuthProvider>
                        <WalletMultiButton />
                        {children}
                    </CivicAuthProvider>
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    )
}