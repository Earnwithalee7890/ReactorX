"use client";
import Image from "next/image";

export default function HeroSection() {
    return (
        <section className="page-pad" style={{ paddingTop: 60, position: "relative" }}>
            {/* Hero background image */}
            <div style={{
                position: "absolute", inset: 0, zIndex: 0, overflow: "hidden",
                borderRadius: "0 0 40px 40px",
            }}>
                <Image
                    src="/hero-bg.png"
                    alt=""
                    fill
                    style={{ objectFit: "cover", opacity: 0.35 }}
                    onError={() => { }}
                    priority
                />
                <div style={{
                    position: "absolute", inset: 0,
                    background: "linear-gradient(to bottom, transparent 60%, var(--bg-primary) 100%)",
                }} />
            </div>

            <div style={{ maxWidth: 1400, margin: "0 auto", position: "relative", zIndex: 1 }}>
                {/* Badge */}
                <div className="badge badge-purple animate-fade-in" style={{ marginBottom: 20, fontSize: 12 }}>
                    ⚡ Somnia Native On-Chain Reactivity · Hackathon 2025
                </div>

                {/* Main headline */}
                <h1
                    className="hero-glow-text animate-slide-up"
                    style={{
                        fontSize: "clamp(2.4rem, 5vw, 4.2rem)",
                        fontWeight: 900,
                        lineHeight: 1.08,
                        letterSpacing: "-0.04em",
                        marginBottom: 20,
                        maxWidth: 700,
                    }}
                >
                    <span className="gradient-text-purple">ReactorX</span>
                    <br />
                    <span style={{ fontSize: "0.5em", color: "var(--text-secondary)", fontWeight: 600, letterSpacing: "-0.02em" }}>
                        Autonomous On-Chain Liquidation Engine
                    </span>
                </h1>

                {/* Tagline */}
                <p style={{
                    fontSize: 15, color: "var(--text-muted)",
                    maxWidth: 560, lineHeight: 1.8, marginBottom: 32,
                }}>
                    The first <strong style={{ color: "var(--text-secondary)" }}>keeperless DeFi liquidation system</strong> on Somnia.
                    Reactive smart contracts detect under-collateralized positions and execute liquidations
                    automatically — <strong style={{ color: "#f97316" }}>zero bots, zero keepers</strong>, 100% on-chain.
                </p>

                {/* Feature pills */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 48 }}>
                    {[
                        { icon: "⚡", text: "Somnia Reactivity Precompile" },
                        { icon: "🤖", text: "No Off-Chain Bots" },
                        { icon: "🔔", text: "Auto Event Subscription" },
                        { icon: "🔴", text: "Real-Time Liquidations" },
                        { icon: "🔍", text: "On-Chain Verifiable" },
                    ].map((f) => (
                        <div key={f.text} className="badge badge-dark" style={{ fontSize: 12, padding: "7px 14px" }}>
                            {f.icon} {f.text}
                        </div>
                    ))}
                </div>

                {/* Flow diagram */}
                <div style={{
                    display: "flex", alignItems: "center", gap: 0,
                    background: "rgba(17,7,0,0.7)",
                    border: "1px solid rgba(59,27,11,0.8)",
                    borderRadius: 16,
                    padding: "16px 24px",
                    width: "fit-content",
                    backdropFilter: "blur(12px)",
                    maxWidth: "100%",
                    overflowX: "auto",
                }}>
                    {[
                        { label: "Price Drop", icon: "📉", color: "#f59e0b" },
                        { label: "PositionUpdated Event", icon: "📡", color: "#f97316" },
                        { label: "Reactivity Precompile", icon: "⚡", color: "#ea580c" },
                        { label: "ReactorEngine", icon: "🤖", color: "#eab308" },
                        { label: "Liquidation Executed", icon: "💥", color: "#ef4444" },
                    ].map((step, i) => (
                        <div key={step.label} style={{ display: "flex", alignItems: "center", gap: 0 }}>
                            <div style={{ textAlign: "center", padding: "0 12px" }}>
                                <div style={{ fontSize: 20, marginBottom: 4 }}>{step.icon}</div>
                                <div style={{ fontSize: 10, color: step.color, fontWeight: 700, whiteSpace: "nowrap" }}>
                                    {step.label}
                                </div>
                            </div>
                            {i < 4 && (
                                <div style={{ color: "var(--text-muted)", fontSize: 16, padding: "0 4px" }}>→</div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
