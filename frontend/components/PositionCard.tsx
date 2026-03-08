import { useState } from "react";
import { formatEther } from "viem";
import { getHealthStatus, formatHealthFactor } from "@/hooks/useReactorX";
import type { Position } from "@/hooks/useReactorX";
import { CONTRACT_ADDRESSES } from "@/lib/contracts";

interface Props {
    position: Position | null;
    address?: string;
    txLoading: boolean;
    onDeposit: (a: string) => Promise<unknown>;
    onBorrow: (tokenAddr: string, amount: string, symbol: string) => Promise<unknown>;
    onRepay: (tokenAddr: string, amount: string, symbol: string) => Promise<unknown>;
}

const BORROW_ASSETS = [
    { symbol: "USDC", address: CONTRACT_ADDRESSES.usdc, icon: "💵" },
    { symbol: "USDT", address: CONTRACT_ADDRESSES.usdt, icon: "💳" },
    { symbol: "WETH", address: CONTRACT_ADDRESSES.weth, icon: "⟠" },
];

export default function PositionCard({ position, address, txLoading, onDeposit, onBorrow, onRepay }: Props) {
    const [depositAmount, setDepositAmount] = useState("10");
    const [borrowAmount, setBorrowAmount] = useState("5000");
    const [repayAmount, setRepayAmount] = useState("1000");
    const [selectedBorrowToken, setSelectedBorrowToken] = useState(BORROW_ASSETS[0]);
    const [selectedRepayToken, setSelectedRepayToken] = useState(BORROW_ASSETS[0]);

    if (!address) {
        return (
            <div className="card glow-border-orange" style={{ padding: 36, textAlign: "center" }}>
                <div style={{ fontSize: 52, marginBottom: 16 }}>🔌</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>
                    Connect Your Wallet
                </div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.7 }}>
                    Connect your wallet (MetaMask, OKX, or Bitget) to Somnia Testnet to view and manage your lending position.
                </div>
            </div>
        );
    }

    const hfStatus = position ? getHealthStatus(position.healthFactor) : null;
    const hf = position ? formatHealthFactor(position.healthFactor) : "—";
    const collateral = position ? parseFloat(formatEther(position.collateral)).toFixed(4) : "0.0000";
    const debt = position ? parseFloat(formatEther(position.debt)).toFixed(2) : "0.00";
    const barWidth = hfStatus ? Math.min(100, hfStatus.percent) : 0;
    const isLiquidatable = hfStatus?.label === "LIQUIDATABLE";
    const hasDebt = position && position.debt > 0n;

    return (
        <div
            className={`card card-shiny ${isLiquidatable ? "glow-border-red" : "glow-border-orange"}`}
            style={{ padding: 28 }}
        >
            <div className="stat-card-accent" style={{ background: isLiquidatable ? "linear-gradient(90deg,#ef4444,#dc2626, transparent)" : "linear-gradient(90deg,#ea580c,#eab308,transparent)" }} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
                <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>
                    My Position
                </h2>
                {hasDebt && hfStatus && (
                    <span className={`badge ${hfStatus.cssClass}`}>{hfStatus.label}</span>
                )}
            </div>

            <div style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>Health Factor</span>
                    <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 26, fontWeight: 800, color: hfStatus?.color ?? "var(--text-muted)" }}>{hf}</span>
                </div>
                <div className="health-bar-container">
                    <div className="health-bar-fill" style={{ width: `${barWidth}%`, background: hfStatus ? `linear-gradient(90deg, ${hfStatus.color}60, ${hfStatus.color})` : "rgba(255,255,255,0.08)" }} />
                </div>

                {isLiquidatable && (
                    <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 16 }}>⚡</span>
                        <span style={{ fontSize: 12, color: "#f87171", fontWeight: 600 }}>ReactorEngine will auto-liquidate this position!</span>
                    </div>
                )}
            </div>

            {/* Stats grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 22 }}>
                {[
                    { label: "STT Collateral", value: `${collateral} STT`, icon: "💎", color: "#fde047" },
                    { label: "Total Debt (USD)", value: `$${debt}`, icon: "💸", color: "#fbbf24" },
                ].map((item) => (
                    <div key={item.label} style={{ background: "rgba(17,7,0,0.7)", border: "1px solid rgba(59,27,11,0.8)", borderRadius: 12, padding: "14px 16px" }}>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{item.icon} {item.label}</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: item.color, fontFamily: "JetBrains Mono" }}>{item.value}</div>
                    </div>
                ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Deposit Row */}
                <div>
                    <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 6, fontWeight: 700, letterSpacing: "0.06em" }}>DEPOSIT STT COLLATERAL</label>
                    <div style={{ display: "flex", gap: 8 }}>
                        <input className="input-styled" type="number" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} style={{ flex: 1 }} />
                        <button className="btn-primary" style={{ whiteSpace: "nowrap", padding: "0 20px" }} onClick={() => onDeposit(depositAmount)} disabled={txLoading}>
                            {txLoading ? <span className="spinner" /> : "Deposit"}
                        </button>
                    </div>
                </div>

                {/* Borrow Row */}
                <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <label style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.06em" }}>BORROW ASSET</label>
                        <select
                            className="input-styled"
                            style={{ padding: "2px 8px", fontSize: 11, height: "auto" }}
                            value={selectedBorrowToken.symbol}
                            onChange={(e) => setSelectedBorrowToken(BORROW_ASSETS.find(a => a.symbol === e.target.value)!)}
                        >
                            {BORROW_ASSETS.map(a => <option key={a.symbol} value={a.symbol}>{a.symbol}</option>)}
                        </select>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                        <input className="input-styled" type="number" value={borrowAmount} onChange={(e) => setBorrowAmount(e.target.value)} style={{ flex: 1 }} />
                        <button className="btn-secondary" style={{ whiteSpace: "nowrap", padding: "0 20px" }} onClick={() => onBorrow(selectedBorrowToken.address, borrowAmount, selectedBorrowToken.symbol)} disabled={txLoading}>
                            {txLoading ? <span className="spinner" /> : `Borrow ${selectedBorrowToken.symbol}`}
                        </button>
                    </div>
                </div>

                {/* Repay Row */}
                <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <label style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.06em" }}>REPAY DEBT</label>
                        <select
                            className="input-styled"
                            style={{ padding: "2px 8px", fontSize: 11, height: "auto" }}
                            value={selectedRepayToken.symbol}
                            onChange={(e) => setSelectedRepayToken(BORROW_ASSETS.find(a => a.symbol === e.target.value)!)}
                        >
                            {BORROW_ASSETS.map(a => <option key={a.symbol} value={a.symbol}>{a.symbol}</option>)}
                        </select>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                        <input className="input-styled" type="number" value={repayAmount} onChange={(e) => setRepayAmount(e.target.value)} style={{ flex: 1 }} />
                        <button className="btn-purple" style={{ whiteSpace: "nowrap", padding: "0 20px" }} onClick={() => onRepay(selectedRepayToken.address, repayAmount, selectedRepayToken.symbol)} disabled={txLoading || !hasDebt}>
                            {txLoading ? <span className="spinner" /> : `Repay ${selectedRepayToken.symbol}`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
