"use client";
import React, { useState, useEffect, useRef } from "react";

const PROTOCOL_KNOWLEDGE = [
    { q: "What is ReactorX?", a: "ReactorX is an autonomous lending protocol on Somnia Network that uses Native On-Chain Reactivity to handle liquidations without off-chain bots." },
    { q: "How do I deposit collateral?", a: "Go to the Dashboard, select your asset (SST, USDC, etc.) in the Position Card, and click Deposit. Note: ERC20s like USDC need an approval transaction first." },
    { q: "What makes it 'Reactive'?", a: "Whenever a price changes or a user borrows, the Somnia network automatically triggers a 'Reaction' if the health factor is low. This happens directly on the validator level." },
    { q: "How do I get test tokens?", a: "Use the 'Faucet & Swap' tab in the sidebar. You can claim STT, USDC, USDT, and WETH every 24 hours." },
    { q: "What is a Health Factor?", a: "It's the ratio of your collateral to your debt. If it drops below 1.0, your position is automatically liquidated by the Reactor Engine." },
];

export default function AIAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ role: "bot" | "user"; content: string }[]>([
        { role: "bot", content: "Hi! I'm your ReactorX Guide. How can I help you navigate the Somnia Testnet today?" }
    ]);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const handleAsk = (q: string) => {
        const found = PROTOCOL_KNOWLEDGE.find(k => k.q === q);
        setMessages(prev => [
            ...prev,
            { role: "user", content: q },
            { role: "bot", content: found ? found.a : "Interesting question! For that, checking the official Somnia documentation would be best." }
        ]);
    };

    return (
        <>
            <div className="ai-fab" onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? "✕" : "🤖"}
            </div>

            {isOpen && (
                <div className="ai-panel card shadow-2xl animate-scale-in" style={{
                    borderRadius: 32, background: "rgba(2,6,23,0.98)",
                    border: "1px solid rgba(251,191,36,0.3)", width: 380, height: 500,
                    display: "flex", flexDirection: "column"
                }}>
                    <div style={{
                        padding: "24px", borderBottom: "1px solid rgba(251,191,36,0.15)",
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        background: "linear-gradient(to right, rgba(251,191,36,0.05), transparent)"
                    }}>
                        <div>
                            <h3 style={{ fontSize: 16, fontWeight: 900, color: "var(--reactor-gold)" }}>NAVIGATOR AI</h3>
                            <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700 }}>REACTORX INTEGRATED GUIDE</div>
                        </div>
                        <button onClick={() => setIsOpen(false)} style={{ background: "transparent", border: "none", color: "white", cursor: "pointer", fontSize: 18 }}>✕</button>
                    </div>

                    <div className="ai-chat-body" ref={scrollRef} style={{ flex: 1, padding: 20 }}>
                        {messages.map((m, i) => (
                            <div key={i} className={`ai-msg ${m.role === "bot" ? "ai-msg-bot" : "ai-msg-user"}`} style={{
                                background: m.role === "bot" ? "rgba(255,255,255,0.05)" : "rgba(251,191,36,0.1)",
                                border: `1px solid ${m.role === "bot" ? "rgba(251,191,36,0.1)" : "rgba(251,191,36,0.3)"}`,
                                color: m.role === "bot" ? "var(--text-secondary)" : "#fff"
                            }}>
                                {m.content}
                            </div>
                        ))}
                    </div>

                    <div style={{ padding: "20px", background: "rgba(0,0,0,0.4)", borderTop: "1px solid rgba(251,191,36,0.1)" }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: "var(--reactor-gold)", marginBottom: 10 }}>QUICK COMMANDS:</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                            {PROTOCOL_KNOWLEDGE.slice(0, 3).map(k => (
                                <button
                                    key={k.q}
                                    onClick={() => handleAsk(k.q)}
                                    style={{
                                        background: "rgba(255,255,255,0.02)",
                                        border: "1px solid rgba(255,255,255,0.1)",
                                        borderRadius: "10px",
                                        padding: "8px 12px",
                                        fontSize: "12px",
                                        color: "#fff",
                                        cursor: "pointer",
                                        transition: "all 0.2s"
                                    }}
                                >
                                    {k.q}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
