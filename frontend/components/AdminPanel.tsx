"use client";
import { useState } from "react";
import { formatEther } from "viem";
import type { ProtocolStats } from "@/hooks/useReactorX";

interface Props {
    stats: ProtocolStats | null;
    txLoading: boolean;
    address?: string;
    onUpdatePrice: (p: string) => Promise<unknown>;
    onRegisterSubscription: () => Promise<unknown>;
}

const PRICE_PRESETS = [
    { label: "Stability ($2000)", value: "2000", color: "#10b981", emoji: "💎" },
    { label: "Volatile ($1200)", value: "1200", color: "#f59e0b", emoji: "📉" },
    { label: "Flash Crash ($800)", value: "800", color: "#ef4444", emoji: "🔥" },
    { label: "System Nuke ($500)", value: "500", color: "#f43f5e", emoji: "💥" },
];

export default function AdminPanel({ stats, txLoading, address, onUpdatePrice, onRegisterSubscription }: Props) {
    const [price, setPrice] = useState("2000");
    const currentPrice = stats ? `$${parseFloat(formatEther(stats.collateralPrice)).toFixed(2)}` : "—";

    return (
        <div className="card card-shiny" style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ padding: 24, borderBottom: "1px solid rgba(139,92,246,0.1)", background: "rgba(139,92,246,0.02)" }}>
                <h2 style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>
                    🛰️ Protocol Simulator
                </h2>
            </div>

            <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
                {/* Oracle Price Status */}
                <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "16px", background: "rgba(0,0,0,0.3)", borderRadius: 12, border: "1px solid rgba(139,92,246,0.1)"
                }}>
                    <div>
                        <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700 }}>STT/USD ORACLE PULSE</div>
                        <div style={{ fontSize: 24, fontWeight: 900, color: "var(--reactor-cyan)", fontFamily: "JetBrains Mono" }}>{currentPrice}</div>
                    </div>
                    <div className="dot-pulse green"></div>
                </div>

                {/* Scenario Selection */}
                <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8, display: "block" }}>Impact Scenarios</label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        {PRICE_PRESETS.map((p) => (
                            <button
                                key={p.value}
                                onClick={() => setPrice(p.value)}
                                style={{
                                    background: price === p.value ? `${p.color}20` : "rgba(139,92,246,0.03)",
                                    border: `1px solid ${price === p.value ? p.color : "rgba(139,92,246,0.1)"}`,
                                    color: price === p.value ? "white" : "var(--text-muted)",
                                    borderRadius: 10, padding: "12px", fontSize: 12, fontWeight: 700, cursor: "pointer",
                                    transition: "all 0.2s", textAlign: "left", display: "flex", alignItems: "center", gap: 8
                                }}
                            >
                                <span>{p.emoji}</span> {p.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Simulation Button */}
                <div style={{ display: "flex", gap: 10 }}>
                    <div style={{ flex: 1, position: "relative" }}>
                        <input
                            className="input-styled"
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            style={{ paddingRight: 60 }}
                        />
                        <div style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", fontSize: 11, fontWeight: 700, color: "var(--text-muted)" }}>USD</div>
                    </div>
                    <button
                        className="btn-danger"
                        onClick={() => onUpdatePrice(price)}
                        disabled={txLoading || !address}
                        style={{ whiteSpace: "nowrap", padding: "0 24px" }}
                    >
                        {txLoading ? <span className="spinner" /> : "EXECUTE"}
                    </button>
                </div>

                <div className="onboarding-step" style={{ padding: 14 }}>
                    <p style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.6 }}>
                        💡 <strong>Simulation Note:</strong> Dropping the price below $1000 will likely trigger liquidations for high-leverage positions. On Somnia, these are handled by the validator set <em>instantly</em>.
                    </p>
                </div>

                {/* Reactive Subscription Status */}
                {stats && !stats.isSubscribed && (
                    <div style={{ marginTop: 12, padding: 20, background: "rgba(234,179,8,0.05)", border: "1px solid rgba(234,179,8,0.2)", borderRadius: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                            <div style={{ fontSize: 13, fontWeight: 800, color: "#fde047" }}>SUBSCRIPTION INACTIVE</div>
                            <span className="dot-pulse yellow"></span>
                        </div>
                        <p style={{ fontSize: 11, color: "rgba(253,224,71,0.7)", marginBottom: 16 }}>
                            ReactorEngine needs an active subscription to STT/USD price changes to work autonomously.
                        </p>
                        <button
                            className="btn-primary"
                            onClick={onRegisterSubscription}
                            disabled={txLoading || !address}
                            style={{ width: "100%", background: "#f59e0b", color: "black", boxShadow: "0 0 20px rgba(245,158,11,0.2)" }}
                        >
                            {txLoading ? <span className="spinner" /> : "REGISTER WITH PRECOMPILE"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
