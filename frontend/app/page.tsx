"use client";
import { useState } from "react";
import { useAccount } from "wagmi";
import { formatEther } from "viem";

import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import StatsRow from "@/components/StatsRow";
import PositionCard from "@/components/PositionCard";
import AdminPanel from "@/components/AdminPanel";
import PositionsTable from "@/components/PositionsTable";
import LiquidationFeed from "@/components/LiquidationFeed";
import EventLog from "@/components/EventLog";
import ArchitectureTab from "@/components/ArchitectureTab";
import { useReactorX } from "@/hooks/useReactorX";

export default function Home() {
  const { address } = useAccount();
  const [tab, setTab] = useState<"dashboard" | "liquidations" | "architecture">("dashboard");

  const {
    position, allPositions, liquidationHistory, stats,
    loading, txLoading, error, recentEvents,
    depositCollateral, borrow, updatePrice, manualReact,
    registerSubscription, refreshAll,
  } = useReactorX();

  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>

      {/* ── Animated background ── */}
      <div className="bg-magma">
        <div className="bg-grid" />
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <div className="scan-line" />
        <div className="particles" />
      </div>

      {/* ── Page content ── */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <Header />
        <HeroSection />
        <StatsRow stats={stats} />

        {/* ── Tabs ── */}
        <div className="page-pad" style={{ paddingTop: "28px", maxWidth: 1400, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div className="tab-nav">
              {([
                { key: "dashboard", label: "Dashboard", icon: "🏠" },
                { key: "liquidations", label: "Liquidations", icon: "🔴" },
                { key: "architecture", label: "Architecture", icon: "🏗️" },
              ] as const).map((t) => (
                <button
                  key={t.key}
                  id={`tab-${t.key}`}
                  className={`tab-btn ${tab === t.key ? "active" : ""}`}
                  onClick={() => setTab(t.key)}
                >
                  <span>{t.icon}</span> {t.label}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="btn-secondary"
                style={{ padding: "8px 16px", fontSize: 12 }}
                onClick={() => refreshAll()}
                disabled={loading}
              >
                {loading ? <span className="spinner" /> : "↻ Refresh"}
              </button>
              <a
                href="https://shannon-explorer.somnia.network"
                target="_blank" rel="noopener noreferrer"
                className="btn-secondary"
                style={{ padding: "8px 16px", fontSize: 12, textDecoration: "none" }}
              >
                🔍 Explorer ↗
              </a>
            </div>
          </div>
        </div>

        {/* ── Error banner ── */}
        {error && (
          <div className="page-pad" style={{ padding: "12px 0", maxWidth: 1400, margin: "0 auto" }}>
            <div style={{
              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: 12, padding: "12px 18px", color: "#f87171", fontSize: 13,
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <span style={{ fontSize: 16 }}>❌</span> {error}
            </div>
          </div>
        )}

        {/* ── Main content ── */}
        <main className="page-pad" style={{ padding: "20px 0 80px", maxWidth: 1400, margin: "0 auto" }}>

          {/* DASHBOARD TAB */}
          {tab === "dashboard" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }} className="grid-2-col">
              {/* Left column */}
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <PositionCard
                  position={position}
                  address={address}
                  txLoading={txLoading}
                  onDeposit={depositCollateral}
                  onBorrow={borrow}
                />
                <AdminPanel
                  stats={stats}
                  txLoading={txLoading}
                  address={address}
                  onUpdatePrice={updatePrice}
                  onRegisterSubscription={registerSubscription}
                />
              </div>

              {/* Right column */}
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <PositionsTable
                  positions={allPositions}
                  txLoading={txLoading}
                  onManualReact={manualReact}
                />
                <EventLog events={recentEvents} />
              </div>
            </div>
          )}

          {/* LIQUIDATIONS TAB */}
          {tab === "liquidations" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Summary mini-cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }} className="grid-3-col">
                {[
                  { label: "Total Liquidations", value: stats?.totalLiquidations?.toString() ?? "—", icon: "💥", color: "#ef4444", accent: "#dc2626" },
                  { label: "Collateral Seized", value: `${parseFloat(formatEther(stats?.totalCollateralSeized ?? 0n)).toFixed(4)} ETH`, icon: "💰", color: "#fde047", accent: "#eab308" },
                  { label: "Auto-Triggered", value: stats?.totalLiquidationsTriggered?.toString() ?? "—", icon: "⚡", color: "#f97316", accent: "#ea580c" },
                ].map((c) => (
                  <div key={c.label} className="card card-shiny" style={{ padding: "22px 24px", position: "relative" }}>
                    <div className="stat-card-accent" style={{ background: `linear-gradient(90deg,${c.accent},transparent)` }} />
                    <div style={{ fontSize: 28, marginBottom: 10 }}>{c.icon}</div>
                    <div style={{ fontSize: 28, fontWeight: 900, color: c.color, fontFamily: "JetBrains Mono", letterSpacing: "-0.02em" }}>{c.value}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>{c.label}</div>
                  </div>
                ))}
              </div>
              <LiquidationFeed history={liquidationHistory} />
              <EventLog events={recentEvents} />
            </div>
          )}

          {/* ARCHITECTURE TAB */}
          {tab === "architecture" && (
            <ArchitectureTab stats={stats} />
          )}
        </main>

        {/* ── Extravagant Footer ── */}
        <footer className="page-pad" style={{
          borderTop: "1px solid rgba(234,88,12,0.15)",
          paddingTop: 60, paddingBottom: 40,
          background: "linear-gradient(180deg, transparent 0%, rgba(20,8,0,0.8) 100%)",
          backdropFilter: "blur(10px)",
          position: "relative"
        }}>
          {/* Top glow line */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg, transparent, rgba(234,88,12,0.4), rgba(234,179,8,0.2), transparent)" }} />

          <div style={{ maxWidth: 1400, margin: "0 auto", display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", gap: 40, flexWrap: "wrap" }} className="grid-3-col">

            {/* Brand Column */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <img src="/brand-logo.png" alt="ReactorX Logo" style={{ width: 42, height: 42, borderRadius: 12, boxShadow: "0 4px 20px rgba(234,88,12,0.4)" }} />
                <span className="gradient-text-purple" style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.03em" }}>ReactorX</span>
              </div>
              <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, maxWidth: 300 }}>
                The ultimate autonomous liquidation engine built on Somnia's native Event Reactivity. No bots. No cron. Just pure on-chain physics.
              </p>
            </div>

            {/* Links Column */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-secondary)", marginBottom: 4 }}>
                Resources
              </div>
              {[
                { label: "Somnia Documentation", href: "https://docs.somnia.network/developer/reactivity" },
                { label: "Shannon Explorer", href: "https://shannon-explorer.somnia.network" },
                { label: "Testnet Faucet", href: "https://testnet.somnia.network" },
              ].map((l) => (
                <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer"
                  style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: 13, transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)" }}
                  onMouseOver={(e) => { e.currentTarget.style.color = "#eab308"; e.currentTarget.style.paddingLeft = "4px"; }}
                  onMouseOut={(e) => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.paddingLeft = "0px"; }}
                >
                  {l.label}
                </a>
              ))}
            </div>

            {/* Socials / Built For Column */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-secondary)", marginBottom: 4 }}>
                Community
              </div>
              <a href="https://t.me/+XHq0F0JXMyhmMzM0" target="_blank" rel="noopener noreferrer"
                style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: 13, transition: "color 0.2s" }}
                onMouseOver={(e) => (e.currentTarget.style.color = "#eab308")}
                onMouseOut={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
              >
                Telegram Group ↗
              </a>
              <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(234,88,12,0.06)", border: "1px solid rgba(234,88,12,0.15)", borderRadius: 10, width: "fit-content", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 14 }}>🏆</span>
                <span style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 600 }}>Built for Somnia Mini Hackathon</span>
              </div>
            </div>

          </div>

          <div style={{ maxWidth: 1400, margin: "40px auto 0", paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", fontSize: 12, color: "rgba(255,255,255,0.2)" }}>
            <span>© 2026 ReactorX Protocol. All rights reserved.</span>
            <span style={{ fontFamily: "JetBrains Mono" }}>SYS_STATUS: ONLINE</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
