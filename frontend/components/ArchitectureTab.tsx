"use client";
import { formatEther } from "viem";
import { CONTRACT_ADDRESSES } from "@/lib/contracts";
import type { ProtocolStats } from "@/hooks/useReactorX";

interface Props { stats: ProtocolStats | null; }

const FLOW_STEPS = [
    {
        step: "01", title: "Subscribe via 0x0100", icon: "🔔", color: "#f97316",
        desc: "ReactorEngine.registerSubscription() calls the Somnia Reactivity Precompile at 0x0100 with the PositionUpdated event selector."
    },
    {
        step: "02", title: "Event Emission", icon: "📡", color: "#fde047",
        desc: "When price drops or a user borrows, LendingMock emits PositionUpdated — which triggers the reactive system."
    },
    {
        step: "03", title: "Validator Invocation", icon: "⚡", color: "#ea580c",
        desc: "Somnia validators detect the subscribed event and call ReactorEngine.handleReactiveEvent() in the SAME block."
    },
    {
        step: "04", title: "Auto-Liquidation", icon: "💥", color: "#ef4444",
        desc: "handleReactiveEvent() decodes the health factor. If HF < 1.0, it calls LiquidationManager.executeLiquidation()."
    },
];

export default function ArchitectureTab({ stats }: Props) {
    const contracts = [
        {
            name: "LendingMock", addr: CONTRACT_ADDRESSES.lendingMock, color: "#f97316",
            desc: "Simulates deposit, borrow, health factor calculation, and event emission.", icon: "🏦"
        },
        {
            name: "ReactorEngine", addr: CONTRACT_ADDRESSES.reactorEngine, color: "#fde047",
            desc: "Core reactive contract — subscribes to events and triggers liquidations automatically.", icon: "🤖"
        },
        {
            name: "LiquidationManager", addr: CONTRACT_ADDRESSES.liquidationManager, color: "#ef4444",
            desc: "Executes seizure of collateral, clears debt, distributes 10% reward to caller.", icon: "💥"
        },
        {
            name: "Reactivity Precompile", addr: "0x0100" as `0x${string}`, color: "#fbbf24",
            desc: "Somnia native precompile enabling trustless on-chain event subscriptions.", icon: "⚡"
        },
    ];

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Architecture flow */}
            <div className="card card-shiny glow-border-orange" style={{ padding: 28 }}>
                <div className="stat-card-accent" style={{ background: "linear-gradient(90deg,#ea580c,#eab308,transparent)" }} />
                <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 24 }}>
                    🏗️ System Architecture
                </h2>

                {/* Node flow */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, overflowX: "auto", padding: "8px 0", marginBottom: 24 }}>
                    {[
                        { label: "User Action", sub: "deposit/borrow/price", icon: "👤", color: "#fde047" },
                        { label: "LendingMock", sub: "Emits PositionUpdated", icon: "🏦", color: "#f97316" },
                        { label: "Reactivity Precompile", sub: "0x0100", icon: "⚡", color: "#ea580c" },
                        { label: "ReactorEngine", sub: "handleReactiveEvent()", icon: "🤖", color: "#fbbf24" },
                        { label: "LiquidationManager", sub: "executeLiquidation()", icon: "💥", color: "#ef4444" },
                    ].map((node, i, arr) => (
                        <div key={node.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div
                                className="arch-node"
                                style={{
                                    background: `${node.color}10`,
                                    border: `1px solid ${node.color}35`,
                                    minWidth: 130,
                                }}
                            >
                                <div style={{ fontSize: 26, marginBottom: 6 }}>{node.icon}</div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: node.color, marginBottom: 3 }}>{node.label}</div>
                                <div style={{ fontSize: 9, color: "var(--text-muted)" }}>{node.sub}</div>
                            </div>
                            {i < arr.length - 1 && (
                                <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
                                    <div style={{ fontSize: 20, color: "var(--text-muted)" }}>⟶</div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Key insight box */}
                <div style={{
                    padding: "14px 18px",
                    background: "rgba(234,88,12,0.07)",
                    border: "1px solid rgba(234,88,12,0.2)",
                    borderRadius: 12,
                }}>
                    <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7 }}>
                        <strong style={{ color: "#f97316" }}>🔑 Key Insight: </strong>
                        ReactorEngine subscribes to{" "}
                        <span className="code-chip">PositionUpdated</span>
                        {" "}via Somnia's Precompile{" "}
                        <span className="code-chip">0x0100</span>.
                        {" "}Validators invoke{" "}
                        <span className="code-chip">handleReactiveEvent()</span>
                        {" "}automatically — no external bots, no keepers.{" "}
                        <strong style={{ color: "#ef4444" }}>100% trustless on-chain automation.</strong>
                    </p>
                </div>
            </div>

            {/* How it works */}
            <div className="card" style={{ padding: 28 }}>
                <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 24 }}>
                    ⚡ How Somnia Reactivity Works in ReactorX
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {FLOW_STEPS.map((s) => (
                        <div key={s.step} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                            <div className="step-badge" style={{ background: `linear-gradient(135deg, ${s.color}, #eab308)` }}>
                                {s.step}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                                    <span style={{ fontSize: 16 }}>{s.icon}</span>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{s.title}</span>
                                </div>
                                <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.7 }}>{s.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Deployed contracts */}
            <div className="card" style={{ padding: 28 }}>
                <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 20 }}>
                    📋 Deployed Contracts
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {contracts.map((c) => (
                        <div key={c.name} style={{
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            padding: "14px 18px",
                            background: "rgba(17,7,0,0.7)",
                            border: "1px solid rgba(59,27,11,0.8)",
                            borderRadius: 12,
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <span style={{
                                    fontSize: 20, width: 36, height: 36,
                                    background: `${c.color}15`,
                                    border: `1px solid ${c.color}30`,
                                    borderRadius: 10,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    flexShrink: 0,
                                }}>{c.icon}</span>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>{c.name}</div>
                                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{c.desc}</div>
                                </div>
                            </div>
                            <a
                                href={`https://shannon-explorer.somnia.network/address/${c.addr}`}
                                target="_blank" rel="noopener noreferrer"
                                style={{
                                    fontFamily: "JetBrains Mono", fontSize: 11,
                                    color: c.color, textDecoration: "none",
                                    whiteSpace: "nowrap", marginLeft: 16,
                                }}
                            >
                                {c.addr.length > 12 ? `${c.addr.slice(0, 8)}…${c.addr.slice(-6)}` : c.addr} ↗
                            </a>
                        </div>
                    ))}
                </div>
            </div>

            {/* Protocol stats */}
            {stats && (
                <div className="card" style={{ padding: 28 }}>
                    <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 20 }}>
                        📊 Protocol Stats
                    </h2>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                        {[
                            { label: "Total Reactions", value: stats.totalReactions.toString(), color: "#f97316" },
                            { label: "Auto-Liquidations", value: stats.totalLiquidationsTriggered.toString(), color: "#ef4444" },
                            { label: "Collateral Seized", value: `${parseFloat(formatEther(stats.totalCollateralSeized)).toFixed(4)} ETH`, color: "#fde047" },
                        ].map((s) => (
                            <div key={s.label} style={{ background: "rgba(17,7,0,0.7)", border: "1px solid rgba(59,27,11,0.8)", borderRadius: 12, padding: "16px 18px" }}>
                                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</div>
                                <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: "JetBrains Mono" }}>{s.value}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
