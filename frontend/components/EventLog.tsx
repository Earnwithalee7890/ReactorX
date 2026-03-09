"use client";
import { useEffect, useState, useRef } from "react";

interface Props { events: string[]; }

const STORAGE_KEY = "reactorx_event_log";
const MAX_SAVED = 200;

interface SavedEvent {
    text: string;
    time: string;
    isReactivity: boolean;
}

export default function EventLog({ events }: Props) {
    const [savedEvents, setSavedEvents] = useState<SavedEvent[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                setSavedEvents(JSON.parse(stored));
            }
        } catch { }
    }, []);

    // Save new events to localStorage when they arrive
    useEffect(() => {
        if (events.length === 0) return;

        const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

        const newSaved: SavedEvent[] = events.map(e => ({
            text: e,
            time: now,
            isReactivity: e.toLowerCase().includes("reactivity") || e.toLowerCase().includes("dyn pushed")
        }));

        setSavedEvents(prev => {
            // Deduplicate: only add events not already in the list
            const existingTexts = new Set(prev.map(p => p.text));
            const unique = newSaved.filter(n => !existingTexts.has(n.text));
            const combined = [...unique, ...prev].slice(0, MAX_SAVED);

            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(combined));
            } catch { }

            return combined;
        });
    }, [events]);

    const clearLog = () => {
        setSavedEvents([]);
        localStorage.removeItem(STORAGE_KEY);
    };

    return (
        <div style={{
            borderRadius: 20, overflow: "hidden",
            background: "linear-gradient(135deg, rgba(2,6,23,0.95), rgba(15,23,42,0.8))",
            border: "1px solid rgba(251,191,36,0.1)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.3)"
        }}>
            {/* Header */}
            <div style={{
                padding: "18px 24px",
                borderBottom: "1px solid rgba(251,191,36,0.08)",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                background: "linear-gradient(135deg, rgba(251,191,36,0.04), transparent)",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <h2 style={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.08em", color: "rgba(255,255,255,0.6)", margin: 0 }}>
                        📡 EVENT LOG
                    </h2>
                    <span style={{
                        fontSize: 10, fontWeight: 700, color: "rgba(251,191,36,0.7)",
                        background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.15)",
                        padding: "3px 8px", borderRadius: 8
                    }}>
                        {savedEvents.length} events
                    </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <button
                        onClick={clearLog}
                        style={{
                            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                            borderRadius: 8, padding: "4px 10px", fontSize: 10, fontWeight: 700,
                            color: "#f87171", cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif"
                        }}
                    >
                        Clear
                    </button>
                    <div style={{
                        display: "flex", alignItems: "center", gap: 5,
                        padding: "4px 10px", borderRadius: 8,
                        background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)"
                    }}>
                        <div style={{
                            width: 6, height: 6, borderRadius: "50%", background: "#10b981",
                            boxShadow: "0 0 6px #10b981",
                            animation: "pulse-glow 2s ease-in-out infinite"
                        }} />
                        <span style={{ fontSize: 10, fontWeight: 700, color: "#34d399" }}>LIVE</span>
                    </div>
                </div>
            </div>

            {/* Events */}
            <div ref={scrollRef} style={{ maxHeight: 350, overflowY: "auto" }}>
                {savedEvents.length === 0 ? (
                    <div style={{
                        padding: "32px 24px", textAlign: "center",
                        color: "rgba(255,255,255,0.3)", fontSize: 13
                    }}>
                        Waiting for on-chain events...
                    </div>
                ) : (
                    savedEvents.map((event, i) => (
                        <div key={`${event.time}-${i}`} style={{
                            padding: "12px 24px",
                            borderBottom: "1px solid rgba(255,255,255,0.03)",
                            display: "flex", alignItems: "flex-start", gap: 12,
                            background: i === 0 ? "rgba(251,191,36,0.03)" : "transparent",
                            transition: "background 0.2s"
                        }}>
                            <span style={{
                                fontSize: 11, color: "rgba(255,255,255,0.25)",
                                fontFamily: "'JetBrains Mono', monospace",
                                flexShrink: 0
                            }}>
                                {event.time}
                            </span>
                            <div style={{ flex: 1, fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>
                                {event.isReactivity && (
                                    <span style={{
                                        display: "inline-block", fontSize: 9, fontWeight: 800,
                                        background: "rgba(139,92,246,0.15)", color: "#a78bfa",
                                        padding: "2px 6px", borderRadius: 4, marginRight: 6,
                                        letterSpacing: "0.05em", verticalAlign: "middle"
                                    }}>
                                        REACTIVITY
                                    </span>
                                )}
                                {event.text}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
