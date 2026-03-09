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
import Footer from "@/components/Footer";
import LiquidityTab from "@/components/LiquidityTab";
import { useReactorX } from "@/hooks/useReactorX";

export default function Home() {
  const { address } = useAccount();
  const [tab, setTab] = useState<string>("dashboard");

  const {
    position, allPositions, liquidationHistory, stats,
    loading, txLoading, error, recentEvents,
    depositCollateral, borrow, repay, updatePrice, manualReact,
    registerSubscription, checkIn, setupProtocol, refreshAll,
  } = useReactorX();

  // Expose setupProtocol to window for the Admin button
  if (typeof window !== "undefined") {
    (window as any).setupProtocol = setupProtocol;
  }

  return (
    <div style={{ minHeight: "100vh", position: "relative", backgroundColor: "var(--bg-primary)" }}>
      {/* ── Background System ── */}
      <div className="bg-magma" />
      <div className="bg-grid" />

      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", height: "100vh" }}>
        <Header />

        <div className="platform-layout" style={{ flex: 1, overflow: "hidden" }}>
          <Sidebar activeTab={tab} onTabChange={setTab} position={position} />

          <main className="content-main" style={{ overflowY: "auto", position: "relative" }}>
            <NetworkBanner />

            {/* Error banner */}
            {error && (
              <div style={{ marginBottom: 24 }} className="animate-scale-in">
                <div style={{
                  background: "rgba(239,68,68,0.1)", border: "1px solid var(--reactor-red)",
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
                <div className="card card-glass dashboard-hero" style={{
                  padding: "48px",
                  position: "relative",
                  overflow: "hidden",
                  borderRadius: "32px",
                  background: "linear-gradient(135deg, rgba(2,6,23,0.8), rgba(30,41,59,0.4))",
                  border: "1px solid rgba(251,191,36,0.15)",
                  boxShadow: "0 0 60px rgba(0,0,0,0.4)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  <div style={{ position: "relative", zIndex: 2 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                      <span className="badge badge-cyan" style={{ border: "1px solid var(--reactor-gold)", color: "var(--reactor-gold)" }}>Verified Protocol</span>
                      <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>SOMNIA SHANNON TESTNET</span>
                    </div>
                    <h1 style={{ fontSize: 48, fontWeight: 900, marginBottom: 16, letterSpacing: "-0.04em" }} className="gradient-text-purple">System Status: Active</h1>
                    <p style={{ color: "var(--text-secondary)", fontSize: 18, maxWidth: 540, lineHeight: 1.6, marginBottom: 32 }}>
                      Welcome to the ReactorX Terminal. Monitor liquidity, manage collateral, and engage autonomous liquidation systems with zero-latency.
                    </p>
                    <div style={{ display: "flex", gap: 16 }}>
                      <button
                        className="btn-primary"
                        onClick={async () => {
                          try { await checkIn(); } catch (e) { }
                        }}
                        disabled={txLoading}
                        style={{ padding: "18px 36px", fontSize: 16 }}
                      >
                        {txLoading ? "Checking in..." : "💰 Daily Check-in"}
                      </button>
                      <button className="btn-secondary" onClick={() => refreshAll()} style={{ padding: "18px 36px", fontSize: 16 }}>↻ Sync Terminal</button>
                    </div>
                  </div>
                  <div style={{ position: "relative", width: 220, height: 220, opacity: 0.9, zIndex: 1 }} className="hide-mobile">
                    <img
                      src="/brand-logo.png"
                      alt="ReactorX"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        filter: "drop-shadow(0 0 30px rgba(251,191,36,0.4)) brightness(1.1)"
                      }}
                    />
                  </div>
                  <div style={{ position: "absolute", top: -150, right: -150, width: 500, height: 500, background: "radial-gradient(circle, rgba(251,191,36,0.2) 0%, transparent 70%)", opacity: 0.3, pointerEvents: "none" }} />
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
                  <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8 }} className="gradient-text-purple">Faucet & Swap</h1>
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

            {/* LIQUIDITY */}
            {tab === "liquidity" && <LiquidityTab position={position} />}

            <Footer />
          </main>
        </div>

        {/* Global UI Elements */}
        <AIAssistant />
      </div>
    </div>
  );
}
