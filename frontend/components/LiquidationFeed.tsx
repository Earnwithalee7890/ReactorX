"use client";
import { formatEther } from "viem";
import type { LiquidationRecord } from "@/hooks/useReactorX";

interface Props { history: LiquidationRecord[]; }

export default function LiquidationFeed({ history }: Props) {
    return (
        <div className="card" style={{ overflow: "hidden" }}>
            <div style={{
                padding: "24px",
                borderBottom: "1px solid rgba(239,68,68,0.1)",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                background: "rgba(239,68,68,0.03)",
            }}>
                <h2 style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>
                    🔴 Protocol Liquidation Log
                </h2>
                <span className="badge badge-red">
                    <span className="dot-pulse red" />
                    {history.length} events
                </span>
            </div>

            {history.length === 0 ? (
                <div style={{ padding: 64, textAlign: "center" }}>
                    <div className="ai-fab" style={{ position: "static", transform: "none", width: 64, height: 64, fontSize: 28, margin: "0 auto 20px", background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>🎯</div>
                    <div style={{ color: "var(--text-muted)", fontSize: 13, fontWeight: 600, lineHeight: 1.6 }}>
                        Current status: Solvent.<br />
                        <span style={{ fontSize: 11, fontWeight: 400 }}>Trigger a price crash to see ReactorX in action.</span>
                    </div>
                </div>
            ) : (
                <div style={{ overflowX: "auto" }}>
                    <table className="reactor-table">
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>Subject</th>
                                <th>Seized ($)</th>
                                <th>Cleared ($)</th>
                                <th>Executor</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.map((r, i) => (
                                <tr key={i} className="animate-slide-up">
                                    <td style={{ color: "var(--text-muted)", fontSize: 12 }}>
                                        {new Date(Number(r.timestamp) * 1000).toLocaleTimeString()}
                                    </td>
                                    <td style={{ color: "var(--reactor-red-bright)", fontWeight: 700 }}>
                                        {r.user.slice(0, 6)}…{r.user.slice(-4)}
                                    </td>
                                    <td style={{ color: "var(--reactor-cyan-light)", fontWeight: 700 }}>
                                        ${parseFloat(formatEther(r.collateralSeized)).toFixed(2)}
                                    </td>
                                    <td style={{ color: "var(--reactor-purple-light)", fontWeight: 700 }}>
                                        ${parseFloat(formatEther(r.debtCleared)).toFixed(2)}
                                    </td>
                                    <td>
                                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                            <span style={{ fontSize: 10, padding: "2px 6px", background: "rgba(139,92,246,0.1)", borderRadius: 4, color: "var(--reactor-purple-light)" }}>SMN</span>
                                            <span style={{ color: "var(--text-muted)", fontSize: 11 }}>Validator</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
