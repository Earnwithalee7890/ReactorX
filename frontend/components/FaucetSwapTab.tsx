"use client";
import { useState, useEffect } from "react";
import { useAccount, useWalletClient, usePublicClient } from "wagmi";
import { parseEther, formatEther, parseUnits, formatUnits } from "viem";
import { CONTRACT_ADDRESSES, REACTOR_DEX_ABI, MOCK_TOKEN_ABI } from "@/lib/contracts";
import { useToast } from "./ToastProvider";

const TOKENS = [
    { symbol: "STT", address: "native", decimals: 18, type: "Native", icon: "💎", color: "#f59e0b" },
    { symbol: "USDC", address: CONTRACT_ADDRESSES.usdc, decimals: 18, type: "ERC20", icon: "💵", color: "#2775ca" },
    { symbol: "USDT", address: CONTRACT_ADDRESSES.usdt, decimals: 18, type: "ERC20", icon: "💳", color: "#26a17b" },
    { symbol: "WETH", address: CONTRACT_ADDRESSES.weth, decimals: 18, type: "ERC20", icon: "⟠", color: "#627eea" },
];

export default function FaucetSwapTab() {
    const { address } = useAccount();
    const { data: walletClient } = useWalletClient();
    const publicClient = usePublicClient();
    const { addToast } = useToast();

    const [loadingMsg, setLoadingMsg] = useState<string | null>(null);
    const [balances, setBalances] = useState<Record<string, string>>({});
    const [fromToken, setFromToken] = useState(TOKENS[0]);
    const [toToken, setToToken] = useState(TOKENS[1]);
    const [amountIn, setAmountIn] = useState("");

    const fetchBalances = async () => {
        if (!address || !publicClient) return;
        const newBals: Record<string, string> = {};
        try {
            const sttBal = await publicClient.getBalance({ address });
            newBals["native"] = formatEther(sttBal);
            for (const t of TOKENS.filter(t => t.type === "ERC20")) {
                if (!t.address || t.address === "undefined") continue;
                const bal = await publicClient.readContract({
                    address: t.address as `0x${string}`,
                    abi: MOCK_TOKEN_ABI,
                    functionName: "balanceOf",
                    args: [address as `0x${string}`],
                });
                newBals[t.address] = formatUnits(bal as bigint, t.decimals);
            }
            setBalances(newBals);
        } catch (err) { console.error(err); }
    };

    useEffect(() => { fetchBalances(); const inv = setInterval(fetchBalances, 10000); return () => clearInterval(inv); }, [address, publicClient]);

    const handleMint = async (tokenAddress: string, symbol: string) => {
        if (!walletClient || !publicClient) return;
        try {
            setLoadingMsg(`Claiming ${symbol}...`);
            const hash = await walletClient.writeContract({
                address: tokenAddress as `0x${string}`,
                abi: MOCK_TOKEN_ABI,
                functionName: "faucet",
            });
            addToast(`Minting 1,000 ${symbol}...`, "info");
            await publicClient.waitForTransactionReceipt({ hash });
            addToast(`Claimed 1,000 ${symbol}`, "success");
            fetchBalances();
        } catch (e: any) {
            if (e.message.includes("wait 24h")) {
                addToast(`Come back in 24 hours.`, "error");
            } else {
                addToast("Transaction failed or rejected.", "error");
            }
        } finally { setLoadingMsg(null); }
    };

    const handleSwap = async () => {
        if (!walletClient || !publicClient || !amountIn) return;
        try {
            setLoadingMsg(`Processing Swap...`);
            const dexAddr = CONTRACT_ADDRESSES.dex;
            if (!dexAddr) throw new Error("DEX Address not configured");

            if (fromToken.type === "Native" && toToken.type === "ERC20") {
                const val = parseEther(amountIn);
                const hash = await walletClient.writeContract({
                    address: dexAddr, abi: REACTOR_DEX_ABI, functionName: "swapSttForToken",
                    args: [toToken.address as `0x${string}`], value: val,
                });
                await publicClient.waitForTransactionReceipt({ hash });
            } else if (fromToken.type === "ERC20" && toToken.type === "Native") {
                const val = parseUnits(amountIn, fromToken.decimals);
                const appHash = await walletClient.writeContract({
                    address: fromToken.address as `0x${string}`, abi: MOCK_TOKEN_ABI,
                    functionName: "approve", args: [dexAddr, val],
                });
                setLoadingMsg(`Approving ${fromToken.symbol}...`);
                await publicClient.waitForTransactionReceipt({ hash: appHash });
                setLoadingMsg(`Executing Swap...`);
                const hash = await walletClient.writeContract({
                    address: dexAddr, abi: REACTOR_DEX_ABI, functionName: "swapTokenForStt",
                    args: [fromToken.address as `0x${string}`, val],
                });
                await publicClient.waitForTransactionReceipt({ hash });
            } else if (fromToken.type === "ERC20" && toToken.type === "ERC20") {
                const val = parseUnits(amountIn, fromToken.decimals);
                const appHash = await walletClient.writeContract({
                    address: fromToken.address as `0x${string}`, abi: MOCK_TOKEN_ABI,
                    functionName: "approve", args: [dexAddr, val],
                });
                setLoadingMsg(`Approving ${fromToken.symbol}...`);
                await publicClient.waitForTransactionReceipt({ hash: appHash });
                setLoadingMsg(`Executing Swap...`);
                const hash = await walletClient.writeContract({
                    address: dexAddr, abi: REACTOR_DEX_ABI, functionName: "swapTokenForToken",
                    args: [fromToken.address as `0x${string}`, toToken.address as `0x${string}`, val],
                });
                await publicClient.waitForTransactionReceipt({ hash });
            }
            addToast(`Swapped ${amountIn} ${fromToken.symbol} to ${toToken.symbol}`, "success");
            fetchBalances(); setAmountIn("");
        } catch (e: any) {
            addToast(e.shortMessage || "Check logs", "error");
        } finally { setLoadingMsg(null); }
    };

    return (
        <div className="page-pad">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", gap: 30, margin: "0 auto", maxWidth: 1100 }}>
                {/* ─── FAUCET PANEL ─── */}
                <div className="card card-shiny" style={{ padding: 32 }}>
                    <div className="stat-card-accent" style={{ background: "linear-gradient(90deg, #3b82f6, #06b6d4, transparent)" }} />
                    <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", marginBottom: 12 }}>💧 Token Faucet</h2>
                    <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 30, lineHeight: 1.6 }}>
                        Get 1,000 mock tokens every 24 hours to test borrowing, pooling, and liquidations.
                    </p>

                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        {TOKENS.filter(t => t.type === "ERC20").map((token) => (
                            <div key={token.symbol} className="onboarding-step" style={{ padding: '16px 20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 15, flex: 1 }}>
                                    <span style={{ fontSize: 28 }}>{token.icon}</span>
                                    <div>
                                        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{token.symbol}</div>
                                        <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: 'JetBrains Mono' }}>
                                            Bal: {balances[token.address] ? parseFloat(balances[token.address]).toLocaleString() : "0"}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    className="btn-primary"
                                    onClick={() => handleMint(token.address, token.symbol)}
                                    disabled={!!loadingMsg}
                                    style={{ padding: "10px 18px", fontSize: 12, fontWeight: 700 }}
                                >
                                    Claim
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ─── AMM SWAP PANEL ─── */}
                <div className="card card-shiny" style={{ padding: 32 }}>
                    <div className="stat-card-accent" style={{ background: "linear-gradient(90deg, #8b5cf6, #d946ef, transparent)" }} />
                    <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", marginBottom: 12 }}>🔄 Reactor AMM</h2>
                    <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 30, lineHeight: 1.6 }}>
                        Swap between assets instantly using our fixed-price demo AMM.
                    </p>

                    <div style={{ display: "flex", flexDirection: "column", gap: 10, background: "rgba(0,0,0,0.3)", padding: 20, borderRadius: 20, border: "1px solid rgba(255,255,255,0.08)" }}>
                        {/* FROM */}
                        <div style={{ marginBottom: 10 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)" }}>PAY</span>
                                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                                    Available: {balances[fromToken.address] ? parseFloat(balances[fromToken.address]).toFixed(6) : "0"}
                                </span>
                            </div>
                            <div style={{ display: "flex", gap: 12, alignItems: 'center' }}>
                                <select
                                    className="input-styled"
                                    value={fromToken.symbol}
                                    onChange={(e) => setFromToken(TOKENS.find(t => t.symbol === e.target.value)!)}
                                    style={{ width: 110, fontSize: 14, fontWeight: 700, height: 48 }}
                                >
                                    {TOKENS.map(t => <option key={t.symbol} value={t.symbol}>{t.icon} {t.symbol}</option>)}
                                </select>
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    className="input-styled"
                                    value={amountIn}
                                    onChange={(e) => setAmountIn(e.target.value)}
                                    style={{ flex: 1, fontSize: 24, fontWeight: 800, textAlign: 'right', border: 'none', background: 'transparent' }}
                                />
                            </div>
                        </div>

                        <div style={{ display: "flex", justifyContent: "center", margin: "-12px 0" }}>
                            <button
                                onClick={() => { const t = fromToken; setFromToken(toToken); setToToken(t); }}
                                style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "12px", padding: "8px 12px", cursor: "pointer", color: "var(--text-secondary)", zIndex: 2 }}
                            >
                                ↓
                            </button>
                        </div>

                        {/* TO */}
                        <div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, marginTop: 10 }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)" }}>RECEIVE</span>
                            </div>
                            <div style={{ display: "flex", gap: 12, alignItems: 'center' }}>
                                <select
                                    className="input-styled"
                                    value={toToken.symbol}
                                    onChange={(e) => setToToken(TOKENS.find(t => t.symbol === e.target.value)!)}
                                    style={{ width: 110, fontSize: 14, fontWeight: 700, height: 48 }}
                                >
                                    {TOKENS.map(t => <option key={t.symbol} value={t.symbol}>{t.icon} {t.symbol}</option>)}
                                </select>
                                <input
                                    type="text"
                                    placeholder="Estimated"
                                    disabled
                                    className="input-styled"
                                    style={{ flex: 1, fontSize: 24, fontWeight: 800, textAlign: 'right', border: 'none', background: 'transparent', opacity: 0.4 }}
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        className="btn-purple"
                        onClick={handleSwap}
                        disabled={!!loadingMsg || !amountIn || fromToken.symbol === toToken.symbol}
                        style={{ width: "100%", marginTop: 24, padding: "20px", fontSize: 16, fontWeight: 800, borderRadius: 16 }}
                    >
                        {loadingMsg ? <span><span className="spinner" /> {loadingMsg}</span> : "Swap Assets"}
                    </button>
                    {fromToken.symbol === toToken.symbol && (
                        <div style={{ color: "#f87171", fontSize: 11, marginTop: 12, textAlign: "center", fontWeight: 600 }}>Switch target token to swap</div>
                    )}
                </div>
            </div>
        </div>
    );
}
