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
            icon: "⚖️",
            color: "var(--reactor-gold)",
            sub: "Somnia/USD Real-time",
            trend: "STABLE"
        },
        {
            label: "Total Reactions",
            value: stats?.totalReactions?.toString() ?? null,
            icon: "⚡",
            color: "var(--reactor-cyan)",
            sub: "Autonomous Triggers",
            trend: "+12%"
        },
        {
            label: "Liquidations",
            value: stats?.totalLiquidations?.toString() ?? null,
            icon: "🛡️",
            color: "var(--reactor-red)",
            sub: "System Solvency",
            trend: "0.00%"
        },
        {
            label: "Subscription",
            value: stats == null ? null : stats.isSubscribed ? "ACTIVE" : "OFFLINE",
            icon: "🛰️",
            color: stats?.isSubscribed ? "#10b981" : "#fbbf24",
            sub: stats?.isSubscribed ? `ID: #${stats.subscriptionId}` : "Action required",
            trend: stats?.isSubscribed ? "ONLINE" : "ERROR"
        },
    ];

    return (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24 }}>
            {items.map((item) => (
                <div
                    key={item.label}
                    className="card animate-scale-in"
                    style={{
                        padding: "32px",
                        background: "linear-gradient(135deg, rgba(15,23,42,0.8), rgba(2,6,23,0.9))",
                        border: "1px solid rgba(251,191,36,0.1)"
                    }}
                >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                        <div style={{
                            width: 48, height: 48, background: "rgba(251,191,36,0.1)",
                            borderRadius: "14px", display: "flex", alignItems: "center",
                            justifyContent: "center", fontSize: 24, border: "1px solid rgba(251,191,36,0.2)"
                        }}>
                            {item.icon}
                        </div>
                        <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: 10, fontWeight: 800, color: item.color, letterSpacing: "0.1em" }}>{item.trend}</div>
                            <div className={`dot-pulse ${item.label === 'Subscription' ? (stats?.isSubscribed ? 'green' : 'yellow') : 'purple'}`}></div>
                        </div>
                    </div>

                    <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                            {item.label}
                        </div>
                        <div style={{ fontSize: 32, fontWeight: 900, color: "#fff", fontFamily: "'Inter', sans-serif", letterSpacing: "-0.02em" }}>
                            {item.value ?? "Loading..."}
                        </div>
                        <div style={{ fontSize: 12, color: item.color, marginTop: 8, fontWeight: 600, opacity: 0.8 }}>
                            {item.sub}
                        </div>
                    </div>
                    <div style={{
                        position: "absolute", bottom: 0, left: 0, right: 0, height: 2,
                        background: `linear-gradient(90deg, transparent, ${item.color}, transparent)`,
                        opacity: 0.3
                    }} />
                </div>
            ))}
        </div>
    );
}
