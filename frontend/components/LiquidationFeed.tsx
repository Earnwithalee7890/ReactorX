"use client";
import { formatEther } from "viem";
import type { LiquidationRecord } from "@/hooks/useReactorX";

interface Props { history: LiquidationRecord[]; }

export default function LiquidationFeed({ history }: Props) {
    return (
        <div className="card" style={{ overflow: "hidden" }}>
            <div style={{
                padding: "18px 24px",
                borderBottom: "1px solid rgba(59,27,11,0.8)",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                background: "rgba(17,7,0,0.4)",
            }}>
                <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>
                    🔴 Live Liquidation Feed
                </h2>
                <span className="badge badge-red">
                    <span className="dot-pulse red" />
                    {history.length} events
                </span>
            </div>

            {history.length === 0 ? (
                <div style={{ padding: 48, textAlign: "center" }}>
                    <div style={{ fontSize: 36, marginBottom: 12 }}>🎯</div>
                    <div style={{ color: "var(--text-muted)", fontSize: 13, lineHeight: 1.7 }}>
                        No liquidations yet.<br />
                        Simulate a price crash to trigger automatic liquidation.
                    </div>
                </div>
            ) : (
                <div style={{ overflowX: "auto" }}>
                    <table className="reactor-table">
                        <thead>
                            <tr>
                                <th>Time</th>
                                <th>Liquidated User</th>
                                <th>Collateral Seized</th>
                                <th>Debt Cleared</th>
                                <th>Reward (10%)</th>
                                <th>Executor</th>
                                <th>Tx</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.map((r, i) => (
                                <tr key={i} className="animate-slide-up">
                                    <td style={{ color: "var(--text-muted)" }}>
                                        {new Date(Number(r.timestamp) * 1000).toLocaleTimeString()}
                                    </td>
                                    <td style={{ color: "#f87171" }}>
                                        {r.user.slice(0, 6)}…{r.user.slice(-4)}
                                    </td>
                                    <td style={{ color: "#fde047" }}>
                                        {parseFloat(formatEther(r.collateralSeized)).toFixed(4)} ETH
                                    </td>
                                    <td style={{ color: "#fbbf24" }}>
                                        {parseFloat(formatEther(r.debtCleared)).toFixed(2)} USDC
                                    </td>
                                    <td style={{ color: "#34d399" }}>
                                        {parseFloat(formatEther(r.reward)).toFixed(6)} ETH
                                    </td>
                                    <td style={{ color: "#f97316" }}>
                                        {r.executor.slice(0, 6)}…{r.executor.slice(-4)}
                                    </td>
                                    <td>
                                        <a
                                            href={`https://shannon-explorer.somnia.network/address/${r.user}`}
                                            target="_blank" rel="noopener noreferrer"
                                            style={{ color: "var(--text-muted)", fontSize: 12, textDecoration: "none" }}
                                        >
                                            ↗
                                        </a>
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
