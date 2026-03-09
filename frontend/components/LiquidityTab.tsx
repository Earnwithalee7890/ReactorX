"use client";
import React from "react";
import { formatEther } from "viem";
import type { Position } from "@/hooks/useReactorX";

interface PositionHolder {
    user: string;
    position: Position;
}

interface Props {
    position: Position | null;
    allPositions: PositionHolder[];
}

export default function LiquidityTab({ position, allPositions }: Props) {
    const collateral = position ? parseFloat(formatEther(position.collateral)).toFixed(2) : "0.00";
    const debt = position ? parseFloat(formatEther(position.debt)).toFixed(2) : "0.00";
    const netValue = (parseFloat(collateral) - parseFloat(debt)).toFixed(2);

    // Calculate Global TVL
    const totalTVLWei = allPositions.reduce((sum, p) => sum + p.position.collateral, 0n);
    const totalTVL = parseFloat(formatEther(totalTVLWei)).toFixed(2);

    // Calculate Global Debt
    const totalDebtWei = allPositions.reduce((sum, p) => sum + p.position.debt, 0n);
    const totalDebt = parseFloat(formatEther(totalDebtWei)).toFixed(2);

    return (
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "20px" }}>
            <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontSize: 28, fontWeight: 900, color: "var(--text-primary)", marginBottom: 8 }}>Liquidity Terminal</h1>
                <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Real-time overview of your positions and protocol-wide TVL.</p>
            </div>

            {/* Protocol TVL Section - High Level Stats */}
            <div style={{
                marginBottom: 32, borderRadius: 24, padding: "40px",
                background: "linear-gradient(135deg, var(--reactor-purple), var(--reactor-purple-dim))",
                border: "1px solid var(--reactor-purple-light)",
                boxShadow: "0 20px 40px rgba(0,0,0,0.3), 0 0 20px rgba(129,140,248,0.2)",
                color: "white", position: "relative", overflow: "hidden"
            }}>
                <div style={{ position: "relative", zIndex: 2 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.15em", color: "rgba(255,255,255,0.7)", marginBottom: 8 }}>GLOBAL TOTAL VALUE LOCKED (TVL)</div>
                            <div style={{ fontSize: 56, fontWeight: 900, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "-0.04em" }}>
                                ${totalTVL}
                            </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.6)", marginBottom: 4 }}>ACTIVE DEPOSITORS</div>
                            <div style={{ fontSize: 24, fontWeight: 900 }}>{allPositions.length}</div>
                        </div>
                    </div>
                    <div style={{
                        marginTop: 24, display: "flex", gap: 32, paddingTop: 24,
                        borderTop: "1px solid rgba(255,255,255,0.15)"
                    }}>
                        <div>
                            <div style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>PROTOCOL DEBT</div>
                            <div style={{ fontSize: 18, fontWeight: 800 }}>${totalDebt}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>SYSTEM CAPACITY</div>
                            <div style={{ fontSize: 18, fontWeight: 800 }}>98.4%</div>
                        </div>
                    </div>
                </div>
                {/* Decorative background element */}
                <div style={{
                    position: "absolute", right: -50, top: -50, width: 250, height: 250,
                    background: "radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)",
                    borderRadius: "50%", pointerEvents: "none"
                }} />
            </div>

            <div className="grid-2-col" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24, marginBottom: 32 }}>
                {/* User Deposited Panel */}
                <div style={{
                    borderRadius: 24, padding: "32px",
                    background: "linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.05))",
                    border: "1px solid rgba(16,185,129,0.2)",
                }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#10b981", letterSpacing: "0.1em", marginBottom: 16 }}>YOUR DEPOSITS</div>
                    <div style={{ fontSize: 36, fontWeight: 900, color: "var(--text-primary)", fontFamily: "'JetBrains Mono', monospace" }}>
                        ${collateral}
                    </div>
                </div>

                {/* User Borrowed Panel */}
                <div style={{
                    borderRadius: 24, padding: "32px",
                    background: "linear-gradient(135deg, rgba(129,140,248,0.1), rgba(129,140,248,0.05))",
                    border: "1px solid rgba(129,140,248,0.2)",
                }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#818cf8", letterSpacing: "0.1em", marginBottom: 16 }}>YOUR BORROWED</div>
                    <div style={{ fontSize: 36, fontWeight: 900, color: "var(--text-primary)", fontFamily: "'JetBrains Mono', monospace" }}>
                        ${debt}
                    </div>
                </div>
            </div>

            {/* Depositor List / Leaderboard */}
            <div className="card card-glass" style={{ borderRadius: 24, overflow: "hidden" }}>
                <div style={{ padding: "24px 32px", borderBottom: "1px solid var(--bg-border-bright)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 14, fontWeight: 900 }}>Top Protocol Depositors</div>
                    <div className="badge badge-cyan" style={{ fontSize: 10 }}>Live Sync</div>
                </div>
                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ textAlign: "left", background: "rgba(0,0,0,0.1)" }}>
                                <th style={{ padding: "16px 32px", fontSize: 11, color: "var(--text-muted)", fontWeight: 800 }}>USER ADDRESS</th>
                                <th style={{ padding: "16px 32px", fontSize: 11, color: "var(--text-muted)", fontWeight: 800 }}>COLLATERAL</th>
                                <th style={{ padding: "16px 32px", fontSize: 11, color: "var(--text-muted)", fontWeight: 800 }}>DEBT</th>
                                <th style={{ padding: "16px 32px", fontSize: 11, color: "var(--text-muted)", fontWeight: 800 }}>STATUS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allPositions.length === 0 ? (
                                <tr><td colSpan={4} style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Scanning Somnia state for depositors...</td></tr>
                            ) : (
                                allPositions.slice(0, 10).map((holder, i) => {
                                    const hf = parseFloat(formatEther(holder.position.healthFactor));
                                    const isSafe = hf >= 1.25;
                                    return (
                                        <tr key={holder.user} style={{ borderBottom: "1px solid var(--bg-border)", transition: "background 0.2s" }} className="table-row-hover">
                                            <td style={{ padding: "16px 32px", fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>
                                                {holder.user.slice(0, 6)}...{holder.user.slice(-4)}
                                                {i === 0 && <span style={{ marginLeft: 8, fontSize: 12 }}>👑</span>}
                                            </td>
                                            <td style={{ padding: "16px 32px", fontSize: 14, fontWeight: 700 }}>${parseFloat(formatEther(holder.position.collateral)).toFixed(2)}</td>
                                            <td style={{ padding: "16px 32px", fontSize: 14, color: "var(--text-muted)" }}>${parseFloat(formatEther(holder.position.debt)).toFixed(2)}</td>
                                            <td style={{ padding: "16px 32px" }}>
                                                <span className={isSafe ? "badge-green badge" : "badge-red badge"} style={{ fontSize: 10 }}>
                                                    {isSafe ? "SAFE" : "DANGER"}
                                                </span>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* CTA Section */}
            <div style={{
                marginTop: 40, padding: 20, borderRadius: 20, border: "1px dashed var(--bg-border-bright)",
                textAlign: "center", color: "var(--text-muted)", fontSize: 13
            }}>
                Protocol updates every 15 seconds. High collateral users are prioritized in the index.
            </div>
        </div>
    );
}
