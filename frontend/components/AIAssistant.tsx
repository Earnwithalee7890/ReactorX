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
                <div className="ai-panel card card-glass shadow-2xl">
                    <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(139,92,246,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h3 style={{ fontSize: 14, fontWeight: 800 }} className="gradient-text-purple">Navigator AI</h3>
                        <span style={{ fontSize: 10, color: "var(--text-muted)" }}>ReactorX v1.0</span>
                    </div>

                    <div className="ai-chat-body" ref={scrollRef}>
                        {messages.map((m, i) => (
                            <div key={i} className={`ai-msg ${m.role === "bot" ? "ai-msg-bot" : "ai-msg-user"}`}>
                                {m.content}
                            </div>
                        ))}
                    </div>

                    <div style={{ padding: "16px", background: "rgba(0,0,0,0.2)", display: "flex", flexDirection: "column", gap: 8 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 4 }}>Quick Questions:</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {PROTOCOL_KNOWLEDGE.map(k => (
                                <button
                                    key={k.q}
                                    onClick={() => handleAsk(k.q)}
                                    style={{
                                        background: "rgba(139,92,246,0.05)",
                                        border: "1px solid rgba(139,92,246,0.1)",
                                        borderRadius: "8px",
                                        padding: "6px 10px",
                                        fontSize: "11px",
                                        color: "var(--text-secondary)",
                                        cursor: "pointer",
                                        transition: "all 0.2s"
                                    }}
                                    onMouseOver={(e) => (e.currentTarget.style.borderColor = "var(--reactor-purple)")}
                                    onMouseOut={(e) => (e.currentTarget.style.borderColor = "rgba(139,92,246,0.1)")}
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
