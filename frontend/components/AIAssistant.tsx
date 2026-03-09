"use client";
import React, { useState, useEffect, useRef } from "react";

// ── Deep Platform Knowledge Base ──────────────────────────────────────
const PLATFORM_KB: { keywords: string[]; answer: string }[] = [
    {
        keywords: ["reactorx", "what is", "about", "platform", "protocol"],
        answer: "ReactorX is a fully autonomous DeFi lending & liquidation protocol built on the Somnia Shannon Testnet. It uses Somnia's Native On-Chain Reactivity to automatically detect unhealthy positions and liquidate them — without any off-chain bots or keepers. Everything is handled by the blockchain itself!"
    },
    {
        keywords: ["deposit", "collateral", "how to deposit", "add collateral"],
        answer: "To deposit collateral:\n1. Go to the Dashboard tab\n2. In the 'Position Intelligence' card, select the 'Deposit' tab\n3. Choose an asset (STT, USDC, USDT, or WETH)\n4. Enter the amount and click 'Deposit'\n\n💡 For ERC20 tokens (USDC/USDT/WETH), you'll need to approve the token first — this is automatic. Make sure you have claimed tokens from the Faucet first!"
    },
    {
        keywords: ["borrow", "how to borrow", "loan", "take loan"],
        answer: "To borrow:\n1. First deposit collateral (see 'How to deposit')\n2. Switch to the 'Borrow' tab in Position Intelligence\n3. Select the asset you want to borrow\n4. Enter the amount (make sure your Health Factor stays above 1.0)\n5. Click 'Borrow'\n\n⚠️ If your Health Factor drops below 1.0, your position will be automatically liquidated by the Reactor Engine!"
    },
    {
        keywords: ["health factor", "health", "liquidation threshold", "liquidat"],
        answer: "Health Factor = (Collateral Value × Liquidation Threshold) / Debt Value\n\n🟢 SAFE (>2.0): Your position is healthy\n🟡 WARNING (1.2-2.0): Consider adding collateral\n🔴 DANGER (1.0-1.2): Liquidation risk!\n💀 LIQUIDATABLE (<1.0): Will be auto-liquidated\n\nThe Reactor Engine monitors this automatically via Somnia's native reactivity — no bots needed!"
    },
    {
        keywords: ["faucet", "test token", "claim", "free token", "get token", "daily check"],
        answer: "Get free testnet tokens:\n1. Go to 'Faucet & Swap' in the sidebar\n2. Click 'Claim' next to any token (USDC, USDT, WETH)\n3. Each claim gives you 1,000 tokens\n4. You can also use the '💰 Daily Check-in' button on the Dashboard\n\n⏰ There's a 24-hour cooldown between claims for each token. Make sure you have STT for gas!"
    },
    {
        keywords: ["swap", "exchange", "trade", "amm"],
        answer: "To swap tokens:\n1. Go to 'Faucet & Swap' tab\n2. The 'Reactor AMM' panel is on the right\n3. Select your FROM and TO tokens\n4. Enter the amount\n5. Click 'Swap Assets'\n\nThe AMM uses a fixed-price oracle model for the hackathon demo. Prices are set by the protocol admin."
    },
    {
        keywords: ["reaction", "total reaction", "reactive", "reactivity", "trigger"],
        answer: "Total Reactions = the number of times Somnia's Native On-Chain Reactivity has automatically triggered an action.\n\nWhen a price change makes a position unhealthy (Health Factor < 1.0), the Reactor Engine automatically fires a 'reaction' to liquidate it. This is the core innovation — no off-chain bots needed!\n\nYou can register a reactive subscription in the Admin Console to enable this."
    },
    {
        keywords: ["subscription", "register", "precompile", "reactor engine"],
        answer: "The Reactive Subscription connects the ReactorX protocol to Somnia's native reactivity system:\n\n1. Go to the 'Admin Console' tab\n2. Click 'REGISTER WITH PRECOMPILE'\n3. This creates an on-chain subscription that monitors price changes\n4. When triggered, it automatically calls the liquidation function\n\nStatus shows as 'ACTIVE' with a subscription ID when successful."
    },
    {
        keywords: ["stt", "gas", "native token", "somnia token"],
        answer: "STT (Somnia Test Token) is the native gas token on the Shannon Testnet.\n\n• Used for all transaction gas fees\n• Can be deposited as collateral\n• Get free STT from: https://testnet.somnia.network\n\nYou need STT to perform any action on ReactorX!"
    },
    {
        keywords: ["admin", "price", "update price", "oracle"],
        answer: "The Admin Console lets the protocol owner:\n\n1. 📊 Update Price: Change the STT/USD oracle price to simulate market movements\n2. 🛰️ Register Subscription: Connect to Somnia's native reactivity\n3. 🛠️ Initialize Assets: Register tokens as supported collateral\n\nPrice changes can trigger automatic liquidations if positions become unhealthy!"
    },
    {
        keywords: ["wallet", "connect", "metamask", "okx", "bitget"],
        answer: "To connect your wallet:\n1. Click 'Connect Wallet' in the top-right header\n2. Choose MetaMask, OKX Wallet, or Bitget Wallet\n3. Make sure you're on Somnia Shannon Testnet (Chain ID: 50312)\n\n📱 The network will be auto-added if not configured. RPC: https://dream-rpc.somnia.network"
    },
    {
        keywords: ["architecture", "system", "how does it work", "technical"],
        answer: "ReactorX Architecture:\n\n📦 Smart Contracts:\n• LendingMock — Manages deposits, borrows, health factors\n• ReactorEngine — Monitors positions via Somnia reactivity\n• LiquidationManager — Executes liquidations + seizes collateral\n• ReactorDex — Fixed-price AMM for token swaps\n• MockToken — Test ERC20s (USDC, USDT, WETH)\n\n⚡ Flow: Price Change → Reactive Trigger → Health Check → Auto-Liquidation"
    },
    {
        keywords: ["initialize", "setup", "configure", "asset registration"],
        answer: "If your deposits aren't showing as collateral:\n1. Go to 'Admin Console' tab\n2. Click '🛠️ INITIALIZE ASSETS'\n3. This registers USDC, USDT, and WETH as supported collateral\n4. Only the contract owner can do this\n\nAfter initialization, deposits will properly track as collateral!"
    },
];

