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
                padding: "18px 24px",
                borderBottom: "1px solid rgba(59,27,11,0.8)",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                background: "rgba(17,7,0,0.4)",
            }}>
                <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>
                    📊 All Positions
                </h2>
                <span className="badge badge-purple">{positions.length} active</span>
            </div>

            {positions.length === 0 ? (
                <div style={{ padding: 48, textAlign: "center" }}>
                    <div style={{ fontSize: 36, marginBottom: 12 }}>🏦</div>
                    <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
                        No active positions. Deposit collateral to get started.
                    </div>
                </div>
            ) : (
                <div style={{ overflowX: "auto" }}>
                    <table className="reactor-table">
                        <thead>
                            <tr>
                                <th>User Address</th>
                                <th>Collateral</th>
                                <th>Debt</th>
                                <th>Health Factor</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {positions.map(({ user, position }) => {
                                const hf = formatHealthFactor(position.healthFactor);
                                const status = getHealthStatus(position.healthFactor);
                                const liquidatable = parseFloat(hf) < 1 && position.debt > 0n;

                                return (
                                    <tr key={user} className={liquidatable ? "highlight" : ""}>
                                        <td>
                                            <a
                                                href={`https://shannon-explorer.somnia.network/address/${user}`}
                                                target="_blank" rel="noopener noreferrer"
                                                style={{ color: "#f97316", textDecoration: "none" }}
                                            >
                                                {user.slice(0, 8)}…{user.slice(-6)}
                                            </a>
                                        </td>
                                        <td style={{ color: "#fde047" }}>
                                            {parseFloat(formatEther(position.collateral)).toFixed(4)} ETH
                                        </td>
                                        <td style={{ color: "#fbbf24" }}>
                                            {parseFloat(formatEther(position.debt)).toFixed(2)} USDC
                                        </td>
                                        <td style={{ color: status.color, fontWeight: 700 }}>{hf}</td>
                                        <td>
                                            <span className={`badge ${status.cssClass}`}>{status.label}</span>
                                        </td>
                                        <td>
                                            {liquidatable ? (
                                                <button
                                                    className="btn-danger"
                                                    style={{ padding: "6px 12px", fontSize: 11 }}
                                                    onClick={() => onManualReact(user)}
                                                    disabled={txLoading}
                                                    title="Manually trigger ReactorEngine"
                                                >
                                                    {txLoading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : "⚡ React"}
                                                </button>
                                            ) : (
                                                <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>
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
