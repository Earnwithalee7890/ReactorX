"use client";
import React from "react";
import { formatEther } from "viem";
import type { Position } from "@/hooks/useReactorX";

interface Props {
    position: Position | null;
}

export default function LiquidityTab({ position }: Props) {
    const collateral = position ? parseFloat(formatEther(position.collateral)).toFixed(2) : "0.00";
    const debt = position ? parseFloat(formatEther(position.debt)).toFixed(2) : "0.00";
    const netValue = (parseFloat(collateral) - parseFloat(debt)).toFixed(2);

    return (
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "20px" }}>
            <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontSize: 28, fontWeight: 900, color: "var(--text-primary)", marginBottom: 8 }}>Your Liquidity</h1>
                <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Manage your collateralized positions and debt overview.</p>
            </div>

            <div className="grid-2-col" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
                {/* Deposited Panel */}
                <div style={{
                    borderRadius: 24, padding: "32px",
                    background: "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))",
                    border: "1px solid rgba(16,185,129,0.2)",
                    boxShadow: "0 8px 32px rgba(16,185,129,0.1)"
                }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "#10b981", letterSpacing: "0.1em", marginBottom: 16 }}>TOTAL DEPOSITED</div>
                    <div style={{ fontSize: 42, fontWeight: 900, color: "var(--text-primary)", fontFamily: "'JetBrains Mono', monospace" }}>
                        ${collateral}
                    </div>
                    <div style={{ marginTop: 20, fontSize: 13, color: "#10b981", opacity: 0.8, fontWeight: 500 }}>
                        Active collateral earning yield and securing your loans.
                    </div>
                </div>

                {/* Borrowed Panel */}
                <div style={{
                    borderRadius: 24, padding: "32px",
                    background: "linear-gradient(135deg, rgba(129,140,248,0.15), rgba(129,140,248,0.05))",
                    border: "1px solid rgba(129,140,248,0.2)",
                    boxShadow: "0 8px 32px rgba(129,140,248,0.1)"
                }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "#818cf8", letterSpacing: "0.1em", marginBottom: 16 }}>TOTAL BORROWED</div>
                    <div style={{ fontSize: 42, fontWeight: 900, color: "var(--text-primary)", fontFamily: "'JetBrains Mono', monospace" }}>
                        ${debt}
                    </div>
                    <div style={{ marginTop: 20, fontSize: 13, color: "#818cf8", opacity: 0.8, fontWeight: 500 }}>
                        Outstanding debt against your supplied collateral.
                    </div>
                </div>
            </div>

            {/* Net Value Card */}
            <div style={{
                marginTop: 24, borderRadius: 24, padding: "32px",
                background: "linear-gradient(135deg, rgba(251,191,36,0.1), rgba(251,191,36,0.03))",
                border: "1px solid rgba(251,191,36,0.2)",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                flexWrap: "wrap", gap: 20
            }}>
                <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "var(--reactor-gold)", letterSpacing: "0.1em", marginBottom: 4 }}>NET ACCOUNT VALUE</div>
                    <div style={{ fontSize: 14, color: "var(--text-muted)" }}>Your total equity within the ReactorX protocol</div>
                </div>
                <div style={{ fontSize: 36, fontWeight: 900, color: "var(--reactor-gold)", fontFamily: "'JetBrains Mono', monospace" }}>
                    ${netValue}
                </div>
            </div>

            {/* CTA Section */}
            <div style={{
                marginTop: 40, padding: 20, borderRadius: 20, border: "1px dashed var(--bg-border-bright)",
                textAlign: "center", color: "var(--text-muted)", fontSize: 13
            }}>
                Need to add more? Head over to the <span style={{ color: "var(--reactor-gold)", fontWeight: 700, cursor: "pointer" }}>Dashboard</span> to manage individual assets.
            </div>
        </div>
    );
}
