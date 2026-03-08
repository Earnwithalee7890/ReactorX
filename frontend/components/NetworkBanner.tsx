"use client";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { SOMNIA_TESTNET } from "@/lib/contracts";

export default function NetworkBanner() {
    const { isConnected } = useAccount();
    const chainId = useChainId();
    const { switchChain, isPending } = useSwitchChain();

    if (!isConnected || chainId === SOMNIA_TESTNET.id) return null;

    const handleSwitch = async () => {
        try {
            await switchChain({ chainId: SOMNIA_TESTNET.id });
        } catch {
            // Fallback: addEthereumChain
            if (typeof window !== "undefined" && (window as any).ethereum) {
                try {
                    await (window as any).ethereum.request({
                        method: "wallet_addEthereumChain",
                        params: [{
                            chainId: `0x${SOMNIA_TESTNET.id.toString(16)}`,
                            chainName: SOMNIA_TESTNET.name,
                            nativeCurrency: SOMNIA_TESTNET.nativeCurrency,
                            rpcUrls: [SOMNIA_TESTNET.rpcUrls.default.http[0]],
                            blockExplorerUrls: [SOMNIA_TESTNET.blockExplorers.default.url],
                        }],
                    });
                } catch { /* user rejected */ }
            }
        }
    };

    return (
        <div className="network-banner">
            <span style={{ fontSize: 16 }}>⚠️</span>
            <span>
                Wrong network detected! You are on <strong>Chain {chainId}</strong>. Please switch to{" "}
                <strong>Somnia Testnet (50312)</strong> to use ReactorX.
            </span>
            <button
                onClick={handleSwitch}
                disabled={isPending}
                style={{
                    background: "rgba(239,68,68,0.2)",
                    border: "1px solid rgba(239,68,68,0.5)",
                    color: "#f87171",
                    borderRadius: 8,
                    padding: "5px 14px",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: isPending ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    flexShrink: 0,
                    fontFamily: "'Space Grotesk', sans-serif",
                    transition: "all 0.2s",
                }}
            >
                {isPending ? (
                    <span className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} />
                ) : (
                    "Switch Now →"
                )}
            </button>
        </div>
    );
}
