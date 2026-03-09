"use client";
import React from "react";
import { formatEther } from "viem";
import type { Position } from "@/hooks/useReactorX";

interface Props {
    activeTab: string;
    onTabChange: (tab: string) => void;
    position?: Position | null;
}

export default function Sidebar({ activeTab, onTabChange, position }: Props) {
    const items = [
        { id: "dashboard", label: "Dashboard", icon: "📊", color: "#fbbf24" },
        { id: "faucet", label: "Faucet & Swap", icon: "💧", color: "#818cf8" },
        { id: "admin", label: "Admin Console", icon: "🎛️", color: "#f87171" },
        { id: "architecture", label: "System View", icon: "🏗️", color: "#34d399" },
        { id: "settings", label: "Settings", icon: "⚙️", color: "#94a3b8" },
    ];

    const collateral = position ? parseFloat(formatEther(position.collateral)).toFixed(2) : "0.00";
    const debt = position ? parseFloat(formatEther(position.debt)).toFixed(2) : "0.00";
    const netValue = (parseFloat(collateral) - parseFloat(debt)).toFixed(2);

    return (
        <aside className="sidebar" style={{
            width: 240, minHeight: "100vh",
            background: "linear-gradient(180deg, rgba(2,6,23,0.98), rgba(15,23,42,0.95))",
            borderRight: "1px solid rgba(251,191,36,0.06)",
            display: "flex", flexDirection: "column",
            padding: 0
        }}>
            {/* ── Brand Header ── */}
            <div style={{
                padding: "24px 20px 20px",
                borderBottom: "1px solid rgba(251,191,36,0.06)"
            }}>
                <div style={{
                    display: "flex", alignItems: "center", gap: 10
                }}>
                    <div style={{
                        width: 32, height: 32, borderRadius: 10,
                        background: "linear-gradient(135deg, var(--reactor-gold), #b45309)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 14, fontWeight: 900, color: "#000"
                    }}>RX</div>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 900, color: "#fff", letterSpacing: "-0.01em" }}>
                            Reactor<span style={{ color: "var(--reactor-gold)" }}>X</span>
                        </div>
                        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", fontWeight: 600, letterSpacing: "0.08em" }}>
                            SOMNIA DEFI
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Navigation ── */}
            <div style={{ padding: "16px 12px", flex: 1 }}>
                <div style={{
                    fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.2)",
                    letterSpacing: "0.14em", textTransform: "uppercase",
                    padding: "0 8px", marginBottom: 10
                }}>
                    NAVIGATE
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {items.map((item) => {
                        const isActive = activeTab === item.id;
                        return (
                            <div
                                key={item.id}
                                className="sidebar-item"
                                onClick={() => onTabChange(item.id)}
                                style={{
                                    display: "flex", alignItems: "center", gap: 12,
                                    padding: "11px 14px", borderRadius: 12,
                                    cursor: "pointer",
                                    background: isActive
                                        ? "linear-gradient(135deg, rgba(251,191,36,0.1), rgba(251,191,36,0.04))"
                                        : "transparent",
                                    border: isActive
                                        ? "1px solid rgba(251,191,36,0.15)"
                                        : "1px solid transparent",
                                    transition: "all 0.2s ease",
                                    position: "relative"
                                }}
                            >
                                {/* Active indicator bar */}
                                {isActive && (
                                    <div style={{
                                        position: "absolute", left: 0, top: "20%", bottom: "20%",
                                        width: 3, borderRadius: 4,
                                        background: "var(--reactor-gold)",
                                        boxShadow: "0 0 8px rgba(251,191,36,0.5)"
                                    }} />
                                )}
                                <div style={{
                                    width: 30, height: 30, borderRadius: 9,
                                    background: isActive ? `${item.color}18` : "rgba(255,255,255,0.03)",
                                    border: `1px solid ${isActive ? `${item.color}30` : "rgba(255,255,255,0.04)"}`,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: 14, flexShrink: 0,
                                    transition: "all 0.2s"
                                }}>
                                    {item.icon}
                                </div>
                                <span style={{
                                    fontSize: 13, fontWeight: isActive ? 700 : 500,
                                    color: isActive ? "#fff" : "rgba(255,255,255,0.45)",
                                    transition: "all 0.2s",
                                    letterSpacing: "-0.01em"
                                }}>
                                    {item.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── Liquidity Summary ── */}
            <div style={{ padding: "0 12px 16px" }}>
                <div style={{
                    borderRadius: 16, overflow: "hidden",
                    background: "linear-gradient(135deg, rgba(251,191,36,0.05), rgba(16,185,129,0.03))",
                    border: "1px solid rgba(251,191,36,0.08)"
                }}>
                    {/* Header */}
                    <div style={{
                        padding: "14px 16px 10px",
                        borderBottom: "1px solid rgba(255,255,255,0.04)"
                    }}>
                        <div style={{
                            fontSize: 10, fontWeight: 800, color: "var(--reactor-gold)",
                            letterSpacing: "0.1em", display: "flex",
                            alignItems: "center", gap: 6
                        }}>
                            <span style={{ fontSize: 12 }}>💰</span>
                            YOUR LIQUIDITY
                        </div>
                    </div>

                    {/* Stats */}
                    <div style={{ padding: "12px 16px" }}>
                        {[
                            { label: "Deposited", value: collateral, color: "#34d399", prefix: "$" },
                            { label: "Borrowed", value: debt, color: "#a78bfa", prefix: "$" },
                        ].map((row) => (
                            <div key={row.label} style={{
                                display: "flex", justifyContent: "space-between", alignItems: "center",
                                padding: "8px 0",
                                borderBottom: "1px solid rgba(255,255,255,0.03)"
                            }}>
                                <span style={{
                                    fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 500
                                }}>{row.label}</span>
                                <span style={{
                                    fontSize: 13, fontWeight: 800, color: row.color,
                                    fontFamily: "'JetBrains Mono', monospace"
                                }}>{row.prefix}{row.value}</span>
                            </div>
                        ))}

                        {/* Net Value */}
                        <div style={{
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            padding: "10px 0 2px",
                        }}>
                            <span style={{
                                fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 700
                            }}>Net Value</span>
                            <span style={{
                                fontSize: 15, fontWeight: 900, color: "var(--reactor-gold)",
                                fontFamily: "'JetBrains Mono', monospace",
                                textShadow: "0 0 20px rgba(251,191,36,0.2)"
                            }}>${netValue}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Network Status ── */}
            <div style={{
                padding: "14px 20px",
                borderTop: "1px solid rgba(255,255,255,0.04)",
                background: "rgba(0,0,0,0.2)"
            }}>
                <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between"
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{
                            width: 6, height: 6, borderRadius: "50%",
                            background: "#10b981", boxShadow: "0 0 8px #10b981",
                            animation: "pulse-glow 2s ease-in-out infinite"
                        }} />
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>
                            Shannon Testnet
                        </span>
                    </div>
                    <span style={{
                        fontSize: 9, color: "rgba(255,255,255,0.2)",
                        fontFamily: "'JetBrains Mono', monospace"
                    }}>
                        ID: 50312
                    </span>
                </div>
            </div>
        </aside>
    );
}
