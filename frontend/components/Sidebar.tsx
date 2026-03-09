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
        { id: "dashboard", label: "Dashboard", icon: "📊" },
        { id: "faucet", label: "Faucet & Swap", icon: "💧" },
        { id: "admin", label: "Admin Console", icon: "🎛️" },
        { id: "architecture", label: "System View", icon: "🏗️" },
        { id: "settings", label: "Settings", icon: "⚙️" },
    ];

    const collateral = position ? parseFloat(formatEther(position.collateral)).toFixed(2) : "0.00";
    const debt = position ? parseFloat(formatEther(position.debt)).toFixed(2) : "0.00";

    return (
        <aside className="sidebar">
            <div style={{ padding: "0 16px 16px", borderBottom: "1px solid rgba(251,191,36,0.08)", marginBottom: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.3)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                    Main Menu
                </div>
            </div>

            {items.map((item) => (
                <div
                    key={item.id}
                    className={`sidebar-item ${activeTab === item.id ? "active" : ""}`}
                    onClick={() => onTabChange(item.id)}
                >
                    <span style={{ fontSize: 18 }}>{item.icon}</span>
                    <span>{item.label}</span>
                </div>
            ))}

            {/* ── Liquidity Summary ── */}
            <div style={{
                margin: "16px 12px", padding: "18px",
                borderRadius: 16,
                background: "linear-gradient(135deg, rgba(251,191,36,0.06), rgba(16,185,129,0.04))",
                border: "1px solid rgba(251,191,36,0.12)"
            }}>
                <div style={{
                    fontSize: 10, fontWeight: 800, color: "var(--reactor-gold)",
                    letterSpacing: "0.1em", marginBottom: 14, textTransform: "uppercase"
                }}>
                    💰 Your Liquidity
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>Deposited</span>
                        <span style={{
                            fontSize: 14, fontWeight: 800, color: "#34d399",
                            fontFamily: "'JetBrains Mono', monospace"
                        }}>${collateral}</span>
                    </div>
                    <div style={{
                        height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)"
                    }} />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>Borrowed</span>
                        <span style={{
                            fontSize: 14, fontWeight: 800, color: "#a78bfa",
                            fontFamily: "'JetBrains Mono', monospace"
                        }}>${debt}</span>
                    </div>
                    <div style={{
                        height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)"
                    }} />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>Net Value</span>
                        <span style={{
                            fontSize: 14, fontWeight: 900,
                            color: "var(--reactor-gold)",
                            fontFamily: "'JetBrains Mono', monospace"
                        }}>${(parseFloat(collateral) - parseFloat(debt)).toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* Network Info */}
            <div style={{ marginTop: "auto", padding: "12px" }}>
                <div style={{
                    padding: "14px", borderRadius: 14,
                    background: "rgba(0,0,0,0.3)",
                    border: "1px solid rgba(251,191,36,0.08)"
                }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Shannon Testnet</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", lineHeight: 1.5 }}>
                        Chain ID: 50312<br />
                        Status: <span style={{ color: "#10b981" }}>Online ⚡</span>
                    </div>
                </div>
            </div>
        </aside>
    );
}
