"use client";
import { formatEther } from "viem";
import type { ProtocolStats } from "@/hooks/useReactorX";

interface Props { stats: ProtocolStats | null; }

export default function StatsRow({ stats }: Props) {
    const price = stats ? `$${parseFloat(formatEther(stats.collateralPrice)).toFixed(2)}` : null;

    const items = [
        {
            label: "Oracle Feed",
            value: price,
            icon: "🔭",
            color: "var(--reactor-cyan)",
            sub: "Somnia/USD Pulse",
        },
        {
            label: "Total Reactions",
            value: stats?.totalReactions?.toString() ?? null,
            icon: "⚡",
            color: "var(--reactor-purple-light)",
            sub: "On-Chain Triggers",
        },
        {
            label: "Liquidations",
            value: stats?.totalLiquidations?.toString() ?? null,
            icon: "💥",
            color: "#f87171",
            sub: "Protocol Solvency",
        },
        {
            label: "Subscription",
            value: stats == null ? null : stats.isSubscribed ? "LIVE" : "OFFLINE",
            icon: stats?.isSubscribed ? "🛰️" : "📡",
            color: stats?.isSubscribed ? "#10b981" : "#fbbf24",
            sub: stats?.isSubscribed ? `ID: ${stats.subscriptionId}` : "Action required",
        },
    ];

    return (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
            {items.map((item) => (
                <div
                    key={item.label}
                    className="card animate-scale-in"
                    style={{ padding: "24px", position: "relative", overflow: "hidden" }}
                >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                        <div style={{ padding: "8px", background: "rgba(139,92,246,0.1)", borderRadius: "10px", fontSize: 20 }}>
                            {item.icon}
                        </div>
                        <div className={`dot-pulse ${item.label === 'Subscription' ? (stats?.isSubscribed ? 'green' : 'yellow') : 'purple'}`}></div>
                    </div>

                    <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
                            {item.label}
                        </div>
                        <div style={{ fontSize: 28, fontWeight: 900, color: item.color, fontFamily: "JetBrains Mono" }}>
                            {item.value ?? "..."}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>
                            {item.sub}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
