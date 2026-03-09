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

const COLLATERAL_ASSETS = [
    { symbol: "STT", address: "0x0000000000000000000000000000000000000000", icon: "🌐" },
    { symbol: "USDC", address: CONTRACT_ADDRESSES.usdc || "0x7a9dcF9Bb88535C3Eba3bE8FAE4DDF0bF514c2eC", icon: "💵" },
    { symbol: "USDT", address: CONTRACT_ADDRESSES.usdt || "0xE2E35A81135688A394eC0186Ed707A907D2Bf2e4", icon: "💳" },
    { symbol: "WETH", address: CONTRACT_ADDRESSES.weth || "0xF5A764C94ae8Aa62b48AbE2eb66b060A2252C355", icon: "⟠" },
];

const BORROW_ASSETS = [
    { symbol: "USDC", address: CONTRACT_ADDRESSES.usdc || "0x7a9dcF9Bb88535C3Eba3bE8FAE4DDF0bF514c2eC", icon: "💵" },
    { symbol: "USDT", address: CONTRACT_ADDRESSES.usdt || "0xE2E35A81135688A394eC0186Ed707A907D2Bf2e4", icon: "💳" },
    { symbol: "WETH", address: CONTRACT_ADDRESSES.weth || "0xF5A764C94ae8Aa62b48AbE2eb66b060A2252C355", icon: "⟠" },
];

export default function PositionCard({ position, address, txLoading, onDeposit, onBorrow, onRepay }: Props) {
    const [action, setAction] = useState<"deposit" | "borrow" | "repay">("deposit");
    const [amount, setAmount] = useState("");
    const [selectedToken, setSelectedToken] = useState(COLLATERAL_ASSETS[0]);

    if (!address) {
        return (
            <div className="card" style={{ padding: 48, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
                <div className="ai-fab" style={{ position: "static", transform: "none", width: 80, height: 80, fontSize: 32 }}>🛰️</div>
                <div>
                    <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Terminal Disconnected</h3>
                    <p style={{ color: "var(--text-muted)", fontSize: 13, maxWidth: 300, margin: "0 auto" }}>Please connect your wallet to access the ReactorX lending interfaces.</p>
                </div>
            </div>
        );
    }

    const hfStatus = position ? getHealthStatus(position.healthFactor) : null;
    const hf = position ? formatHealthFactor(position.healthFactor) : "—";
    const collateralUsd = position ? parseFloat(formatEther(position.collateral)).toFixed(2) : "0.00";
    const debt = position ? parseFloat(formatEther(position.debt)).toFixed(2) : "0.00";
    const barWidth = hfStatus ? Math.min(100, hfStatus.percent) : 0;
    const isLiquidatable = hfStatus?.label === "LIQUIDATABLE";
    const hasDebt = position && position.debt > 0n;

    const handleAction = () => {
        if (!amount || parseFloat(amount) <= 0) return;
        if (action === "deposit") onDeposit(selectedToken.address, amount, selectedToken.symbol);
        else if (action === "borrow") onBorrow(selectedToken.address, amount, selectedToken.symbol);
        else if (action === "repay") onRepay(selectedToken.address, amount, selectedToken.symbol);
    };

    return (
        <div className="card card-shiny" style={{ display: "flex", flexDirection: "column" }}>
            {/* Header / Health Section */}
            <div style={{ padding: 32, borderBottom: "1px solid rgba(139,92,246,0.1)", background: "rgba(139,92,246,0.02)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Position Intelligence</div>
                    {hasDebt && hfStatus && <span className={`badge ${hfStatus.cssClass}`}>{hfStatus.label}</span>}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
                    <div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Health Factor</div>
                        <div style={{ fontSize: 32, fontWeight: 900, color: hfStatus?.color ?? "white", fontFamily: "JetBrains Mono" }}>{hf}</div>
                        <div className="health-bar-container" style={{ marginTop: 8 }}>
                            <div className="health-bar-fill" style={{ width: `${barWidth}%`, background: hfStatus ? `linear-gradient(90deg, ${hfStatus.color}60, ${hfStatus.color})` : "rgba(255,255,255,0.08)" }} />
                        </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <div>
                            <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase" }}>Total Collateral</div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--reactor-cyan-light)" }}>${collateralUsd}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase" }}>Total Debt</div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--reactor-purple-light)" }}>${debt}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Interaction Section */}
            <div style={{ padding: 32 }}>
                <div className="tab-nav" style={{ marginBottom: 24, padding: 4 }}>
                    {(["deposit", "borrow", "repay"] as const).map(t => (
                        <button
                            key={t}
                            className={`tab-btn ${action === t ? "active" : ""}`}
                            onClick={() => {
                                setAction(t);
                                setAmount("");
                                setSelectedToken(t === "deposit" ? COLLATERAL_ASSETS[0] : BORROW_ASSETS[0]);
                            }}
                            style={{ flex: 1, textTransform: "capitalize" }}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>Select Asset</label>
                            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Somnia Testnet</span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(80px, 1fr))", gap: 10 }}>
                            {(action === "deposit" ? COLLATERAL_ASSETS : BORROW_ASSETS).map(token => (
                                <div
                                    key={token.symbol}
                                    onClick={() => setSelectedToken(token)}
                                    className={`onboarding-step ${selectedToken.symbol === token.symbol ? "completed" : ""}`}
                                    style={{
                                        padding: "10px",
                                        textAlign: "center",
                                        cursor: "pointer",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        gap: 4
                                    }}
                                >
                                    <div style={{ fontSize: 18 }}>{token.icon}</div>
                                    <div style={{ fontSize: 11, fontWeight: 800 }}>{token.symbol}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>Amount to {action}</label>
                            <span
                                style={{ fontSize: 11, color: "var(--reactor-purple-light)", cursor: "pointer", fontWeight: 700 }}
                                onClick={() => setAmount("100")} // Simplified MAX
                            >
                                USE MAX
                            </span>
                        </div>
                        <div style={{ position: "relative" }}>
                            <input
                                className="input-styled"
                                type="number"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                style={{ fontSize: 20, paddingRight: 80 }}
                            />
                            <div style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", fontWeight: 800, color: "var(--text-muted)" }}>
                                {selectedToken.symbol}
                            </div>
                        </div>
                    </div>

                    <button
                        className="btn-primary"
                        onClick={handleAction}
                        disabled={txLoading || !amount || (action === "repay" && !hasDebt)}
                        style={{ width: "100%", height: 54, fontSize: 16 }}
                    >
                        {txLoading ? <span className="spinner" /> : `${action.charAt(0).toUpperCase() + action.slice(1)} ${selectedToken.symbol}`}
                    </button>
                </div>
            </div>
        </div>
    );
}
