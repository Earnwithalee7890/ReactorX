"use client";
import { formatEther } from "viem";
import type { ProtocolStats } from "@/hooks/useReactorX";

interface Props { stats: ProtocolStats | null; }

export default function StatsRow({ stats }: Props) {
    const shimmer = (
        <div style={{ background: "rgba(234,88,12,0.08)", borderRadius: 8, height: 28, marginTop: 8, animation: "pulse-glow 1.5s ease-in-out infinite" }} />
    );

    const price = stats ? `$${parseFloat(formatEther(stats.collateralPrice)).toFixed(2)}` : null;

    const items = [
        {
            label: "Oracle Price",
            value: price,
            icon: "💰",
            color: "#fde047",
            accentColor: "#eab308",
            sub: "ETH / USDC simulated",
        },
        {
            label: "On-Chain Reactions",
            value: stats?.totalReactions?.toString() ?? null,
            icon: "⚡",
            color: "#f97316",
            accentColor: "#ea580c",
            sub: "Fired by Somnia validators",
        },
        {
            label: "Total Liquidations",
            value: stats?.totalLiquidations?.toString() ?? null,
            icon: "💥",
            color: "#f87171",
            accentColor: "#ef4444",
            sub: "Auto-executed on-chain",
        },
        {
            label: "Reactivity Status",
            value: stats == null ? null : stats.isSubscribed ? "ACTIVE" : "INACTIVE",
            icon: stats?.isSubscribed ? "🔔" : "⚠️",
            color: stats?.isSubscribed ? "#34d399" : "#fbbf24",
            accentColor: stats?.isSubscribed ? "#10b981" : "#f59e0b",
            sub: stats?.isSubscribed
                ? `Subscription #${stats.subscriptionId}`
                : "Register via Admin panel",
        },
    ];

    return (
        <div
            style={{
                display: "grid",
                gap: 16,
                maxWidth: 1400,
                margin: "28px auto 0",
            }}
            className="grid-4-col page-pad"
        >
            {items.map((item) => (
                <div
                    key={item.label}
                    className="card card-shiny animate-scale-in"
                    style={{ padding: "22px 24px", position: "relative", overflow: "hidden" }}
                >
                    {/* Accent top bar */}
                    <div
                        className="stat-card-accent"
                        style={{ background: `linear-gradient(90deg, ${item.accentColor}, transparent)` }}
                    />

                    {/* Subtle corner glow */}
                    <div style={{
                        position: "absolute", top: -30, right: -30,
                        width: 80, height: 80, borderRadius: "50%",
                        background: `radial-gradient(circle, ${item.accentColor}20 0%, transparent 70%)`,
                        pointerEvents: "none",
                    }} />

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                        <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                            {item.label}
                        </span>
                        <span style={{ fontSize: 24, lineHeight: 1 }}>{item.icon}</span>
                    </div>

                    <div>
                        {item.value == null ? shimmer : (
                            <div
                                style={{
                                    fontSize: 30, fontWeight: 900, color: item.color,
                                    fontFamily: "JetBrains Mono, monospace",
                                    letterSpacing: "-0.02em", lineHeight: 1,
                                }}
                            >
                                {item.value}
                            </div>
                        )}
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8 }}>
                            {item.sub}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
