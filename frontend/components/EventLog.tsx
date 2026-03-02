"use client";

interface Props { events: string[]; }

export default function EventLog({ events }: Props) {
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

    return (
        <div className="card glow-border-orange" style={{ overflow: "hidden" }}>
            <div style={{
                padding: "18px 24px",
                borderBottom: "1px solid rgba(59,27,11,0.8)",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                background: "rgba(17,7,0,0.4)",
            }}>
                <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>
                    📡 Real-Time Event Log
                </h2>
                <span className="badge badge-purple">
                    <span className="dot-pulse purple" />
                    WebSocket
                </span>
            </div>

            <div style={{ maxHeight: 280, overflowY: "auto" }}>
                {events.length === 0 ? (
                    <div style={{ padding: "24px 20px", color: "var(--text-muted)", fontSize: 12, fontFamily: "JetBrains Mono, monospace" }}>
                        <span style={{ color: "var(--reactor-purple-light)" }}>{now}</span>
                        {" "}Listening for on-chain events via WebSocket…
                    </div>
                ) : (
                    events.map((event, i) => (
                        <div key={i} className={`event-entry${i === 0 ? " latest" : ""}`}>
                            <span style={{ color: i === 0 ? "#f97316" : "var(--text-muted)", marginRight: 10 }}>
                                {now}
                            </span>
                            {event}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
