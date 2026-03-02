"use client";
import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { SOMNIA_TESTNET } from "./contracts";
import { defineChain } from "viem";

export const somniaChain = defineChain({
    id: SOMNIA_TESTNET.id,
    name: SOMNIA_TESTNET.name,
    nativeCurrency: SOMNIA_TESTNET.nativeCurrency,
    rpcUrls: {
        default: {
            http: ["https://dream-rpc.somnia.network"],
        },
    },
    blockExplorers: {
        default: { name: "Somnia Explorer", url: "https://shannon-explorer.somnia.network" },
    },
});

export const wagmiConfig = createConfig({
    chains: [somniaChain],
    connectors: [injected()],
    transports: {
        [somniaChain.id]: http("https://dream-rpc.somnia.network"),
    },
    ssr: true,
});
