"use client";
import Image from "next/image";
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from "wagmi";
import { injected } from "wagmi/connectors";
import { SOMNIA_TESTNET } from "@/lib/contracts";

export default function Header() {
    const { address, isConnected } = useAccount();
    const { connect, connectors } = useConnect();
    const { disconnect } = useDisconnect();
    const chainId = useChainId();
    const { switchChain } = useSwitchChain();
    const wrongNetwork = isConnected && chainId !== SOMNIA_TESTNET.id;

    return (
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
                    {/* Try image logo, fallback to emoji */}
                    <Image
                        src="/brand-logo.png"
                        alt="ReactorX"
                        width={42}
                        height={42}
                        style={{ borderRadius: 12, objectFit: "cover" }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        priority
                    />
                    {/* Glow ring */}
                    <div
                        style={{
                            position: "absolute", inset: -2, borderRadius: 14,
                            border: "1px solid rgba(249,115,22,0.5)",
                            pointerEvents: "none",
                        }}
                    />
                </div>

                <div>
                    <div
                        style={{ fontWeight: 800, fontSize: 20, letterSpacing: "-0.03em", lineHeight: 1 }}
                        className="gradient-text-purple"
                    >
                        ReactorX
                    </div>
                    <div style={{
                        fontSize: 10, color: "var(--text-muted)",
                        letterSpacing: "0.12em", textTransform: "uppercase",
                        marginTop: 2,
                    }} className="hide-mobile">
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
                {/* Add/Switch Network */}
                {(!isConnected || wrongNetwork) && (
                    <button
                        className="btn-danger"
                        style={{ padding: "8px 16px", fontSize: 12, background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.5)", color: "#10b981" }}
                        onClick={() => switchChain({ chainId: SOMNIA_TESTNET.id })}
                        title="Add/Switch to Somnia Testnet"
                    >
                        ➕ Add/Switch Somnia Chain
                    </button>
                )}

                {!isConnected ? (
                    <button
                        id="connect-wallet-btn"
                        className="btn-primary"
                        style={{ padding: "9px 22px", fontSize: 13 }}
                        onClick={() => connect({ connector: injected() })}
                    >
                        🔌 Connect Wallet
                    </button>
                ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{
                            background: "rgba(234,88,12,0.1)",
                            border: "1px solid rgba(234,88,12,0.3)",
                            borderRadius: 10, padding: "7px 14px",
                            display: "flex", alignItems: "center", gap: 8,
                        }}>
                            <span style={{
                                width: 8, height: 8, borderRadius: "50%",
                                background: "#10b981",
                                boxShadow: "0 0 8px #10b981",
                                display: "inline-block",
                            }} />
                            <span style={{
                                fontFamily: "JetBrains Mono, monospace",
                                fontSize: 12, color: "#f97316",
                            }}>
                                {address?.slice(0, 6)}…{address?.slice(-4)}
                            </span>
                        </div>
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
        </header >
    );
}
