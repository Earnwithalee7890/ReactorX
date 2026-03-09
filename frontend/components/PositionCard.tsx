"use client";
import React, { useState } from "react";
import { formatEther } from "viem";
import { getHealthStatus, formatHealthFactor } from "@/hooks/useReactorX";
import type { Position } from "@/hooks/useReactorX";
import { CONTRACT_ADDRESSES } from "@/lib/contracts";

interface Props {
    position: Position | null;
    address?: string;
    txLoading: boolean;
    onDeposit: (tokenAddr: string, amount: string, symbol: string) => Promise<unknown>;
    onBorrow: (tokenAddr: string, amount: string, symbol: string) => Promise<unknown>;
    onRepay: (tokenAddr: string, amount: string, symbol: string) => Promise<unknown>;
}

const TOKEN_ICONS: Record<string, string> = {
    STT: "https://somnia.network/favicon.ico",
    USDC: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png",
    USDT: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png",
    WETH: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png",
};

const COLLATERAL_ASSETS = [
    { symbol: "STT", address: "0x0000000000000000000000000000000000000000" },
    { symbol: "USDC", address: CONTRACT_ADDRESSES.usdc || "0x7a9dcF9Bb88535C3Eba3bE8FAE4DDF0bF514c2eC" },
    { symbol: "USDT", address: CONTRACT_ADDRESSES.usdt || "0xE2E35A81135688A394eC0186Ed707A907D2Bf2e4" },
    { symbol: "WETH", address: CONTRACT_ADDRESSES.weth || "0xF5A764C94ae8Aa62b48AbE2eb66b060A2252C355" },
];

const BORROW_ASSETS = [
    { symbol: "STT", address: "0x0000000000000000000000000000000000000000" },
    { symbol: "USDC", address: CONTRACT_ADDRESSES.usdc || "0x7a9dcF9Bb88535C3Eba3bE8FAE4DDF0bF514c2eC" },
    { symbol: "USDT", address: CONTRACT_ADDRESSES.usdt || "0xE2E35A81135688A394eC0186Ed707A907D2Bf2e4" },
    { symbol: "WETH", address: CONTRACT_ADDRESSES.weth || "0xF5A764C94ae8Aa62b48AbE2eb66b060A2252C355" },
];

