"use client";
import { useState, useEffect } from "react";
import { useAccount, useWalletClient, usePublicClient } from "wagmi";
import { parseEther, formatEther, parseUnits, formatUnits } from "viem";
import { CONTRACT_ADDRESSES, REACTOR_DEX_ABI, MOCK_TOKEN_ABI } from "@/lib/contracts";
import { useToast } from "./ToastProvider";

const TOKENS = [
    {
        symbol: "STT", address: "native", decimals: 18, type: "Native",
        icon: "https://somnia.network/favicon.ico", color: "#fbbf24",
        desc: "Native gas token"
    },
    {
        symbol: "USDC", address: CONTRACT_ADDRESSES.usdc || "0x7a9dcF9Bb88535C3Eba3bE8FAE4DDF0bF514c2eC", decimals: 18, type: "ERC20",
        icon: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png",
        color: "#2775ca", desc: "USD Coin (Mock)"
    },
    {
        symbol: "USDT", address: CONTRACT_ADDRESSES.usdt || "0xE2E35A81135688A394eC0186Ed707A907D2Bf2e4", decimals: 18, type: "ERC20",
        icon: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png",
        color: "#26a17b", desc: "Tether USD (Mock)"
    },
    {
        symbol: "WETH", address: CONTRACT_ADDRESSES.weth || "0xF5A764C94ae8Aa62b48AbE2eb66b060A2252C355", decimals: 18, type: "ERC20",
        icon: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png",
        color: "#627eea", desc: "Wrapped Ether (Mock)"
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
            const dexAddr = CONTRACT_ADDRESSES.dex || "0xE213403699406bA58f2f16F94b94BB83a4490024";
            if (!dexAddr || dexAddr === "0x0000000000000000000000000000000000000000") {
                throw new Error("DEX Address not found.");
            }

            let hash;
            if (fromToken.type === "Native" && toToken.type === "ERC20") {
                const val = parseEther(amountIn);
                hash = await walletClient.writeContract({
                    address: dexAddr, abi: REACTOR_DEX_ABI, functionName: "swapSttForToken",
                    args: [toToken.address as `0x${string}`], value: val,
                });
            } else if (fromToken.type === "ERC20" && toToken.type === "Native") {
                const val = parseUnits(amountIn, fromToken.decimals);
                setLoadingMsg(`Approving ${fromToken.symbol}...`);
                const appHash = await walletClient.writeContract({
                    address: fromToken.address as `0x${string}`, abi: MOCK_TOKEN_ABI,
                    functionName: "approve", args: [dexAddr, val],
                });
                await publicClient.waitForTransactionReceipt({ hash: appHash });
                setLoadingMsg(`Executing Swap...`);
                hash = await walletClient.writeContract({
                    address: dexAddr, abi: REACTOR_DEX_ABI, functionName: "swapTokenForStt",
                    args: [fromToken.address as `0x${string}`, val],
                });
            } else if (fromToken.type === "ERC20" && toToken.type === "ERC20") {
                const val = parseUnits(amountIn, fromToken.decimals);
                setLoadingMsg(`Approving ${fromToken.symbol}...`);
                const appHash = await walletClient.writeContract({
                    address: fromToken.address as `0x${string}`, abi: MOCK_TOKEN_ABI,
                    functionName: "approve", args: [dexAddr, val],
                });
                await publicClient.waitForTransactionReceipt({ hash: appHash });
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
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 28 }}>
                {/* ─── DAILY REWARDS PANEL ─── */}
                <div style={{
                    borderRadius: 24, overflow: "hidden",
                    background: "linear-gradient(135deg, rgba(2,6,23,0.95), rgba(15,23,42,0.8))",
                    border: "1px solid rgba(251,191,36,0.1)",
                    boxShadow: "0 8px 40px rgba(0,0,0,0.3)"
                }}>
                    {/* Header */}
                    <div style={{
                        padding: "24px 28px", borderBottom: "1px solid rgba(251,191,36,0.08)",
                        background: "linear-gradient(135deg, rgba(251,191,36,0.06), transparent)"
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{
                                width: 40, height: 40, borderRadius: 12,
                                background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)",
                                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20
                            }}>🎁</div>
                            <div>
                                <h2 style={{ fontSize: 18, fontWeight: 900, color: "#fff", margin: 0 }}>Daily Rewards</h2>
                                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>
                                    Claim 1,000 mock tokens every 24h
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Token List */}
                    <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
                        {TOKENS.filter(t => t.address && (t.address as any) !== "undefined").map((token) => (
                            <div key={token.symbol} style={{
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                padding: "16px 18px", borderRadius: 16,
                                background: "rgba(255,255,255,0.02)",
                                border: "1px solid rgba(255,255,255,0.06)",
                                transition: "all 0.2s"
                            }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                                    <div style={{
                                        width: 44, height: 44, borderRadius: "50%",
                                        overflow: "hidden", background: "rgba(255,255,255,0.05)",
                                        border: `2px solid ${token.color}30`,
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        flexShrink: 0
                                    }}>
                                        <img src={token.icon} alt={token.symbol} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>{token.symbol}</div>
                                        <div style={{
                                            fontSize: 12, color: "rgba(255,255,255,0.4)",
                                            fontFamily: "'JetBrains Mono', monospace"
                                        }}>
                                            {balances[token.address]
                                                ? parseFloat(balances[token.address]).toLocaleString(undefined, { maximumFractionDigits: 2 })
                                                : "0.00"}
                                        </div>
                                    </div>
                                </div>

                                {token.type === "Native" ? (
                                    <a
                                        href="https://testnet.somnia.network"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            padding: "10px 20px", borderRadius: 12,
                                            background: `${token.color}15`,
                                            border: `1px solid ${token.color}30`,
                                            color: token.color, fontSize: 12, fontWeight: 800,
                                            textDecoration: "none", cursor: "pointer",
                                            letterSpacing: "0.04em",
                                            transition: "all 0.2s"
                                        }}
                                    >
                                        Get STT ↗
                                    </a>
                                ) : (
                                    <button
                                        onClick={() => handleMint(token.address, token.symbol)}
                                        disabled={!!loadingMsg || !isConnected}
                                        style={{
                                            padding: "10px 22px", borderRadius: 12,
                                            background: loadingMsg?.includes(token.symbol)
                                                ? "rgba(255,255,255,0.05)"
                                                : `linear-gradient(135deg, ${token.color}20, ${token.color}10)`,
                                            border: `1px solid ${token.color}40`,
                                            color: token.color, fontSize: 12, fontWeight: 800,
                                            cursor: (!!loadingMsg || !isConnected) ? "not-allowed" : "pointer",
                                            opacity: (!!loadingMsg && !loadingMsg.includes(token.symbol)) ? 0.5 : 1,
                                            letterSpacing: "0.04em",
                                            transition: "all 0.2s",
                                            fontFamily: "'Space Grotesk', sans-serif"
                                        }}
                                    >
                                        {loadingMsg?.includes(token.symbol) ? (
                                            <span className="spinner" style={{ width: 14, height: 14 }} />
                                        ) : (
                                            `Claim 1K`
                                        )}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* ─── AMM SWAP PANEL ─── */}
                <div style={{
                    borderRadius: 24, overflow: "hidden",
                    background: "linear-gradient(135deg, rgba(2,6,23,0.95), rgba(15,23,42,0.8))",
                    border: "1px solid rgba(139,92,246,0.12)",
                    boxShadow: "0 8px 40px rgba(0,0,0,0.3)",
                    display: "flex", flexDirection: "column"
                }}>
                    {/* Header */}
                    <div style={{
                        padding: "24px 28px", borderBottom: "1px solid rgba(139,92,246,0.08)",
                        background: "linear-gradient(135deg, rgba(139,92,246,0.06), transparent)"
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{
                                width: 40, height: 40, borderRadius: 12,
                                background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)",
                                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20
                            }}>🔄</div>
                            <div>
                                <h2 style={{ fontSize: 18, fontWeight: 900, color: "#fff", margin: 0 }}>Reactor AMM</h2>
                                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>
                                    Fixed-price oracle swap
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Swap Interface */}
                    <div style={{ padding: "20px 24px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <div style={{
                            background: "rgba(0,0,0,0.3)", borderRadius: 18,
                            border: "1px solid rgba(255,255,255,0.06)", padding: 20,
                            display: "flex", flexDirection: "column", gap: 4,
                            overflow: "visible"
                        }}>
                            {/* FROM */}
                            <div>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em" }}>PAY</span>
                                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                                        Bal: {balances[fromToken.address] ? parseFloat(balances[fromToken.address]).toFixed(4) : "0"}
                                    </span>
                                </div>
                                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                    <div style={{
                                        display: "flex", alignItems: "center", gap: 8,
                                        background: "rgba(255,255,255,0.05)", borderRadius: 12,
                                        padding: "8px 12px", border: "1px solid rgba(255,255,255,0.08)",
                                        flexShrink: 0
                                    }}>
                                        <img src={fromToken.icon} alt="" style={{ width: 22, height: 22, borderRadius: "50%" }} />
                                        <select
                                            value={fromToken.symbol}
                                            onChange={(e) => setFromToken(TOKENS.find(t => t.symbol === e.target.value)!)}
                                            style={{
                                                background: "transparent", border: "none", color: "#fff",
                                                fontSize: 14, fontWeight: 700, cursor: "pointer", outline: "none",
                                                fontFamily: "'Space Grotesk', sans-serif", width: 60
                                            }}
                                        >
                                            {TOKENS.filter(t => t.address && (t.address as any) !== "undefined").map(t =>
                                                <option key={t.symbol} value={t.symbol} style={{ background: "#0f172a" }}>{t.symbol}</option>
                                            )}
                                        </select>
                                    </div>
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        value={amountIn}
                                        onChange={(e) => setAmountIn(e.target.value)}
                                        style={{
                                            flex: 1, minWidth: 0, width: "100%",
                                            background: "transparent", border: "none",
                                            color: "#fff", fontSize: 20, fontWeight: 800,
                                            textAlign: "right", outline: "none",
                                            fontFamily: "'JetBrains Mono', monospace",
                                            padding: "4px 4px 4px 0"
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Swap Direction */}
                            <div style={{ display: "flex", justifyContent: "center", margin: "4px 0" }}>
                                <button
                                    onClick={() => { const t = fromToken; setFromToken(toToken); setToToken(t); }}
                                    style={{
                                        width: 36, height: 36, borderRadius: 10,
                                        background: "rgba(139,92,246,0.1)",
                                        border: "1px solid rgba(139,92,246,0.3)",
                                        cursor: "pointer", color: "#a78bfa",
                                        fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
                                        transition: "all 0.2s"
                                    }}
                                >↕</button>
                            </div>

                            {/* TO */}
                            <div>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em" }}>RECEIVE</span>
                                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                                        Target: {toToken.symbol}
                                    </span>
                                </div>
                                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                    <div style={{
                                        display: "flex", alignItems: "center", gap: 8,
                                        background: "rgba(255,255,255,0.05)", borderRadius: 12,
                                        padding: "8px 12px", border: "1px solid rgba(255,255,255,0.08)",
                                        flexShrink: 0
                                    }}>
                                        <img src={toToken.icon} alt="" style={{ width: 22, height: 22, borderRadius: "50%" }} />
                                        <select
                                            value={toToken.symbol}
                                            onChange={(e) => setToToken(TOKENS.find(t => t.symbol === e.target.value)!)}
                                            style={{
                                                background: "transparent", border: "none", color: "#fff",
                                                fontSize: 14, fontWeight: 700, cursor: "pointer", outline: "none",
                                                fontFamily: "'Space Grotesk', sans-serif", width: 60
                                            }}
                                        >
                                            {TOKENS.filter(t => t.address && (t.address as any) !== "undefined").map(t =>
                                                <option key={t.symbol} value={t.symbol} style={{ background: "#0f172a" }}>{t.symbol}</option>
                                            )}
                                        </select>
                                    </div>
                                    <div style={{
                                        flex: 1, minWidth: 0, fontSize: 22, fontWeight: 800, textAlign: "right",
                                        color: amountOut && amountOut !== "Error" ? "#fff" : "rgba(255,255,255,0.2)",
                                        fontFamily: "'JetBrains Mono', monospace",
                                        overflow: "hidden", textOverflow: "ellipsis"
                                    }}>
                                        {amountOut || "0.00"}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Swap Button */}
                        <button
                            onClick={handleSwap}
                            disabled={!!loadingMsg || !amountIn || fromToken.symbol === toToken.symbol || !isConnected}
                            style={{
                                width: "100%", marginTop: 20, padding: "18px", fontSize: 15,
                                fontWeight: 800, borderRadius: 14, border: "none",
                                cursor: (!!loadingMsg || !amountIn || fromToken.symbol === toToken.symbol || !isConnected) ? "not-allowed" : "pointer",
                                background: "linear-gradient(135deg, var(--reactor-purple), #6d28d9)",
                                color: "#fff",
                                boxShadow: "0 4px 20px rgba(139,92,246,0.3)",
                                opacity: (!!loadingMsg || !amountIn || !isConnected) ? 0.5 : 1,
                                fontFamily: "'Space Grotesk', sans-serif",
                                transition: "all 0.3s ease"
                            }}
                        >
                            {!isConnected ? "Connect Wallet" : loadingMsg ? (
                                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                                    <span className="spinner" style={{ width: 16, height: 16 }} /> {loadingMsg}
                                </span>
                            ) : "Swap Assets"}
                        </button>
                        {fromToken.symbol === toToken.symbol && (
                            <div style={{ color: "#f87171", fontSize: 11, marginTop: 10, textAlign: "center", fontWeight: 600 }}>
                                Select different tokens to swap
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
