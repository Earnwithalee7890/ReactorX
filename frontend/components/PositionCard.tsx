"use client";
import { useState } from "react";
import { formatEther } from "viem";
import { getHealthStatus, formatHealthFactor } from "@/hooks/useReactorX";
import type { Position } from "@/hooks/useReactorX";

interface Props {
    position: Position | null;
    address?: string;
    txLoading: boolean;
    onDeposit: (a: string) => Promise<unknown>;
    onBorrow: (a: string) => Promise<unknown>;
}

export default function PositionCard({ position, address, txLoading, onDeposit, onBorrow }: Props) {
    const [depositAmount, setDepositAmount] = useState("10");
    const [borrowAmount, setBorrowAmount] = useState("5000");

    if (!address) {
        return (
            <div className="card glow-border-orange" style={{ padding: 36, textAlign: "center" }}>
                <div style={{ fontSize: 52, marginBottom: 16 }}>🔌</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>
                    Connect Your Wallet
                </div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.7 }}>
                    Connect MetaMask to Somnia Testnet to view and manage your lending position.
                </div>
            </div>
        );
    }

    const hfStatus = position ? getHealthStatus(position.healthFactor) : null;
    const hf = position ? formatHealthFactor(position.healthFactor) : "—";
    const collateral = position ? parseFloat(formatEther(position.collateral)).toFixed(4) : "0.0000";
    const debt = position ? parseFloat(formatEther(position.debt)).toFixed(2) : "0.00";
    const barWidth = hfStatus ? Math.min(100, hfStatus.percent) : 0;
    const isLiquidatable = hfStatus?.label === "LIQUIDATABLE";
    const hasDebt = position && position.debt > 0n;

    return (
        <div
            className={`card card-shiny ${isLiquidatable ? "glow-border-red" : "glow-border-orange"}`}
            style={{ padding: 28 }}
        >
            {/* Accent bar */}
            <div
                className="stat-card-accent"
                style={{ background: isLiquidatable ? "linear-gradient(90deg,#ef4444,#dc2626, transparent)" : "linear-gradient(90deg,#ea580c,#eab308,transparent)" }}
            />

            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
                <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>
                    My Position
                </h2>
                {hasDebt && hfStatus && (
                    <span className={`badge ${hfStatus.cssClass}`}>{hfStatus.label}</span>
                )}
            </div>

            {/* Health Factor */}
            <div style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>Health Factor</span>
                    <span
                        style={{
                            fontFamily: "JetBrains Mono, monospace",
                            fontSize: 26, fontWeight: 800,
                            color: hfStatus?.color ?? "var(--text-muted)",
                        }}
                    >
                        {hf}
                    </span>
                </div>
                <div className="health-bar-container">
                    <div
                        className="health-bar-fill"
                        style={{
                            width: `${barWidth}%`,
                            background: hfStatus
                                ? `linear-gradient(90deg, ${hfStatus.color}60, ${hfStatus.color})`
                                : "rgba(255,255,255,0.08)",
                        }}
                    />
                </div>

                {isLiquidatable && (
                    <div style={{
                        marginTop: 12, padding: "10px 14px",
                        background: "rgba(239,68,68,0.1)",
                        border: "1px solid rgba(239,68,68,0.3)",
                        borderRadius: 10,
                        display: "flex", alignItems: "center", gap: 8,
                    }}>
                        <span style={{ fontSize: 16 }}>⚡</span>
                        <span style={{ fontSize: 12, color: "#f87171", fontWeight: 600 }}>
                            ReactorEngine will auto-liquidate this position!
                        </span>
                    </div>
                )}
            </div>

            {/* Stats grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 22 }}>
                {[
                    { label: "Collateral", value: `${collateral} ETH`, icon: "💎", color: "#fde047" },
                    { label: "Debt", value: `${debt} USDC`, icon: "💸", color: "#fbbf24" },
                ].map((item) => (
                    <div
                        key={item.label}
                        style={{
                            background: "rgba(17,7,0,0.7)",
                            border: "1px solid rgba(59,27,11,0.8)",
                            borderRadius: 12, padding: "14px 16px",
                        }}
                    >
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                            {item.icon} {item.label}
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: item.color, fontFamily: "JetBrains Mono" }}>
                            {item.value}
                        </div>
                    </div>
                ))}
            </div>

            {/* Action rows */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {/* Deposit */}
                <div>
                    <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 6, fontWeight: 700, letterSpacing: "0.06em" }}>
                        DEPOSIT COLLATERAL (ETH)
                    </label>
                    <div style={{ display: "flex", gap: 8 }}>
                        <input id="deposit-amount" className="input-styled" type="number" value={depositAmount}
                            onChange={(e) => setDepositAmount(e.target.value)} min="0" step="1" style={{ flex: 1 }} />
                        <button id="deposit-btn" className="btn-primary" style={{ whiteSpace: "nowrap", padding: "0 20px" }}
                            onClick={() => onDeposit(depositAmount)} disabled={txLoading}>
                            {txLoading ? <span className="spinner" /> : "Deposit"}
                        </button>
                    </div>
                </div>

                {/* Borrow */}
                <div>
                    <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 6, fontWeight: 700, letterSpacing: "0.06em" }}>
                        BORROW USDC
                    </label>
                    <div style={{ display: "flex", gap: 8 }}>
                        <input id="borrow-amount" className="input-styled" type="number" value={borrowAmount}
                            onChange={(e) => setBorrowAmount(e.target.value)} min="0" step="100" style={{ flex: 1 }} />
                        <button id="borrow-btn" className="btn-secondary" style={{ whiteSpace: "nowrap", padding: "0 20px" }}
                            onClick={() => onBorrow(borrowAmount)} disabled={txLoading}>
                            {txLoading ? <span className="spinner" /> : "Borrow"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
