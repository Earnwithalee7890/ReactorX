"use client";
import React from "react";

export default function Footer() {
    const year = new Date().getFullYear();

    const links = [
        { label: "Somnia Network", href: "https://somnia.network", icon: "🌐" },
        { label: "Documentation", href: "https://docs.somnia.network", icon: "📖" },
        { label: "GitHub", href: "https://github.com/Earnwithalee7890/ReactorX", icon: "🛠️" },
        { label: "Testnet Faucet", href: "https://testnet.somnia.network", icon: "💧" },
    ];

    const stats = [
        { label: "Network", value: "Shannon Testnet" },
        { label: "Chain ID", value: "50312" },
        { label: "Consensus", value: "Somnia ICE" },
    ];

    return (
        <footer style={{
            borderTop: "1px solid var(--bg-border-bright)",
            background: "linear-gradient(180deg, transparent, var(--bg-secondary))",
            padding: "48px 40px 32px",
            marginTop: "auto"
        }}>
            <div style={{ maxWidth: 1200, margin: "0 auto" }}>
                {/* Top Row */}
                <div style={{
                    display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: 40, marginBottom: 40
                }}>
                    {/* Brand */}
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                            <span style={{ fontSize: 18, fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                                Reactor<span style={{ color: "var(--reactor-gold)" }}>X</span>
                            </span>
                        </div>
                        <p style={{
                            fontSize: 13, color: "var(--text-muted)", lineHeight: 1.7,
                            maxWidth: 340
                        }}>
                            Autonomous DeFi lending with native on-chain reactivity.
                            No bots, no keepers — just pure blockchain intelligence powered by Somnia.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <div style={{
                            fontSize: 11, fontWeight: 800, color: "var(--reactor-gold)",
                            letterSpacing: "0.1em", marginBottom: 16, textTransform: "uppercase"
                        }}>
                            Resources
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {links.map(link => (
                                <a
                                    key={link.label}
                                    href={link.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        fontSize: 13, color: "var(--text-secondary)",
                                        textDecoration: "none", display: "flex",
                                        alignItems: "center", gap: 8,
                                        transition: "color 0.2s"
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--reactor-gold)")}
                                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
                                >
                                    <span style={{ fontSize: 14 }}>{link.icon}</span>
                                    {link.label}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Network Info */}
                    <div>
                        <div style={{
                            fontSize: 11, fontWeight: 800, color: "var(--reactor-gold)",
                            letterSpacing: "0.1em", marginBottom: 16, textTransform: "uppercase"
                        }}>
                            Network
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {stats.map(s => (
                                <div key={s.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{s.label}</span>
                                    <span style={{
                                        fontSize: 12, fontWeight: 700, color: "var(--text-secondary)",
                                        fontFamily: "'JetBrains Mono', monospace"
                                    }}>{s.value}</span>
                                </div>
                            ))}
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                                <div style={{
                                    width: 6, height: 6, borderRadius: "50%", background: "#10b981",
                                    boxShadow: "0 0 8px #10b981",
                                    animation: "pulse-glow 2s ease-in-out infinite"
                                }} />
                                <span style={{ fontSize: 11, fontWeight: 700, color: "#34d399" }}>All systems operational</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div style={{
                    height: 1, background: "linear-gradient(90deg, transparent, var(--bg-border-bright), transparent)",
                    marginBottom: 24
                }} />

                {/* Bottom Bar */}
                <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    flexWrap: "wrap", gap: 12
                }}>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        © {year} ReactorX Protocol · Built for Somnia Reactivity Mini Hackathon
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <span style={{
                            fontSize: 11, color: "var(--text-muted)", opacity: 0.6,
                            fontFamily: "'JetBrains Mono', monospace"
                        }}>
                            v1.0.0
                        </span>
                        <span style={{
                            fontSize: 10, padding: "3px 10px", borderRadius: 6,
                            background: "rgba(251,191,36,0.1)",
                            border: "1px solid var(--reactor-gold-glow)",
                            color: "var(--reactor-gold)", fontWeight: 700,
                            letterSpacing: "0.06em"
                        }}>
                            TESTNET
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
