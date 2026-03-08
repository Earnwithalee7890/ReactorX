"use client";
import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from "react";

// ─── Toast Context ─────────────────────────────────────────────────────────
type ToastType = "success" | "error" | "info" | "warning";
interface Toast {
    id: number;
    message: string;
    type: ToastType;
    emoji?: string;
}

interface ToastCtx {
    addToast: (msg: string, type?: ToastType, emoji?: string) => void;
}

const ToastContext = createContext<ToastCtx>({ addToast: () => { } });

export function useToast() {
    return useContext(ToastContext);
}

// ─── Individual Toast ──────────────────────────────────────────────────────
function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
    useEffect(() => {
        const timer = setTimeout(onRemove, 4500);
        return () => clearTimeout(timer);
    }, [onRemove]);

    const colors: Record<ToastType, string> = {
        success: "#10b981",
        error: "#ef4444",
        info: "#eab308",
        warning: "#f59e0b",
    };

    const defaultEmoji: Record<ToastType, string> = {
        success: "✅",
        error: "❌",
        info: "ℹ️",
        warning: "⚠️",
    };

    return (
        <div
            className={`toast toast-${toast.type}`}
            onClick={onRemove}
            style={{ cursor: "pointer" }}
        >
            <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>
                {toast.emoji ?? defaultEmoji[toast.type]}
            </span>
            <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: colors[toast.type], marginBottom: 3 }}>
                    {toast.type === "success" ? "Success" : toast.type === "error" ? "Error" : toast.type === "warning" ? "Warning" : "Info"}
                </div>
                <div style={{ color: "var(--text-secondary)", fontSize: 12, lineHeight: 1.6 }}>
                    {toast.message}
                </div>
            </div>
        </div>
    );
}

// ─── Toast Provider ────────────────────────────────────────────────────────
export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    let idRef = 0;

    const addToast = useCallback((message: string, type: ToastType = "info", emoji?: string) => {
        const id = ++idRef;
        setToasts((prev) => [...prev.slice(-4), { id, message, type, emoji }]);
    }, []);

    const removeToast = useCallback((id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div className="toast-container">
                {toasts.map((t) => (
                    <ToastItem key={t.id} toast={t} onRemove={() => removeToast(t.id)} />
                ))}
            </div>
        </ToastContext.Provider>
    );
}
