"use client";
import React, { useState, useEffect } from "react";
import { CONTRACT_ADDRESSES } from "@/lib/contracts";

export default function SettingsTab() {
    const [theme, setTheme] = useState<"dark" | "light">("dark");
    const [copied, setCopied] = useState<string | null>(null);

    useEffect(() => {
        const saved = localStorage.getItem("reactorx_theme") || "dark";
        setTheme(saved as "dark" | "light");
        document.documentElement.setAttribute("data-theme", saved);
    }, []);

    const toggleTheme = (t: "dark" | "light") => {
        setTheme(t);
        localStorage.setItem("reactorx_theme", t);
        document.documentElement.setAttribute("data-theme", t);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(text);
        setTimeout(() => setCopied(null), 2000);
    };

    const contracts = [
        { name: "Lending Engine (Mock)", addr: CONTRACT_ADDRESSES.lendingMock },
        { name: "Reactor Engine", addr: CONTRACT_ADDRESSES.reactorEngine },
        { name: "Liquidation Manager", addr: CONTRACT_ADDRESSES.liquidationManager },
        { name: "Reactor DEX", addr: CONTRACT_ADDRESSES.dex },
        { name: "USDC Token", addr: CONTRACT_ADDRESSES.usdc },
        { name: "USDT Token", addr: CONTRACT_ADDRESSES.usdt },
        { name: "WETH Token", addr: CONTRACT_ADDRESSES.weth },
    ];

    return (
        <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            {/* Theme Toggle */}
            <div style={{
                borderRadius: 20, overflow: "hidden",
                background: "var(--card-bg, linear-gradient(135deg, rgba(2,6,23,0.95), rgba(15,23,42,0.8)))",
                border: "1px solid rgba(251,191,36,0.1)", padding: 32
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                    <div style={{
                        width: 40, height: 40, borderRadius: 12,
                        background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)",
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20
                    }}>🎨</div>
                    <div>
                        <h2 style={{ fontSize: 18, fontWeight: 900, color: "var(--text-primary)", margin: 0 }}>Appearance</h2>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>Choose your preferred theme</div>
                    </div>
                </div>

                <div style={{ display: "flex", gap: 12 }}>
                    <button
                        onClick={() => toggleTheme("dark")}
                        style={{
                            flex: 1, padding: "20px", borderRadius: 16,
                            border: theme === "dark" ? "2px solid var(--reactor-gold)" : "2px solid rgba(255,255,255,0.08)",
                            background: theme === "dark" ? "rgba(251,191,36,0.08)" : "rgba(255,255,255,0.02)",
                            cursor: "pointer", display: "flex", flexDirection: "column",
                            alignItems: "center", gap: 10, transition: "all 0.2s"
                        }}
                    >
                        <span style={{ fontSize: 28 }}>🌙</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: theme === "dark" ? "var(--reactor-gold)" : "var(--text-muted)" }}>
                            Dark Mode
                        </span>
                        {theme === "dark" && (
                            <span style={{ fontSize: 10, color: "#10b981", fontWeight: 700 }}>✓ Active</span>
                        )}
                    </button>
                    <button
                        onClick={() => toggleTheme("light")}
                        style={{
                            flex: 1, padding: "20px", borderRadius: 16,
                            border: theme === "light" ? "2px solid var(--reactor-gold)" : "2px solid rgba(255,255,255,0.08)",
                            background: theme === "light" ? "rgba(251,191,36,0.08)" : "rgba(255,255,255,0.02)",
                            cursor: "pointer", display: "flex", flexDirection: "column",
                            alignItems: "center", gap: 10, transition: "all 0.2s"
                        }}
                    >
                        <span style={{ fontSize: 28 }}>☀️</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: theme === "light" ? "var(--reactor-gold)" : "var(--text-muted)" }}>
                            Light Mode
                        </span>
                        {theme === "light" && (
                            <span style={{ fontSize: 10, color: "#10b981", fontWeight: 700 }}>✓ Active</span>
                        )}
                    </button>
                </div>
            </div>

            {/* Contract Addresses */}
            <div style={{
                borderRadius: 20, overflow: "hidden",
                background: "var(--card-bg, linear-gradient(135deg, rgba(2,6,23,0.95), rgba(15,23,42,0.8)))",
                border: "1px solid rgba(251,191,36,0.1)", padding: 32
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                    <div style={{
                        width: 40, height: 40, borderRadius: 12,
                        background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)",
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20
                    }}>📋</div>
                    <div>
                        <h2 style={{ fontSize: 18, fontWeight: 900, color: "var(--text-primary)", margin: 0 }}>Contract Addresses</h2>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>Somnia Shannon Testnet (Chain ID: 50312)</div>
                    </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 12 }}>
                    {contracts.map((c) => (
                        <div key={c.addr} style={{
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            padding: "14px 16px", borderRadius: 12,
                            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
                        }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>{c.name}</div>
                                <div style={{
                                    fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
                                    color: "var(--text-muted)", marginTop: 4, wordBreak: "break-all"
                                }}>
                                    {c.addr}
                                </div>
                            </div>
                            <button
                                onClick={() => copyToClipboard(c.addr)}
                                style={{
                                    background: copied === c.addr ? "rgba(16,185,129,0.15)" : "rgba(251,191,36,0.08)",
                                    border: `1px solid ${copied === c.addr ? "rgba(16,185,129,0.3)" : "rgba(251,191,36,0.2)"}`,
                                    borderRadius: 8, padding: "6px 12px",
                                    fontSize: 10, fontWeight: 800,
                                    color: copied === c.addr ? "#34d399" : "var(--reactor-gold)",
                                    cursor: "pointer", letterSpacing: "0.05em",
                                    fontFamily: "'Space Grotesk', sans-serif",
                                    transition: "all 0.2s"
                                }}
                            >
                                {copied === c.addr ? "✓ COPIED" : "COPY"}
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Protocol Info */}
            <div style={{
                borderRadius: 20, overflow: "hidden",
                background: "var(--card-bg, linear-gradient(135deg, rgba(2,6,23,0.95), rgba(15,23,42,0.8)))",
                border: "1px solid rgba(139,92,246,0.12)", padding: 32
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                    <div style={{
                        width: 40, height: 40, borderRadius: 12,
                        background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)",
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20
                    }}>📖</div>
                    <div>
                        <h2 style={{ fontSize: 18, fontWeight: 900, color: "var(--text-primary)", margin: 0 }}>Protocol Guide</h2>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>Understanding ReactorX mechanics</div>
                    </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
                    {[
                        { title: "RE-COLLATERALIZATION", color: "#34d399", text: "Users can deposit multiple types of collateral. The protocol calculates your total value in USD using simulated oracles." },
                        { title: "NATIVE REACTIVITY", color: "#a78bfa", text: "Unlike traditional DeFi where bots must call a function to liquidate, Somnia's blockchain triggers the Reactor Engine internally." },
                        { title: "LIQUIDATION PENALTY", color: "#f87171", text: "Positions below 1.0 health factor lose 10% of their collateral value to ensure system solvency." },
                    ].map(item => (
                        <div key={item.title} style={{
                            padding: "20px", borderRadius: 14,
                            background: `${item.color}06`, border: `1px solid ${item.color}15`
                        }}>
                            <div style={{ fontSize: 12, fontWeight: 800, color: item.color, marginBottom: 10, letterSpacing: "0.06em" }}>
                                {item.title}
                            </div>
                            <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.7, margin: 0 }}>
                                {item.text}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
