"use client";
import { createConfig, http, webSocket } from "wagmi";
import { injected, metaMask } from "wagmi/connectors";
import { SOMNIA_TESTNET } from "./contracts";
import { defineChain } from "viem";

export const somniaChain = defineChain({
    id: SOMNIA_TESTNET.id,
    name: SOMNIA_TESTNET.name,
    nativeCurrency: SOMNIA_TESTNET.nativeCurrency,
    rpcUrls: {
        default: {
            http: [process.env.NEXT_PUBLIC_RPC_URL ?? "https://dream-rpc.somnia.network"],
            webSocket: [process.env.NEXT_PUBLIC_WS_URL ?? "wss://api.infra.testnet.somnia.network/ws"],
        },
    },
    blockExplorers: {
        default: { name: "Somnia Explorer", url: process.env.NEXT_PUBLIC_EXPLORER_URL ?? "https://shannon-explorer.somnia.network" },
    },
    testnet: true,
});

// Bitget Wallet, OKX Wallet DApp, OKX Extension, MetaMask — all use window.ethereum via injected()
// We create multiple injected connectors targeting specific wallet providers
function createInjectedConnector(name: string, rdns?: string) {
    return injected({
        target: rdns
            ? {
                id: rdns,
                name,
                provider: () => {
                    if (typeof window === "undefined") return undefined;
                    // OKX Extension: window.okxwallet
                    if (rdns === "com.okex.wallet") return (window as any).okxwallet as any;
                    // Bitget Wallet: window.bitkeep?.ethereum
                    if (rdns === "com.bitget.web3wallet") return (window as any).bitkeep?.ethereum as any;
                    // MetaMask: window.ethereum (with isMetaMask check)
                    if (rdns === "io.metamask") {
                        const eth = (window as any).ethereum;
                        if (eth?.isMetaMask) return eth;
                        // EIP-6963 multi-wallet: check providers array
                        if (eth?.providers) {
                            const mm = eth.providers.find((p: any) => p.isMetaMask);
                            return mm;
                        }
                        return undefined;
                    }
                    return undefined;
                },
            }
            : undefined,
        shimDisconnect: true,
    });
}

export const wagmiConfig = createConfig({
    chains: [somniaChain],
    connectors: [
        // Generic injected — catches DApp browsers (Bitget DApp, OKX DApp) automatically
        injected({ shimDisconnect: true }),
        // Explicit MetaMask
        metaMask(),
        // Explicit OKX Extension
        createInjectedConnector("OKX Wallet", "com.okex.wallet"),
        // Explicit Bitget Wallet
        createInjectedConnector("Bitget Wallet", "com.bitget.web3wallet"),
    ],
    transports: {
        [somniaChain.id]: http(process.env.NEXT_PUBLIC_RPC_URL ?? "https://dream-rpc.somnia.network"),
    },
    ssr: true,
});
