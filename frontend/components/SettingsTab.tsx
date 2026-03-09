"use client";
import React from "react";
import { CONTRACT_ADDRESSES } from "@/lib/contracts";

export default function SettingsTab() {
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert("Copied to clipboard!");
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
        <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            <div className="card card-shiny" style={{ padding: 40 }}>
                <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 12 }}>⚙️ Network & Protocol Settings</h2>
                <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 32 }}>
                    ReactorX is running on the <strong>Somnia Shannon Testnet</strong>. Use these settings to verify on-chain data or add tokens to your wallet.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
                    {contracts.map((c) => (
                        <div key={c.addr} className="onboarding-step" style={{ flex: 1 }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{c.name}</div>
                                <div style={{ fontSize: 11, fontFamily: "JetBrains Mono", color: "var(--text-muted)", marginTop: 4, wordBreak: "break-all" }}>
                                    {c.addr}
                                </div>
                            </div>
                            <button
                                onClick={() => copyToClipboard(c.addr)}
                                style={{
                                    background: "rgba(139,92,246,0.1)",
                                    border: "none",
                                    borderRadius: "4px",
                                    padding: "6px 10px",
                                    fontSize: "10px",
                                    color: "var(--reactor-purple-light)",
                                    cursor: "pointer",
                                    fontWeight: 700
                                }}
                            >
                                COPY
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="card card-glass" style={{ padding: 40, borderLeft: "4px solid var(--reactor-purple)" }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>📖 Protocol Understanding</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
                    <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--reactor-cyan-light)", marginBottom: 8 }}>RE-COLLATERALIZATION</div>
                        <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
                            Users can deposit multiple types of collateral. The protocol calculates your total value in USD using simulated oracles. Diversifying helps maintain a stable health factor.
                        </p>
                    </div>
                    <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--reactor-purple-light)", marginBottom: 8 }}>NATIVE REACTIVITY</div>
                        <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
                            Unlike traditional DeFi where bots must call a function to liquidate, Somnia's blockchain triggers the Reactor Engine internally whenever an event occurs that might invalidate a position.
                        </p>
                    </div>
                    <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--reactor-red-bright)", marginBottom: 8 }}>LIQUIDATION PENALTY</div>
                        <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
                            Positions below a 1.0 health factor lose 10% of their collateral value to the liquidator (currently the protocol itself in this demo) to ensure system solvency.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
