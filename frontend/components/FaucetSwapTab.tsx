"use client";
import { useState, useEffect } from "react";
import { useAccount, useWalletClient, usePublicClient } from "wagmi";
import { parseEther, formatEther, parseUnits, formatUnits } from "viem";
import { CONTRACT_ADDRESSES, REACTOR_DEX_ABI, MOCK_TOKEN_ABI } from "@/lib/contracts";
import { useToast } from "./ToastProvider";

const TOKENS = [
    {
        symbol: "STT", address: "native", decimals: 18, type: "Native",
        icon: "/logo-new.png", color: "#f59e0b"
    },
    {
        symbol: "USDC", address: CONTRACT_ADDRESSES.usdc, decimals: 6, type: "ERC20",
        icon: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png", color: "#2775ca"
    },
    {
        symbol: "USDT", address: CONTRACT_ADDRESSES.usdt, decimals: 6, type: "ERC20",
        icon: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png", color: "#26a17b"
    },
    {
        symbol: "WETH", address: CONTRACT_ADDRESSES.weth, decimals: 18, type: "ERC20",
        icon: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png", color: "#627eea"
    },
];

export default function FaucetSwapTab() {
    const { address, isConnected } = useAccount();
    const { data: walletClient } = useWalletClient();
    const publicClient = usePublicClient();
    const { addToast } = useToast();

    const [loadingMsg, setLoadingMsg] = useState<string | null>(null);
    const [balances, setBalances] = useState<Record<string, string>>({});
    const [fromToken, setFromToken] = useState(TOKENS[0]);
    const [toToken, setToToken] = useState(TOKENS[1]);
    const [amountIn, setAmountIn] = useState("");
    const [amountOut, setAmountOut] = useState("");

    const fetchBalances = async () => {
        if (!address || !publicClient) return;
        const newBals: Record<string, string> = {};
        try {
            const sttBal = await publicClient.getBalance({ address });
            newBals["native"] = formatEther(sttBal);
            for (const t of TOKENS.filter(t => t.type === "ERC20")) {
                if (!t.address || (t.address as any) === "undefined") continue;
                const bal = await publicClient.readContract({
                    address: t.address as `0x${string}`,
                    abi: MOCK_TOKEN_ABI,
                    functionName: "balanceOf",
                    args: [address as `0x${string}`],
                });
                newBals[t.address] = formatUnits(bal as bigint, t.decimals);
            }
            setBalances(newBals);
        } catch (err) { console.error("Balance fetch error:", err); }
    };

    const getEstimate = async () => {
        if (!publicClient || !amountIn || isNaN(Number(amountIn)) || Number(amountIn) <= 0) {
            setAmountOut("");
            return;
        }
        try {
            const dexAddr = CONTRACT_ADDRESSES.dex;
            if (!dexAddr) return;

            // Fetch current oracle prices from DEX
            const sttPrice = await publicClient.readContract({
                address: dexAddr, abi: REACTOR_DEX_ABI, functionName: "sttPrice"
            }) as bigint;

            const getPrice = async (t: typeof TOKENS[0]) => {
                if (t.type === "Native") return sttPrice;
                return await publicClient.readContract({
                    address: dexAddr, abi: REACTOR_DEX_ABI, functionName: "tokenPrices",
                    args: [t.address as `0x${string}`]
                }) as bigint;
            };

            const pIn = await getPrice(fromToken);
            const pOut = await getPrice(toToken);

            if (pIn > 0n && pOut > 0n) {
                const valIn = parseUnits(amountIn, fromToken.decimals);
                const valUsd = (valIn * pIn) / parseUnits("1", fromToken.decimals);
                const valOut = (valUsd * parseUnits("1", toToken.decimals)) / pOut;
                setAmountOut(parseFloat(formatUnits(valOut, toToken.decimals)).toFixed(4));
            }
        } catch (e) {
            console.error("Simulation error:", e);
            setAmountOut("Error");
        }
    };

    useEffect(() => {
        fetchBalances();
        const inv = setInterval(fetchBalances, 10000);
        return () => clearInterval(inv);
    }, [address, publicClient]);

    useEffect(() => {
        getEstimate();
    }, [amountIn, fromToken, toToken, publicClient]);

    const handleMint = async (tokenAddress: string, symbol: string) => {
        if (!walletClient || !publicClient) {
            addToast("Please connect your wallet first", "error");
            return;
        }
        try {
            setLoadingMsg(`Claiming ${symbol}...`);
            const hash = await walletClient.writeContract({
                address: tokenAddress as `0x${string}`,
                abi: MOCK_TOKEN_ABI,
                functionName: "faucet",
            });
            addToast(`Minting 1,000 ${symbol}... TX sent`, "info");
            await publicClient.waitForTransactionReceipt({ hash });
            addToast(`Successfully claimed 1,000 ${symbol}!`, "success");
            fetchBalances();
        } catch (e: any) {
            console.error(e);
            if (e.message?.includes("wait 24h")) {
                addToast(`Faucet limit reached. Come back in 24h.`, "error");
            } else {
                addToast("Transaction failed. Check your STT balance for gas.", "error");
            }
        } finally { setLoadingMsg(null); }
    };

    const handleSwap = async () => {
        if (!walletClient || !publicClient || !amountIn) return;
        try {
            setLoadingMsg(`Swapping ${fromToken.symbol} to ${toToken.symbol}...`);
            const dexAddr = CONTRACT_ADDRESSES.dex;
            if (!dexAddr || (dexAddr as any) === "undefined") throw new Error("DEX Address not found");

            let hash;
            if (fromToken.type === "Native" && toToken.type === "ERC20") {
                const val = parseEther(amountIn);
                hash = await walletClient.writeContract({
                    address: dexAddr, abi: REACTOR_DEX_ABI, functionName: "swapSttForToken",
                    args: [toToken.address as `0x${string}`], value: val,
                });
            } else if (fromToken.type === "ERC20" && toToken.type === "Native") {
                const val = parseUnits(amountIn, fromToken.decimals);
                // Approval
                setLoadingMsg(`Approving ${fromToken.symbol}...`);
                const appHash = await walletClient.writeContract({
                    address: fromToken.address as `0x${string}`, abi: MOCK_TOKEN_ABI,
                    functionName: "approve", args: [dexAddr, val],
                });
                await publicClient.waitForTransactionReceipt({ hash: appHash });
                // Swap
                setLoadingMsg(`Executing Swap...`);
                hash = await walletClient.writeContract({
                    address: dexAddr, abi: REACTOR_DEX_ABI, functionName: "swapTokenForStt",
                    args: [fromToken.address as `0x${string}`, val],
                });
            } else if (fromToken.type === "ERC20" && toToken.type === "ERC20") {
                const val = parseUnits(amountIn, fromToken.decimals);
                // Approval
                setLoadingMsg(`Approving ${fromToken.symbol}...`);
                const appHash = await walletClient.writeContract({
                    address: fromToken.address as `0x${string}`, abi: MOCK_TOKEN_ABI,
                    functionName: "approve", args: [dexAddr, val],
                });
                await publicClient.waitForTransactionReceipt({ hash: appHash });
                // Swap
                setLoadingMsg(`Executing Swap...`);
                hash = await walletClient.writeContract({
                    address: dexAddr, abi: REACTOR_DEX_ABI, functionName: "swapTokenForToken",
                    args: [fromToken.address as `0x${string}`, toToken.address as `0x${string}`, val],
                });
            }

            if (hash) {
                addToast(`Swap submitted! Finalizing...`, "info");
                await publicClient.waitForTransactionReceipt({ hash });
                addToast(`Successfully swapped to ${toToken.symbol}`, "success");
            }
            fetchBalances(); setAmountIn("");
        } catch (e: any) {
            console.error(e);
            addToast(e.shortMessage || "Swap failed. Check slippage/gas.", "error");
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
                        {TOKENS.filter(t => t.address && (t.address as any) !== "undefined").map((token) => (
                            <div key={token.symbol} className="onboarding-step" style={{ padding: '16px 20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 15, flex: 1 }}>
                                    <div style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.05)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                        <img src={token.icon} alt={token.symbol} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                    </div>
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
                                    disabled={!!loadingMsg || !isConnected}
                                    style={{ padding: "10px 18px", fontSize: 12, fontWeight: 700 }}
                                >
                                    {loadingMsg && loadingMsg.includes(token.symbol) ? "..." : "Claim"}
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
                                <div style={{ position: 'relative', width: 110 }}>
                                    <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 20, height: 20 }}>
                                        <img src={fromToken.icon} style={{ width: '100%' }} />
                                    </div>
                                    <select
                                        className="input-styled"
                                        value={fromToken.symbol}
                                        onChange={(e) => setFromToken(TOKENS.find(t => t.symbol === e.target.value)!)}
                                        style={{ width: '100%', fontSize: 14, fontWeight: 700, height: 48, paddingLeft: 35 }}
                                    >
                                        {TOKENS.filter(t => t.address && (t.address as any) !== "undefined").map(t => <option key={t.symbol} value={t.symbol}>{t.symbol}</option>)}
                                    </select>
                                </div>
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
                                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)" }}>RECEIVE (SIMULATED)</span>
                                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                                    Target: {toToken.symbol}
                                </span>
                            </div>
                            <div style={{ display: "flex", gap: 12, alignItems: 'center' }}>
                                <div style={{ position: 'relative', width: 110 }}>
                                    <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 20, height: 20 }}>
                                        <img src={toToken.icon} style={{ width: '100%' }} />
                                    </div>
                                    <select
                                        className="input-styled"
                                        value={toToken.symbol}
                                        onChange={(e) => setToToken(TOKENS.find(t => t.symbol === e.target.value)!)}
                                        style={{ width: '100%', fontSize: 14, fontWeight: 700, height: 48, paddingLeft: 35 }}
                                    >
                                        {TOKENS.filter(t => t.address && (t.address as any) !== "undefined").map(t => <option key={t.symbol} value={t.symbol}>{t.symbol}</option>)}
                                    </select>
                                </div>
                                <div style={{ flex: 1, fontSize: 24, fontWeight: 800, textAlign: 'right', color: amountOut ? "var(--text-primary)" : "var(--text-muted)" }}>
                                    {amountOut || "0.00"}
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        className="btn-purple"
                        onClick={handleSwap}
                        disabled={!!loadingMsg || !amountIn || fromToken.symbol === toToken.symbol || !isConnected}
                        style={{ width: "100%", marginTop: 24, padding: "20px", fontSize: 16, fontWeight: 800, borderRadius: 16 }}
                    >
                        {!isConnected ? "Connect Wallet" : loadingMsg ? <span><span className="spinner" /> {loadingMsg}</span> : "Swap Assets"}
                    </button>
                    {fromToken.symbol === toToken.symbol && (
                        <div style={{ color: "#f87171", fontSize: 11, marginTop: 12, textAlign: "center", fontWeight: 600 }}>Switch target token to swap</div>
                    )}
                </div>
            </div>
        </div>
    );
}
