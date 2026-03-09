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
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                        width: 32, height: 32, borderRadius: 10,
                        background: "linear-gradient(135deg, var(--reactor-gold), #b45309)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, fontWeight: 900, color: "#000",
                        fontFamily: "'Space Grotesk', sans-serif"
                    }}>RX</div>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 900, letterSpacing: "-0.01em" }}>
                            Reactor<span style={{ color: "var(--reactor-gold)" }}>X</span>
                        </div>
                        <div style={{ fontSize: 9, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.08em" }}>
                            SOMNIA DEFI
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Navigation ── */}
            <div style={{ padding: "16px 12px", flex: 1 }}>
                <div style={{
                    fontSize: 9, fontWeight: 800, color: "var(--text-muted)",
                    letterSpacing: "0.14em", textTransform: "uppercase",
                    padding: "0 8px", marginBottom: 10, opacity: 0.6
                }}>
                    NAVIGATE
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {items.map((item) => {
                        const isActive = activeTab === item.id;
                        return (
                            <div
                                key={item.id}
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
                                    color: isActive ? "var(--text-primary)" : "var(--text-muted)",
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

            {/* ── Liquidity Card Button ── */}
            <div style={{ padding: "0 12px 12px" }}>
                <button
                    onClick={() => onTabChange("dashboard")}
                    style={{
                        width: "100%", cursor: "pointer",
                        borderRadius: 16, overflow: "hidden",
                        background: "linear-gradient(135deg, #1a1a2e, #16213e)",
                        border: "1px solid rgba(251,191,36,0.15)",
                        padding: 0, textAlign: "left",
                        transition: "all 0.3s ease",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.3)"
                    }}
                >
                    {/* Gradient top bar */}
                    <div style={{
                        height: 3,
                        background: "linear-gradient(90deg, #fbbf24, #10b981, #818cf8)"
                    }} />

                    {/* Header */}
                    <div style={{
                        padding: "14px 16px 10px",
                        display: "flex", alignItems: "center", justifyContent: "space-between"
                    }}>
                        <span style={{
                            fontSize: 11, fontWeight: 800, color: "var(--reactor-gold)",
                            letterSpacing: "0.08em"
                        }}>
                            💰 LIQUIDITY
                        </span>
                        <span style={{
                            fontSize: 9, padding: "2px 6px", borderRadius: 4,
                            background: "rgba(16,185,129,0.15)", color: "#34d399",
                            fontWeight: 700
                        }}>LIVE</span>
                    </div>

                    {/* Stats rows */}
                    <div style={{ padding: "0 16px 14px" }}>
                        <div style={{
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)"
                        }}>
                            <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>Deposited</span>
                            <span style={{
                                fontSize: 13, fontWeight: 800, color: "#34d399",
                                fontFamily: "'JetBrains Mono', monospace"
                            }}>${collateral}</span>
                        </div>
                        <div style={{
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)"
                        }}>
                            <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>Borrowed</span>
                            <span style={{
                                fontSize: 13, fontWeight: 800, color: "#a78bfa",
                                fontFamily: "'JetBrains Mono', monospace"
                            }}>${debt}</span>
                        </div>
                        <div style={{
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            padding: "8px 0 0"
                        }}>
                            <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700 }}>Net Value</span>
                            <span style={{
                                fontSize: 15, fontWeight: 900, color: "var(--reactor-gold)",
                                fontFamily: "'JetBrains Mono', monospace"
                            }}>${netValue}</span>
                        </div>
                    </div>
                </button>
            </div>

            {/* ── Network Status ── */}
            <div style={{
                padding: "14px 20px",
                borderTop: "1px solid rgba(255,255,255,0.04)",
                background: "rgba(0,0,0,0.15)"
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
                        <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600 }}>
                            Shannon Testnet
                        </span>
                    </div>
                    <span style={{
                        fontSize: 9, color: "var(--text-muted)", opacity: 0.5,
                        fontFamily: "'JetBrains Mono', monospace"
                    }}>
                        ID: 50312
                    </span>
                </div>
            </div>
        </aside>
    );
}
