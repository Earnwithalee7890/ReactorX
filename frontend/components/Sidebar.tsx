"use client";
import React from "react";

interface Props {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

export default function Sidebar({ activeTab, onTabChange }: Props) {
    const items = [
        { id: "dashboard", label: "Dashboard", icon: "📊" },
        { id: "faucet", label: "Faucet & Swap", icon: "💧" },
        { id: "admin", label: "Admin Console", icon: "🎛️" },
        { id: "architecture", label: "System View", icon: "🏗️" },
        { id: "settings", label: "Network Settings", icon: "⚙️" },
    ];

    return (
        <aside className="sidebar">
            <div style={{ padding: "0 16px 20px", borderBottom: "1px solid rgba(139,92,246,0.1)", marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    Main Menu
                </div>
            </div>

            {items.map((item) => (
                <div
                    key={item.id}
                    className={`sidebar-item ${activeTab === item.id ? "active" : ""}`}
                    onClick={() => onTabChange(item.id)}
                >
                    <span style={{ fontSize: 18 }}>{item.icon}</span>
                    <span>{item.label}</span>
                </div>
            ))}

            <div style={{ marginTop: "auto", padding: "16px" }}>
                <div className="card card-glass" style={{ padding: "16px", borderRadius: "12px", border: "1px solid rgba(139,92,246,0.1)" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>Shannon Testnet</div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", lineHeight: 1.5 }}>
                        Chain ID: 50312<br />
                        Status: <span style={{ color: "var(--reactor-green)" }}>Online ⚡</span>
                    </div>
                </div>
            </div>
        </aside>
    );
}
