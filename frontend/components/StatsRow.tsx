"use client";
import { formatEther } from "viem";
import type { ProtocolStats } from "@/hooks/useReactorX";

interface Props { stats: ProtocolStats | null; }

const STAT_INFO: Record<string, string> = {
    "Oracle Feed": "Real-time STT/USD price from the on-chain oracle. This price determines collateral values and triggers liquidations.",
    "Total Reactions": "Number of times Somnia's Native Reactivity auto-triggered an action. Each 'reaction' is an autonomous liquidation check fired by the blockchain itself — no bots needed!",
    "Liquidations": "Total positions forcefully closed by the Reactor Engine when Health Factor dropped below 1.0. Higher = more protocol solvency protection.",
    "Subscription": "Status of the Reactive Subscription to Somnia's precompile. When ACTIVE, the protocol auto-monitors all price changes on-chain.",
};

export default function StatsRow({ stats }: Props) {
    const price = stats ? `$${parseFloat(formatEther(stats.collateralPrice)).toFixed(2)}` : null;

    const items = [
        {
            label: "Oracle Feed",
            value: price,
            icon: "📊",
            color: "#fbbf24",
            sub: "STT/USD Real-time Price",
            trend: "STABLE",
            trendColor: "#10b981"
        },
        {
            label: "Total Reactions",
            value: stats?.totalReactions?.toString() ?? null,
            icon: "⚡",
            color: "#818cf8",
            sub: "Autonomous on-chain triggers",
            trend: stats?.totalReactions && stats.totalReactions > 0n ? `${stats.totalReactions} fired` : "Awaiting",
            trendColor: stats?.totalReactions && stats.totalReactions > 0n ? "#10b981" : "#fbbf24"
        },
        {
            label: "Liquidations",
            value: stats?.totalLiquidations?.toString() ?? null,
            icon: "🛡️",
            color: "#f87171",
            sub: "Protocol solvency events",
            trend: stats?.totalLiquidations && stats.totalLiquidations > 0n ? "Active" : "Secure",
            trendColor: stats?.totalLiquidations && stats.totalLiquidations > 0n ? "#f87171" : "#10b981"
        },
        {
            label: "Subscription",
            value: stats == null ? null : stats.isSubscribed ? "ACTIVE" : "OFFLINE",
            icon: "🛰️",
            color: stats?.isSubscribed ? "#10b981" : "#fbbf24",
            sub: stats?.isSubscribed ? `Subscription ID: #${stats.subscriptionId}` : "Registration required",
            trend: stats?.isSubscribed ? "ONLINE" : "SETUP NEEDED",
            trendColor: stats?.isSubscribed ? "#10b981" : "#ef4444"
        },
    ];

    return (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
            {items.map((item) => (
                <div
                    key={item.label}
                    className="animate-scale-in"
                    title={STAT_INFO[item.label]}
                    style={{
                        padding: "28px",
                        borderRadius: 20,
                        background: "linear-gradient(135deg, rgba(15,23,42,0.8), rgba(2,6,23,0.95))",
                        border: "1px solid rgba(251,191,36,0.08)",
                        position: "relative",
                        overflow: "hidden",
                        cursor: "help",
                        transition: "all 0.3s ease"
                    }}
                >
                    {/* Top accent */}
                    <div style={{
                        position: "absolute", top: 0, left: 0, right: 0, height: 2,
                        background: `linear-gradient(90deg, ${item.color}, transparent)`,
                        opacity: 0.5
                    }} />

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                        <div style={{
                            width: 44, height: 44,
                            background: `${item.color}12`,
                            borderRadius: 14,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 22,
                            border: `1px solid ${item.color}25`
                        }}>
                            {item.icon}
                        </div>
                        <div style={{
                            display: "flex", alignItems: "center", gap: 6,
                            padding: "4px 10px", borderRadius: 20,
                            background: `${item.trendColor}12`,
                            border: `1px solid ${item.trendColor}25`
                        }}>
                            <div style={{
                                width: 6, height: 6, borderRadius: "50%",
                                background: item.trendColor,
                                boxShadow: `0 0 6px ${item.trendColor}`,
                                animation: "pulse-glow 2s ease-in-out infinite"
                            }} />
                            <span style={{ fontSize: 10, fontWeight: 800, color: item.trendColor, letterSpacing: "0.05em" }}>
                                {item.trend}
                            </span>
                        </div>
                    </div>

                    <div>
                        <div style={{
                            fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)",
                            textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8
                        }}>
                            {item.label}
                        </div>
                        <div style={{
                            fontSize: 30, fontWeight: 900, color: "#fff",
                            fontFamily: "'JetBrains Mono', 'Inter', sans-serif",
                            letterSpacing: "-0.02em", lineHeight: 1
                        }}>
                            {item.value ?? "..."}
                        </div>
                        <div style={{
                            fontSize: 12, color: `${item.color}99`, marginTop: 10,
                            fontWeight: 600, lineHeight: 1.4
                        }}>
                            {item.sub}
                        </div>
                    </div>

                    {/* Hover info indicator */}
                    <div style={{
                        position: "absolute", bottom: 10, right: 12,
                        fontSize: 10, color: "rgba(255,255,255,0.15)", fontWeight: 600
                    }}>
                        ⓘ hover for info
                    </div>
                </div>
            ))}
        </div>
    );
}
