"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from "wagmi";
import { SOMNIA_TESTNET } from "@/lib/contracts";

// ─── Wallet definitions ────────────────────────────────────────────────────
type WalletEntry = {
    id: string;
    name: string;
    icon: string;
    /** connector id from wagmi */
    connectorId: string;
    /** How to detect if the wallet is installed in extension context */
    detect?: () => boolean;
    /** Extra tooltip */
    hint?: string;
};

const WALLETS: WalletEntry[] = [
    {
        id: "metamask",
        name: "MetaMask",
        icon: "🦊",
        connectorId: "metaMask",
        detect: () => !!(window as any).ethereum?.isMetaMask,
        hint: "Browser extension",
    },
    {
        id: "okx-extension",
        name: "OKX Wallet",
        icon: "⭕",
        connectorId: "com.okex.wallet",
        detect: () => !!(window as any).okxwallet,
        hint: "Extension / DApp browser",
    },
    {
        id: "bitget",
        name: "Bitget Wallet",
        icon: "🅱️",
        connectorId: "com.bitget.web3wallet",
        detect: () => !!(window as any).bitkeep?.ethereum,
        hint: "Extension / DApp browser",
    },
    {
        id: "injected",
        name: "Injected Wallet",
        icon: "🔌",
        connectorId: "injected",
        detect: () => !!(window as any).ethereum,
        hint: "Any EVM wallet (DApp browser, etc.)",
    },
];

