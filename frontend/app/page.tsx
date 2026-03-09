"use client";
import { useState } from "react";
import Image from "next/image";
import { useAccount } from "wagmi";
import { formatEther } from "viem";

import Header from "@/components/Header";
import NetworkBanner from "@/components/NetworkBanner";
import StatsRow from "@/components/StatsRow";
import PositionCard from "@/components/PositionCard";
import AdminPanel from "@/components/AdminPanel";
import PositionsTable from "@/components/PositionsTable";
import LiquidationFeed from "@/components/LiquidationFeed";
import EventLog from "@/components/EventLog";
import ArchitectureTab from "@/components/ArchitectureTab";
import FaucetSwapTab from "@/components/FaucetSwapTab";
import Sidebar from "@/components/Sidebar";
import AIAssistant from "@/components/AIAssistant";
import SettingsTab from "@/components/SettingsTab";
import { useReactorX } from "@/hooks/useReactorX";

export default function Home() {
  const { address } = useAccount();
  const [tab, setTab] = useState<string>("dashboard");

  const {
    position, allPositions, liquidationHistory, stats,
    loading, txLoading, error, recentEvents,
    depositCollateral, borrow, repay, updatePrice, manualReact,
    registerSubscription, refreshAll,
  } = useReactorX();

  return (
    <div style={{ minHeight: "100vh", position: "relative", backgroundColor: "var(--bg-primary)" }}>
      {/* ── Background System ── */}
      <div className="bg-magma">
        <div className="bg-grid" />
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="scan-line" />
      </div>

      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", height: "100vh" }}>
        <Header />

        <div className="platform-layout" style={{ flex: 1, overflow: "hidden" }}>
          <Sidebar activeTab={tab} onTabChange={setTab} />

          <main className="content-main" style={{ overflowY: "auto", position: "relative" }}>
            <NetworkBanner />

            {/* Error banner */}
            {error && (
              <div style={{ marginBottom: 24 }} className="animate-scale-in">
                <div style={{
                  background: "var(--reactor-red-glow)", border: "1px solid var(--reactor-red)",
                  borderRadius: 12, padding: "12px 18px", color: "white", fontSize: 13,
                  display: "flex", alignItems: "center", gap: 10,
                }}>
                  <span>❌ {error}</span>
                </div>
              </div>
            )}

            {/* DASHBOARD */}
            {tab === "dashboard" && (
              <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                <div className="card card-glass" style={{
                  padding: "40px",
                  position: "relative",
                  overflow: "hidden",
                  borderRadius: "24px",
                  background: "linear-gradient(135deg, rgba(139,92,246,0.1), rgba(6,182,212,0.05))",
                  border: "1px solid rgba(139,92,246,0.2)",
                  boxShadow: "0 0 40px rgba(139,92,246,0.1)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  <div style={{ position: "relative", zIndex: 2 }}>
                    <h1 style={{ fontSize: 42, fontWeight: 900, marginBottom: 12, letterSpacing: "-0.03em" }} className="gradient-text-purple">System Status: Active</h1>
                    <p style={{ color: "var(--text-muted)", fontSize: 16, maxWidth: 500, lineHeight: 1.6 }}>
                      Welcome back to the ReactorX Terminal. All autonomous liquidation systems are currently monitoring the Somnia Testnet liquidity pools.
                    </p>
                    <div style={{ display: "flex", gap: 16, marginTop: 24 }}>
                      <button className="btn-primary" onClick={() => setTab("faucet")} style={{ padding: "12px 24px" }}>💰 Daily Check-in</button>
                      <button className="btn-secondary" onClick={() => refreshAll()} style={{ padding: "12px 24px" }}>↻ Sync Terminal</button>
                    </div>
                  </div>
                  <div style={{ position: "relative", width: 180, height: 180, opacity: 0.8 }} className="hide-mobile">
                    <img src="/brand-logo.png" alt="ReactorX" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                  </div>
                  <div style={{ position: "absolute", top: -100, right: -100, width: 400, height: 400, background: "radial-gradient(circle, var(--reactor-purple) 0%, transparent 70%)", opacity: 0.15, pointerEvents: "none" }} />
                </div>

                <StatsRow stats={stats} />

                <div className="grid-2-col" style={{ display: "grid", gap: 32 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                    <PositionCard
                      position={position}
                      address={address}
                      txLoading={txLoading}
                      onDeposit={depositCollateral}
                      onBorrow={borrow}
                      onRepay={repay}
                    />
                    <AdminPanel
                      stats={stats}
                      txLoading={txLoading}
                      address={address}
                      onUpdatePrice={updatePrice}
                      onRegisterSubscription={registerSubscription}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                    <EventLog events={recentEvents} />
                    <LiquidationFeed history={liquidationHistory.slice(0, 10)} />
                  </div>
                </div>
              </div>
            )}

            {/* FAUCET & SWAP */}
            {tab === "faucet" && (
              <div className="animate-fade-in">
                <div style={{ marginBottom: 32 }}>
                  <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8 }} className="gradient-text-purple">Faucet & Liquidity</h1>
                  <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Get testnet assets and swap between them.</p>
                </div>
                <FaucetSwapTab />
              </div>
            )}

            {/* ADMIN CONSOLE */}
            {tab === "admin" && (
              <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                <div style={{ marginBottom: 12 }}>
                  <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8 }} className="gradient-text-purple">Protocol Overseer</h1>
                  <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Administrative controls for price feeds and reactive subscriptions.</p>
                </div>
                <div className="grid-2-col" style={{ display: "grid", gap: 32 }}>
                  <AdminPanel
                    stats={stats}
                    txLoading={txLoading}
                    address={address}
                    onUpdatePrice={updatePrice}
                    onRegisterSubscription={registerSubscription}
                  />
                  <PositionsTable
                    positions={allPositions}
                    txLoading={txLoading}
                    onManualReact={manualReact}
                  />
                </div>
              </div>
            )}

            {/* SYSTEM VIEW */}
            {tab === "architecture" && (
              <div className="animate-fade-in">
                <div style={{ marginBottom: 32 }}>
                  <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8 }} className="gradient-text-purple">System Architecture</h1>
                  <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Visualizing the on-chain reactivity flow.</p>
                </div>
                <ArchitectureTab stats={stats} />
              </div>
            )}

            {/* SETTINGS */}
            {tab === "settings" && <SettingsTab />}

            <footer style={{ marginTop: 80, padding: "40px 0", borderTop: "1px solid rgba(139,92,246,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                © 2026 ReactorX Protocol · Built for Somnia Mini Hackathon
              </div>
              <div style={{ display: "flex", gap: 20 }}>
                <a href="https://shannon-explorer.somnia.network" target="_blank" className="sidebar-item" style={{ padding: 0, fontSize: 11 }}>Explorer ↗</a>
                <a href="https://testnet.somnia.network" target="_blank" className="sidebar-item" style={{ padding: 0, fontSize: 11 }}>Faucet ↗</a>
              </div>
            </footer>
          </main>
        </div>

        {/* Global UI Elements */}
        <AIAssistant />
      </div>
    </div>
  );
}