export default function PositionCard({ position, address, txLoading, onDeposit, onBorrow, onRepay }: Props) {
    const [action, setAction] = useState<"deposit" | "borrow" | "repay">("deposit");
    const [amount, setAmount] = useState("");
    const [selectedToken, setSelectedToken] = useState(COLLATERAL_ASSETS[0]);

    if (!address) {
        return (
            <div className="card" style={{
                padding: 64, textAlign: "center", display: "flex", flexDirection: "column",
                alignItems: "center", gap: 20, background: "linear-gradient(135deg, rgba(2,6,23,0.9), rgba(15,23,42,0.7))",
                border: "1px solid rgba(251,191,36,0.1)"
            }}>
                <div style={{
                    width: 80, height: 80, borderRadius: 24,
                    background: "linear-gradient(135deg, rgba(251,191,36,0.15), rgba(251,191,36,0.05))",
                    border: "1px solid rgba(251,191,36,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36
                }}>🛰️</div>
                <div>
                    <h3 style={{ fontSize: 20, fontWeight: 900, marginBottom: 8, color: "var(--reactor-gold)" }}>Terminal Disconnected</h3>
                    <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, maxWidth: 320, margin: "0 auto", lineHeight: 1.6 }}>
                        Connect your wallet to access Position Intelligence and start earning.
                    </p>
                </div>
            </div>
        );
    }

    const hfStatus = position ? getHealthStatus(position.healthFactor) : null;
    const hf = position ? formatHealthFactor(position.healthFactor) : "—";
    const collateralUsd = position ? parseFloat(formatEther(position.collateral)).toFixed(2) : "0.00";
    const debt = position ? parseFloat(formatEther(position.debt)).toFixed(2) : "0.00";
    const barWidth = hfStatus ? Math.min(100, hfStatus.percent) : 0;
    const hasDebt = position && position.debt > 0n;

    const handleAction = () => {
        if (!amount || parseFloat(amount) <= 0) return;
        if (action === "deposit") onDeposit(selectedToken.address, amount, selectedToken.symbol);
        else if (action === "borrow") onBorrow(selectedToken.address, amount, selectedToken.symbol);
        else if (action === "repay") onRepay(selectedToken.address, amount, selectedToken.symbol);
    };

    const currentAssets = action === "deposit" ? COLLATERAL_ASSETS : BORROW_ASSETS;

    return (
        <div style={{
            borderRadius: 24, overflow: "hidden",
            background: "linear-gradient(135deg, rgba(2,6,23,0.95), rgba(15,23,42,0.8))",
            border: "1px solid rgba(251,191,36,0.12)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.4)"
        }}>
            {/* ── Premium Header with Health Metrics ── */}
            <div style={{
                padding: "32px 32px 28px",
                background: "linear-gradient(135deg, rgba(251,191,36,0.06), rgba(139,92,246,0.04), transparent)",
                borderBottom: "1px solid rgba(251,191,36,0.08)",
                position: "relative"
            }}>
                {/* Top accent line */}
                <div style={{
                    position: "absolute", top: 0, left: 0, right: 0, height: 2,
                    background: "linear-gradient(90deg, var(--reactor-gold), var(--reactor-purple), transparent)"
                }} />

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{
                            width: 40, height: 40, borderRadius: 12,
                            background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)",
                            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20
                        }}>📊</div>
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 900, color: "#fff", letterSpacing: "0.05em" }}>POSITION INTELLIGENCE</div>
                            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>REAL-TIME RISK MONITOR</div>
                        </div>
                    </div>
                    {hfStatus && (
                        <span style={{
                            padding: "6px 16px", borderRadius: 20, fontSize: 11, fontWeight: 800,
                            letterSpacing: "0.08em",
                            background: `${hfStatus.color}15`, color: hfStatus.color,
                            border: `1px solid ${hfStatus.color}40`,
                            boxShadow: `0 0 20px ${hfStatus.color}15`
                        }}>
                            {hfStatus.label}
                        </span>
                    )}
                </div>

                {/* Health Factor + Collateral/Debt */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                    <div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 6, fontWeight: 700, letterSpacing: "0.06em" }}>
                            HEALTH FACTOR
                        </div>
                        <div style={{
                            fontSize: 40, fontWeight: 900, fontFamily: "'JetBrains Mono', monospace",
                            color: hfStatus?.color ?? "rgba(255,255,255,0.3)",
                            lineHeight: 1,
                            textShadow: hfStatus ? `0 0 30px ${hfStatus.color}40` : "none"
                        }}>
                            {hf}
                        </div>
                        <div className="health-bar-container" style={{ marginTop: 12, height: 8 }}>
                            <div className="health-bar-fill" style={{
                                width: `${barWidth}%`,
                                background: hfStatus
                                    ? `linear-gradient(90deg, ${hfStatus.color}80, ${hfStatus.color})`
                                    : "rgba(255,255,255,0.08)",
                                boxShadow: hfStatus ? `0 0 12px ${hfStatus.color}40` : "none"
                            }} />
                        </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <div style={{
                            padding: "14px 16px", borderRadius: 14,
                            background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)"
                        }}>
                            <div style={{ fontSize: 10, color: "rgba(16,185,129,0.7)", fontWeight: 700, letterSpacing: "0.1em", marginBottom: 4 }}>TOTAL COLLATERAL</div>
                            <div style={{ fontSize: 22, fontWeight: 900, color: "#34d399" }}>${collateralUsd}</div>
                        </div>
                        <div style={{
                            padding: "14px 16px", borderRadius: 14,
                            background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.15)"
                        }}>
                            <div style={{ fontSize: 10, color: "rgba(139,92,246,0.7)", fontWeight: 700, letterSpacing: "0.1em", marginBottom: 4 }}>TOTAL DEBT</div>
                            <div style={{ fontSize: 22, fontWeight: 900, color: "#a78bfa" }}>${debt}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Action Tabs ── */}
            <div style={{ padding: "24px 32px 32px" }}>
                <div style={{
                    display: "flex", gap: 4, padding: 4,
                    background: "rgba(0,0,0,0.4)", borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.06)",
                    marginBottom: 24
                }}>
                    {(["deposit", "borrow", "repay"] as const).map(t => (
                        <button
                            key={t}
                            onClick={() => {
                                setAction(t);
                                setAmount("");
                                setSelectedToken(t === "deposit" ? COLLATERAL_ASSETS[0] : BORROW_ASSETS[0]);
                            }}
                            style={{
                                flex: 1, padding: "12px", borderRadius: 11,
                                border: "none", cursor: "pointer",
                                fontSize: 13, fontWeight: 700,
                                textTransform: "capitalize",
                                fontFamily: "'Space Grotesk', sans-serif",
                                transition: "all 0.2s",
                                background: action === t ? "rgba(251,191,36,0.15)" : "transparent",
                                color: action === t ? "var(--reactor-gold)" : "rgba(255,255,255,0.4)",
                                borderBottom: action === t ? "2px solid var(--reactor-gold)" : "2px solid transparent"
                            }}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                {/* Asset Selector with Real Icons */}
                <div style={{ marginBottom: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                        <label style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>Select Asset</label>
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>Somnia Testnet</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: `repeat(${currentAssets.length}, 1fr)`, gap: 8 }}>
                        {currentAssets.map(token => (
                            <div
                                key={token.symbol}
                                onClick={() => setSelectedToken(token)}
                                style={{
                                    padding: "14px 8px",
                                    textAlign: "center",
                                    cursor: "pointer",
                                    borderRadius: 14,
                                    border: selectedToken.symbol === token.symbol
                                        ? "1px solid rgba(251,191,36,0.4)"
                                        : "1px solid rgba(255,255,255,0.08)",
                                    background: selectedToken.symbol === token.symbol
                                        ? "rgba(251,191,36,0.08)"
                                        : "rgba(255,255,255,0.02)",
                                    transition: "all 0.2s",
                                    display: "flex", flexDirection: "column",
                                    alignItems: "center", gap: 8
                                }}
                            >
                                <div style={{
                                    width: 32, height: 32, borderRadius: "50%",
                                    overflow: "hidden", background: "rgba(255,255,255,0.05)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    border: selectedToken.symbol === token.symbol
                                        ? "2px solid rgba(251,191,36,0.4)"
                                        : "2px solid transparent"
                                }}>
                                    <img
                                        src={TOKEN_ICONS[token.symbol]}
                                        alt={token.symbol}
                                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                    />
                                </div>
                                <div style={{
                                    fontSize: 12, fontWeight: 800,
                                    color: selectedToken.symbol === token.symbol
                                        ? "var(--reactor-gold)" : "rgba(255,255,255,0.6)"
                                }}>
                                    {token.symbol}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Amount Input */}
                <div style={{ marginBottom: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <label style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>Amount to {action}</label>
                        <span
                            style={{
                                fontSize: 11, color: "var(--reactor-gold)", cursor: "pointer",
                                fontWeight: 800, letterSpacing: "0.04em"
                            }}
                            onClick={() => setAmount("100")}
                        >
                            USE MAX
                        </span>
                    </div>
                    <div style={{
                        position: "relative", background: "rgba(0,0,0,0.4)",
                        borderRadius: 14, border: "1px solid rgba(255,255,255,0.08)",
                        overflow: "hidden"
                    }}>
                        <input
                            type="number"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            style={{
                                width: "100%", background: "transparent",
                                border: "none", color: "#fff",
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: 22, fontWeight: 800,
                                padding: "16px 80px 16px 20px",
                                outline: "none"
                            }}
                        />
                        <div style={{
                            position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)",
                            display: "flex", alignItems: "center", gap: 8
                        }}>
                            <img
                                src={TOKEN_ICONS[selectedToken.symbol]}
                                alt="" style={{ width: 20, height: 20, borderRadius: "50%" }}
                            />
                            <span style={{ fontWeight: 800, color: "rgba(255,255,255,0.5)", fontSize: 14 }}>
                                {selectedToken.symbol}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Action Button */}
                <button
                    onClick={handleAction}
                    disabled={txLoading || !amount || (action === "repay" && !hasDebt)}
                    style={{
                        width: "100%", height: 56, fontSize: 16, fontWeight: 800,
                        borderRadius: 16, border: "none", cursor: "pointer",
                        fontFamily: "'Space Grotesk', sans-serif",
                        letterSpacing: "0.02em",
                        background: action === "deposit"
                            ? "linear-gradient(135deg, #10b981, #059669)"
                            : action === "borrow"
                                ? "linear-gradient(135deg, var(--reactor-purple), #6d28d9)"
                                : "linear-gradient(135deg, var(--reactor-gold), #d97706)",
                        color: "#fff",
                        boxShadow: action === "deposit"
                            ? "0 4px 20px rgba(16,185,129,0.3)"
                            : action === "borrow"
                                ? "0 4px 20px rgba(139,92,246,0.3)"
                                : "0 4px 20px rgba(251,191,36,0.3)",
                        opacity: (txLoading || !amount) ? 0.5 : 1,
                        transition: "all 0.3s ease"
                    }}
                >
                    {txLoading ? <span className="spinner" /> : `${action.charAt(0).toUpperCase() + action.slice(1)} ${selectedToken.symbol}`}
                </button>
            </div>
        </div>
    );
}
