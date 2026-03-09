"use client";
import { formatEther } from "viem";
import { getHealthStatus, formatHealthFactor } from "@/hooks/useReactorX";
import type { useReactorX } from "@/hooks/useReactorX";

type Props = {
    positions: ReturnType<typeof useReactorX>["allPositions"];
    txLoading: boolean;
    onManualReact: (user: string) => Promise<unknown>;
};

export default function PositionsTable({ positions, txLoading, onManualReact }: Props) {
    return (
        <div className="card" style={{ overflow: "hidden" }}>
            {/* Header */}
            <div style={{
                padding: "24px",
                borderBottom: "1px solid rgba(139,92,246,0.1)",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                background: "rgba(139,92,246,0.03)",
            }}>
                <h2 style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>
                    📊 Active Positions
                </h2>
                <span className="badge badge-purple">{positions.length} active</span>
            </div>

            {positions.length === 0 ? (
                <div style={{ padding: 64, textAlign: "center" }}>
                    <div className="ai-fab" style={{ position: "static", transform: "none", width: 64, height: 64, fontSize: 28, margin: "0 auto 20px" }}>🏛️</div>
                    <div style={{ color: "var(--text-muted)", fontSize: 13, fontWeight: 600 }}>
                        No active positions detected on Somnia.
                    </div>
                </div>
            ) : (
                <div style={{ overflowX: "auto" }}>
                    <table className="reactor-table">
                        <thead>
                            <tr>
                                <th>User Address</th>
                                <th>Collateral ($)</th>
                                <th>Debt ($)</th>
                                <th>Health Factor</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {positions.map(({ user, position }) => {
                                const hf = formatHealthFactor(position.healthFactor);
                                const status = getHealthStatus(position.healthFactor);
                                const liquidatable = parseFloat(hf) < 1 && position.debt > 0n;

                                return (
                                    <tr key={user} className={liquidatable ? "highlight-row" : ""}>
                                        <td>
                                            <a
                                                href={`https://shannon-explorer.somnia.network/address/${user}`}
                                                target="_blank" rel="noopener noreferrer"
                                                className="sidebar-item"
                                                style={{ padding: 0, color: "var(--reactor-cyan-light)" }}
                                            >
                                                {user.slice(0, 8)}…{user.slice(-6)}
                                            </a>
                                        </td>
                                        <td style={{ color: "var(--reactor-cyan-light)", fontWeight: 700 }}>
                                            ${parseFloat(formatEther(position.collateral)).toFixed(2)}
                                        </td>
                                        <td style={{ color: "var(--reactor-purple-light)", fontWeight: 700 }}>
                                            ${parseFloat(formatEther(position.debt)).toFixed(2)}
                                        </td>
                                        <td style={{ color: status.color, fontWeight: 900, fontFamily: "JetBrains Mono" }}>{hf}</td>
                                        <td>
                                            <span className={`badge ${status.cssClass}`} style={{ fontSize: 10 }}>{status.label}</span>
                                        </td>
                                        <td>
                                            {liquidatable ? (
                                                <button
                                                    className="btn-danger"
                                                    style={{ padding: "6px 12px", fontSize: 11, background: "var(--reactor-red)", color: "white" }}
                                                    onClick={() => onManualReact(user)}
                                                    disabled={txLoading}
                                                >
                                                    {txLoading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : "FORCE REACT"}
                                                </button>
                                            ) : (
                                                <span style={{ color: "var(--text-muted)", fontSize: 12 }}>None</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