// ─── WalletModal ──────────────────────────────────────────────────────────
function WalletModal({ onClose }: { onClose: () => void }) {
    const { connect, connectors, error, isPending } = useConnect();
    const [connectingId, setConnectingId] = useState<string | null>(null);
    const [detected, setDetected] = useState<Record<string, boolean>>({});
    const [connectError, setConnectError] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const map: Record<string, boolean> = {};
        WALLETS.forEach((w) => {
            map[w.id] = w.detect?.() ?? false;
        });
        setDetected(map);
    }, []);

    useEffect(() => {
        if (error) setConnectError(error.message);
    }, [error]);

    const handleConnect = async (wallet: WalletEntry) => {
        setConnectError(null);
        setConnectingId(wallet.id);
        try {
            // Find matching connector by id or name fallback
            let connector = connectors.find((c) => c.id === wallet.connectorId);
            if (!connector) connector = connectors.find((c) => c.name?.toLowerCase().includes(wallet.name.toLowerCase()));
            if (!connector) connector = connectors.find((c) => c.id === "injected"); // last resort

            if (!connector) {
                setConnectError(`No connector found for ${wallet.name}. Please install the wallet.`);
                setConnectingId(null);
                return;
            }
            connect({ connector });
            // Modal closes via account state change in parent
            setTimeout(onClose, 1500);
        } catch (e: any) {
            setConnectError(e?.message ?? "Connection failed");
            setConnectingId(null);
        }
    };

    return (
        <div
            style={{
                position: "fixed", inset: 0, zIndex: 9999,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)",
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: "linear-gradient(145deg,rgba(20,8,0,0.98),rgba(10,4,0,0.99))",
                    border: "1px solid rgba(234,88,12,0.35)",
                    borderRadius: 24,
                    padding: "32px 28px",
                    width: "100%", maxWidth: 420,
                    boxShadow: "0 40px 80px -10px rgba(0,0,0,0.9), 0 0 60px rgba(234,88,12,0.1)",
                    animation: "scale-in 0.25s cubic-bezier(0.4,0,0.2,1)",
                    position: "relative",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Top shimmer */}
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg,transparent,rgba(234,88,12,0.7),rgba(234,179,8,0.5),transparent)", borderRadius: "24px 24px 0 0" }} />

                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                    <div>
                        <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.03em" }} className="gradient-text-purple">
                            Connect Wallet
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                            Connect to Somnia Testnet (ChainID: {SOMNIA_TESTNET.id})
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "6px 10px", color: "var(--text-muted)", cursor: "pointer", fontSize: 14, lineHeight: 1 }}>✕</button>
                </div>

                {/* Wallet list */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {WALLETS.map((w) => {
                        const isDetected = detected[w.id];
                        const isConnecting = connectingId === w.id && isPending;
                        return (
                            <button
                                key={w.id}
                                onClick={() => handleConnect(w)}
                                disabled={isPending}
                                style={{
                                    display: "flex", alignItems: "center", gap: 14,
                                    background: isDetected ? "rgba(234,88,12,0.06)" : "rgba(255,255,255,0.02)",
                                    border: `1px solid ${isDetected ? "rgba(234,88,12,0.3)" : "rgba(255,255,255,0.07)"}`,
                                    borderRadius: 14, padding: "14px 18px",
                                    cursor: isPending ? "not-allowed" : "pointer",
                                    transition: "all 0.2s ease",
                                    opacity: isPending && connectingId !== w.id ? 0.5 : 1,
                                    textAlign: "left",
                                    width: "100%",
                                }}
                                onMouseOver={(e) => { if (!isPending) e.currentTarget.style.borderColor = "rgba(234,88,12,0.5)"; e.currentTarget.style.background = "rgba(234,88,12,0.1)"; }}
                                onMouseOut={(e) => { e.currentTarget.style.borderColor = isDetected ? "rgba(234,88,12,0.3)" : "rgba(255,255,255,0.07)"; e.currentTarget.style.background = isDetected ? "rgba(234,88,12,0.06)" : "rgba(255,255,255,0.02)"; }}
                            >
                                <span style={{ fontSize: 26, lineHeight: 1 }}>{w.icon}</span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{w.name}</div>
                                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{w.hint}</div>
                                </div>
                                {isConnecting ? (
                                    <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                                ) : isDetected ? (
                                    <span style={{ fontSize: 10, background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", color: "#34d399", borderRadius: 6, padding: "3px 8px", fontWeight: 700 }}>DETECTED</span>
                                ) : (
                                    <span style={{ fontSize: 10, color: "var(--text-muted)", borderRadius: 6, padding: "3px 8px" }}>Not found</span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Error display */}
                {connectError && (
                    <div style={{ marginTop: 16, padding: "10px 14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, fontSize: 12, color: "#f87171", lineHeight: 1.6 }}>
                        ❌ {connectError.includes("rejected") || connectError.includes("denied") ? "Connection rejected by user." : connectError}
                    </div>
                )}

                {/* Footer note */}
                <div style={{ marginTop: 20, padding: "10px 14px", background: "rgba(234,88,12,0.05)", border: "1px solid rgba(234,88,12,0.1)", borderRadius: 10 }}>
                    <p style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.7 }}>
                        ℹ️ Using a DApp browser? Your wallet is automatically detected. After connecting, the app will prompt you to switch to <strong style={{ color: "var(--text-secondary)" }}>Somnia Testnet (50312)</strong>.
                    </p>
                </div>
            </div>
        </div>
    );
}

// ─── Main Header ──────────────────────────────────────────────────────────
export default function Header() {
    const { address, isConnected, connector } = useAccount();
    const { disconnect } = useDisconnect();
    const chainId = useChainId();
    const { switchChain, isPending: isSwitching } = useSwitchChain();
    const [showModal, setShowModal] = useState(false);
    const [copied, setCopied] = useState(false);
    const [hasPrompted, setHasPrompted] = useState(false);

    const wrongNetwork = isConnected && chainId !== SOMNIA_TESTNET.id;

    // Auto-close modal when connected
    useEffect(() => {
        if (isConnected) setShowModal(false);
    }, [isConnected]);

    const handleCopy = () => {
        if (address) {
            navigator.clipboard.writeText(address).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
            });
        }
    };

    const handleSwitchNetwork = async () => {
        try {
            await switchChain({ chainId: SOMNIA_TESTNET.id });
        } catch (e: any) {
            // If switch fails (DApp wallet doesn't support), try adding
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

    // Auto-prompt to switch network if wrong network upon connect
    useEffect(() => {
        if (isConnected && wrongNetwork && !hasPrompted) {
            setHasPrompted(true);
            handleSwitchNetwork();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isConnected, wrongNetwork, hasPrompted]);

    return (
        <>
            <header
                className="header-blur"
                style={{
                    position: "sticky", top: 0, zIndex: 200,
                    padding: "0 16px", height: 68,
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                }}
            >
                {/* ── Logo + Brand ── */}
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div
                        style={{
                            position: "relative", width: 42, height: 42,
                            borderRadius: 12,
                            background: "linear-gradient(135deg,#ea580c,#eab308)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            boxShadow: "0 0 24px rgba(234,88,12,0.6), 0 0 60px rgba(234,179,8,0.2)",
                            flexShrink: 0,
                        }}
                    >
                        <Image
                            src="/brand-logo.png"
                            alt="ReactorX"
                            width={42}
                            height={42}
                            style={{ borderRadius: 12, objectFit: "cover" }}
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                            priority
                        />
                        <div style={{ position: "absolute", inset: -2, borderRadius: 14, border: "1px solid rgba(249,115,22,0.5)", pointerEvents: "none" }} />
                    </div>

                    <div>
                        <div style={{ fontWeight: 800, fontSize: 20, letterSpacing: "-0.03em", lineHeight: 1 }} className="gradient-text-purple">
                            ReactorX
                        </div>
                        <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 2 }} className="hide-mobile">
                            Autonomous Liquidation Engine
                        </div>
                    </div>
                </div>

                {/* ── Right controls ── */}
                <nav style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {/* Faucet Link */}
                    <a
                        href="https://testnet.somnia.network"
                        target="_blank" rel="noopener noreferrer"
                        className="btn-secondary hide-mobile"
                        style={{ padding: "8px 16px", fontSize: 12, textDecoration: "none" }}
                        title="Get Free Testnet STT"
                    >
                        💧 Faucet
                    </a>

                    {/* Live badge */}
                    <span className="badge badge-cyan hide-mobile" style={{ fontSize: 11 }}>
                        <span className="dot-pulse cyan" />
                        Reactivity Live
                    </span>

                    {/* Wrong network warning */}
                    {wrongNetwork && (
                        <button
                            className="btn-danger"
                            style={{ padding: "8px 16px", fontSize: 12, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.5)", color: "#f87171" }}
                            onClick={handleSwitchNetwork}
                            disabled={isSwitching}
                            title="Switch to Somnia Testnet"
                        >
                            {isSwitching ? <span className="spinner" /> : "⚠️ Switch Network"}
                        </button>
                    )}

                    {/* Add network (not connected) */}
                    {!isConnected && (
                        <button
                            style={{ padding: "8px 16px", fontSize: 12, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", color: "#34d399", borderRadius: 10, cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s" }}
                            onClick={handleSwitchNetwork}
                            title="Add Somnia Testnet to your wallet"
                            className="hide-mobile"
                        >
                            ➕ Add Chain
                        </button>
                    )}

                    {!isConnected ? (
                        <button
                            id="connect-wallet-btn"
                            className="btn-primary"
                            style={{ padding: "9px 22px", fontSize: 13 }}
                            onClick={() => setShowModal(true)}
                        >
                            🔌 Connect Wallet
                        </button>
                    ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {/* Connected wallet pill */}
                            <button
                                onClick={handleCopy}
                                title={copied ? "Copied!" : "Click to copy address"}
                                style={{
                                    background: "rgba(234,88,12,0.1)",
                                    border: "1px solid rgba(234,88,12,0.3)",
                                    borderRadius: 10, padding: "7px 14px",
                                    display: "flex", alignItems: "center", gap: 8,
                                    cursor: "pointer", transition: "all 0.2s",
                                }}
                            >
                                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 8px #10b981", display: "inline-block" }} />
                                <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#f97316" }}>
                                    {address?.slice(0, 6)}…{address?.slice(-4)}
                                </span>
                                {copied && <span style={{ fontSize: 10, color: "#10b981" }}>✓</span>}
                            </button>

                            {/* Connector badge */}
                            {connector?.name && (
                                <span className="badge badge-dark hide-mobile" style={{ fontSize: 10 }}>
                                    {connector.name}
                                </span>
                            )}

                            <button
                                className="btn-secondary"
                                style={{ padding: "7px 14px", fontSize: 12 }}
                                onClick={() => disconnect()}
                            >
                                Disconnect
                            </button>
                        </div>
                    )}
                </nav>
            </header>

            {showModal && <WalletModal onClose={() => setShowModal(false)} />}
        </>
    );
}