// Quick suggestions shown as chips
const QUICK_QUESTIONS = [
    "What is ReactorX?",
    "How to deposit?",
    "What is Health Factor?",
    "How to get test tokens?",
    "What are Reactions?",
];

function findAnswer(query: string): string {
    const q = query.toLowerCase();

    // Find best matching entry
    let bestMatch: typeof PLATFORM_KB[0] | null = null;
    let bestScore = 0;

    for (const entry of PLATFORM_KB) {
        let score = 0;
        for (const kw of entry.keywords) {
            if (q.includes(kw.toLowerCase())) {
                score += kw.length; // longer keyword matches = better
            }
        }
        if (score > bestScore) {
            bestScore = score;
            bestMatch = entry;
        }
    }

    if (bestMatch && bestScore > 0) {
        return bestMatch.answer;
    }

    return "I'm not sure about that specific topic. Try asking about:\n• Depositing collateral\n• Borrowing assets\n• Health Factor & Liquidations\n• Getting test tokens\n• How Reactions work\n• Wallet connection\n\nOr check the System Architecture tab for a full technical overview!";
}

export default function AIAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ role: "bot" | "user"; content: string }[]>([
        { role: "bot", content: "👋 Welcome to ReactorX Navigator!\n\nI know everything about this platform. Ask me anything about depositing, borrowing, liquidations, swaps, or how the Somnia reactivity system works!" }
    ]);
    const [inputText, setInputText] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleSend = (text?: string) => {
        const q = (text || inputText).trim();
        if (!q) return;

        const answer = findAnswer(q);
        setMessages(prev => [
            ...prev,
            { role: "user", content: q },
            { role: "bot", content: answer }
        ]);
        setInputText("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <>
            <div className="ai-fab" onClick={() => setIsOpen(!isOpen)} style={{
                position: "fixed", bottom: 24, right: 24, width: 56, height: 56,
                borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 24, cursor: "pointer", zIndex: 1000,
                background: "linear-gradient(135deg, var(--reactor-gold), #d97706)",
                boxShadow: "0 4px 20px rgba(251,191,36,0.4)",
                border: "none", color: "#000", fontWeight: 900,
                transition: "all 0.3s ease"
            }}>
                {isOpen ? "✕" : "🤖"}
            </div>

            {isOpen && (
                <div className="animate-scale-in" style={{
                    position: "fixed", bottom: 90, right: 24,
                    borderRadius: 24, background: "rgba(2,6,23,0.98)",
                    border: "1px solid rgba(251,191,36,0.25)", width: 400, height: 560,
                    display: "flex", flexDirection: "column", zIndex: 1001,
                    boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(251,191,36,0.1)",
                    backdropFilter: "blur(20px)",
                    overflow: "hidden"
                }}>
                    {/* Header */}
                    <div style={{
                        padding: "20px 24px", borderBottom: "1px solid rgba(251,191,36,0.15)",
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        background: "linear-gradient(135deg, rgba(251,191,36,0.08), transparent)"
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{
                                width: 36, height: 36, borderRadius: 12,
                                background: "linear-gradient(135deg, var(--reactor-gold), #d97706)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 18
                            }}>🤖</div>
                            <div>
                                <h3 style={{ fontSize: 15, fontWeight: 900, color: "var(--reactor-gold)", margin: 0 }}>NAVIGATOR AI</h3>
                                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>REACTORX PLATFORM GUIDE</div>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} style={{
                            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                            color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: 14,
                            width: 32, height: 32, borderRadius: 10, display: "flex",
                            alignItems: "center", justifyContent: "center"
                        }}>✕</button>
                    </div>

                    {/* Messages */}
                    <div ref={scrollRef} style={{
                        flex: 1, padding: "16px", overflowY: "auto",
                        display: "flex", flexDirection: "column", gap: 12
                    }}>
                        {messages.map((m, i) => (
                            <div key={i} style={{
                                padding: "12px 16px",
                                borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                                background: m.role === "user"
                                    ? "linear-gradient(135deg, rgba(251,191,36,0.15), rgba(251,191,36,0.08))"
                                    : "rgba(255,255,255,0.04)",
                                border: `1px solid ${m.role === "user" ? "rgba(251,191,36,0.25)" : "rgba(255,255,255,0.06)"}`,
                                color: m.role === "user" ? "#fff" : "rgba(255,255,255,0.8)",
                                fontSize: 13, lineHeight: 1.6,
                                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                                maxWidth: "85%",
                                whiteSpace: "pre-line"
                            }}>
                                {m.content}
                            </div>
                        ))}
                    </div>

                    {/* Quick Suggestions */}
                    <div style={{
                        padding: "8px 16px", display: "flex", gap: 6,
                        overflowX: "auto", borderTop: "1px solid rgba(255,255,255,0.05)"
                    }}>
                        {QUICK_QUESTIONS.map(q => (
                            <button
                                key={q}
                                onClick={() => handleSend(q)}
                                style={{
                                    background: "rgba(251,191,36,0.06)",
                                    border: "1px solid rgba(251,191,36,0.15)",
                                    borderRadius: 20, padding: "6px 12px",
                                    fontSize: 11, color: "var(--reactor-gold)",
                                    cursor: "pointer", whiteSpace: "nowrap",
                                    fontWeight: 600, transition: "all 0.2s"
                                }}
                            >
                                {q}
                            </button>
                        ))}
                    </div>

                    {/* Text Input */}
                    <div style={{
                        padding: "16px", borderTop: "1px solid rgba(251,191,36,0.1)",
                        background: "rgba(0,0,0,0.3)",
                        display: "flex", gap: 10, alignItems: "center"
                    }}>
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask me anything about ReactorX..."
                            style={{
                                flex: 1, background: "rgba(255,255,255,0.05)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                borderRadius: 12, padding: "12px 16px",
                                color: "#fff", fontSize: 13,
                                outline: "none", fontFamily: "inherit"
                            }}
                        />
                        <button
                            onClick={() => handleSend()}
                            disabled={!inputText.trim()}
                            style={{
                                width: 42, height: 42, borderRadius: 12,
                                background: inputText.trim()
                                    ? "linear-gradient(135deg, var(--reactor-gold), #d97706)"
                                    : "rgba(255,255,255,0.05)",
                                border: "none", color: inputText.trim() ? "#000" : "rgba(255,255,255,0.3)",
                                fontWeight: 900, fontSize: 18,
                                cursor: inputText.trim() ? "pointer" : "default",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                transition: "all 0.2s"
                            }}
                        >
                            →
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
