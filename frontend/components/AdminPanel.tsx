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
    { label: "$2000 · Normal", value: "2000", color: "#34d399", emoji: "✅" },
    { label: "$1200 · Drop", value: "1200", color: "#fbbf24", emoji: "📉" },
    { label: "$800 · Crash", value: "800", color: "#f87171", emoji: "🔥" },
    { label: "$500 · Nuke!", value: "500", color: "#ef4444", emoji: "💥" },
];

export default function AdminPanel({ stats, txLoading, address, onUpdatePrice, onRegisterSubscription }: Props) {
    const [price, setPrice] = useState("2000");
    const currentPrice = stats ? `$${parseFloat(formatEther(stats.collateralPrice)).toFixed(2)}` : "—";

    return (
        <div className="card card-shiny glow-border-gold" style={{ padding: 28 }}>
            {/* Accent bar */}
            <div className="stat-card-accent" style={{ background: "linear-gradient(90deg,#eab308,#ea580c,transparent)" }} />

            <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 22 }}>
                🎛️ Admin — Demo Controls
            </h2>

            {/* Current price display */}
            <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "12px 16px",
                background: "rgba(234,179,8,0.07)",
                border: "1px solid rgba(234,179,8,0.2)",
                borderRadius: 12, marginBottom: 16,
            }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>Oracle Price (ETH/USD)</span>
                <span style={{ fontFamily: "JetBrains Mono", fontSize: 22, fontWeight: 800, color: "#fde047" }}>
                    {currentPrice}
                </span>
            </div>

            {/* Price presets */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
                {PRICE_PRESETS.map((p) => (
                    <button
                        key={p.value}
                        onClick={() => setPrice(p.value)}
                        style={{
                            background: price === p.value ? `${p.color}18` : "rgba(17,7,0,0.8)",
                            border: `1px solid ${price === p.value ? p.color + "60" : "rgba(59,27,11,0.8)"}`,
                            color: p.color, borderRadius: 10,
                            padding: "10px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer",
                            transition: "all 0.2s", textAlign: "left",
                            display: "flex", alignItems: "center", gap: 6,
                        }}
                    >
                        <span>{p.emoji}</span> {p.label}
                    </button>
                ))}
            </div>

            {/* Custom price + simulate btn */}
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <input
                    id="price-input"
                    className="input-styled"
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Custom price (USD)..."
                    style={{ flex: 1 }}
                />
                <button
                    id="update-price-btn"
                    className="btn-danger"
                    onClick={() => onUpdatePrice(price)}
                    disabled={txLoading || !address}
                    style={{ whiteSpace: "nowrap" }}
                >
                    {txLoading ? <span className="spinner" /> : "💥 Simulate"}
                </button>
            </div>

            <div style={{
                padding: "10px 14px",
                background: "rgba(234,88,12,0.07)",
                border: "1px solid rgba(234,88,12,0.2)",
                borderRadius: 10, marginBottom: 20,
            }}>
                <p style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.7 }}>
                    ⚡ Dropping the price causes <span className="code-chip">PositionUpdated</span> to emit.
                    {" "}The subscribed <span className="code-chip">ReactorEngine</span> reacts <em>automatically</em> via Somnia validators — no bots needed.
                </p>
            </div>

            {/* Subscription control */}
            {!stats?.isSubscribed && (
                <div style={{
                    borderTop: "1px solid rgba(59,27,11,0.8)",
                    paddingTop: 20,
                    display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12,
                }}>
                    <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 4 }}>
                            Somnia Reactivity Subscription
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                            Not registered. Calls Precompile 0x0100 to subscribe.
                        </div>
                    </div>

                    <button
                        id="register-subscription-btn"
                        className="btn-primary"
                        style={{ fontSize: 12, padding: "9px 16px", whiteSpace: "nowrap" }}
                        onClick={onRegisterSubscription}
                        disabled={txLoading || !address}
                    >
                        {txLoading ? <span className="spinner" /> : "🔔 Register"}
                    </button>
                </div>
            )}
        </div>
    );
}
