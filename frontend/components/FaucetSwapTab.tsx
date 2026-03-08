"use client";
import { useState, useEffect } from "react";
import { useAccount, useWalletClient, usePublicClient } from "wagmi";
import { parseEther, formatEther, parseUnits, formatUnits } from "viem";
import { CONTRACT_ADDRESSES, REACTOR_DEX_ABI, MOCK_TOKEN_ABI } from "@/lib/contracts";
import { useToast } from "./ToastProvider";

const TOKENS = [
    { symbol: "STT", address: "native", decimals: 18, type: "Native" },
    { symbol: "USDC", address: CONTRACT_ADDRESSES.usdc, decimals: 6, type: "ERC20" },
    { symbol: "USDT", address: CONTRACT_ADDRESSES.usdt, decimals: 6, type: "ERC20" },
    { symbol: "WETH", address: CONTRACT_ADDRESSES.weth, decimals: 18, type: "ERC20" },
];

export default function FaucetSwapTab() {
    const { address } = useAccount();
    const { data: walletClient } = useWalletClient();
    const publicClient = usePublicClient();
    const { showToast } = useToast();

    const [loadingMsg, setLoadingMsg] = useState<string | null>(null);
    const [balances, setBalances] = useState<Record<string, string>>({});

    // Swap state
    const [fromToken, setFromToken] = useState(TOKENS[0]);
    const [toToken, setToToken] = useState(TOKENS[1]);
    const [amountIn, setAmountIn] = useState("");

    // Read balances
    const fetchBalances = async () => {
        if (!address || !publicClient) return;
        const newBals: Record<string, string> = {};

        try {
            // STT Balance
            const sttBal = await publicClient.getBalance({ address });
            newBals["native"] = formatEther(sttBal);

            // ERC20 Balances
            for (const t of TOKENS.filter(t => t.type === "ERC20")) {
                const bal = await publicClient.readContract({
                    address: t.address as `0x${string}`,
                    abi: MOCK_TOKEN_ABI,
                    functionName: "balanceOf",
                    args: [address as `0x${string}`],
                });
                newBals[t.address] = formatUnits(bal as bigint, t.decimals);
            }
            setBalances(newBals);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchBalances();
    }, [address, publicClient]);

    // Faucet Mint
    const handleMint = async (tokenAddress: string, symbol: string) => {
        if (!walletClient || !publicClient) return;
        try {
            setLoadingMsg(`Minting ${symbol}...`);
            const hash = await walletClient.writeContract({
                address: tokenAddress as `0x${string}`,
                abi: MOCK_TOKEN_ABI,
                functionName: "faucet",
                args: [],
            });
            showToast({ title: "Minting...", message: `Waiting for confirmation`, type: "info" });
            await publicClient.waitForTransactionReceipt({ hash });
            showToast({ title: "Success!", message: `Claimed daily ${symbol}`, type: "success" });
            fetchBalances();
        } catch (e: any) {
            console.error(e);
            if (e.message.includes("wait 24h")) {
                showToast({ title: "Wait 24h", message: `You have already claimed ${symbol} today.`, type: "error" });
            } else {
                showToast({ title: "Error", message: e.shortMessage || "Transaction failed", type: "error" });
            }
        } finally {
            setLoadingMsg(null);
        }
    };

    // Swap
    const handleSwap = async () => {
        if (!walletClient || !publicClient || !amountIn) return;
        try {
            setLoadingMsg(`Swapping ${fromToken.symbol} to ${toToken.symbol}...`);

            // 1. STT -> ERC20
            if (fromToken.type === "Native" && toToken.type === "ERC20") {
                const val = parseEther(amountIn);
                const hash = await walletClient.writeContract({
                    address: CONTRACT_ADDRESSES.dex,
                    abi: REACTOR_DEX_ABI,
                    functionName: "swapSttForToken",
                    args: [toToken.address as `0x${string}`],
                    value: val,
                });
                await publicClient.waitForTransactionReceipt({ hash });
            }
            // 2. ERC20 -> STT
            else if (fromToken.type === "ERC20" && toToken.type === "Native") {
                const val = parseUnits(amountIn, fromToken.decimals);

                // Approve
                const approvalHash = await walletClient.writeContract({
                    address: fromToken.address as `0x${string}`,
                    abi: MOCK_TOKEN_ABI,
                    functionName: "approve",
                    args: [CONTRACT_ADDRESSES.dex, val],
                });
                setLoadingMsg(`Approving ${fromToken.symbol}...`);
                await publicClient.waitForTransactionReceipt({ hash: approvalHash });
                setLoadingMsg(`Executing Swap...`);

                const hash = await walletClient.writeContract({
                    address: CONTRACT_ADDRESSES.dex,
                    abi: REACTOR_DEX_ABI,
                    functionName: "swapTokenForStt",
                    args: [fromToken.address as `0x${string}`, val],
                });
                await publicClient.waitForTransactionReceipt({ hash });
            }
            // 3. ERC20 -> ERC20
            else if (fromToken.type === "ERC20" && toToken.type === "ERC20") {
                const val = parseUnits(amountIn, fromToken.decimals);
                // Approve
                const approvalHash = await walletClient.writeContract({
                    address: fromToken.address as `0x${string}`,
                    abi: MOCK_TOKEN_ABI,
                    functionName: "approve",
                    args: [CONTRACT_ADDRESSES.dex, val],
                });
                setLoadingMsg(`Approving ${fromToken.symbol}...`);
                await publicClient.waitForTransactionReceipt({ hash: approvalHash });
                setLoadingMsg(`Executing Swap...`);

                const hash = await walletClient.writeContract({
                    address: CONTRACT_ADDRESSES.dex,
                    abi: REACTOR_DEX_ABI,
                    functionName: "swapTokenForToken",
                    args: [fromToken.address as `0x${string}`, toToken.address as `0x${string}`, val],
                });
                await publicClient.waitForTransactionReceipt({ hash });
            }

            showToast({ title: "Swap Complete!", message: `Successfully swapped ${fromToken.symbol} to ${toToken.symbol}`, type: "success" });
            fetchBalances();
            setAmountIn("");
        } catch (e: any) {
            console.error(e);
            showToast({ title: "Swap Failed", message: e.shortMessage || "Unknown Error", type: "error" });
        } finally {
            setLoadingMsg(null);
        }
    };

    return (
        <div className="page-pad">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: 24, margin: "0 auto", maxWidth: 1000 }}>
                {/* ─── FAUCET PANEL ─── */}
                <div className="card" style={{ padding: 24 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>💧 Reactor Faucet</h2>
                    <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 24 }}>
                        Claim daily test tokens to use in the ReactorX ecosystem for borrowing and swapping.
                    </p>

                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        {TOKENS.filter(t => t.type === "ERC20").map((token) => (
                            <div key={token.symbol} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.02)", padding: 16, borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)" }}>
                                <div>
                                    <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>{token.symbol}</div>
                                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Bal: {balances[token.address] ? parseFloat(balances[token.address]).toFixed(2) : "0.00"}</div>
                                </div>
                                <button
                                    className="btn-primary"
                                    onClick={() => handleMint(token.address, token.symbol)}
                                    disabled={!!loadingMsg}
                                    style={{ padding: "8px 16px", fontSize: 13 }}
                                >
                                    Claim 100 {token.symbol}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ─── AMM SWAP PANEL ─── */}
                <div className="card" style={{ padding: 24 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>🔄 Reactor AMM Dex</h2>
                    <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 24 }}>
                        Powered by Somnia ReactorDex. Swap seamlessly.
                    </p>

                    <div style={{ display: "flex", flexDirection: "column", gap: 12, background: "rgba(0,0,0,0.2)", padding: 16, borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)" }}>
                        {/* FROM */}
                        <div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Pay</span>
                                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Bal: {balances[fromToken.address] ? parseFloat(balances[fromToken.address]).toFixed(4) : "0"}</span>
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                                <select
                                    value={fromToken.symbol}
                                    onChange={(e) => setFromToken(TOKENS.find(t => t.symbol === e.target.value)!)}
                                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", padding: 12, borderRadius: 8, flexShrink: 0, outline: "none" }}
                                >
                                    {TOKENS.map(t => <option key={t.symbol} value={t.symbol}>{t.symbol}</option>)}
                                </select>
                                <input
                                    type="number"
                                    placeholder="0.0"
                                    value={amountIn}
                                    onChange={(e) => setAmountIn(e.target.value)}
                                    style={{ flex: 1, background: "transparent", border: "none", color: "white", fontSize: 24, outline: "none", textAlign: "right" }}
                                />
                            </div>
                        </div>

                        {/* ARROW */}
                        <div style={{ display: "flex", justifyContent: "center", margin: "4px 0" }}>
                            <button
                                onClick={() => { const temp = fromToken; setFromToken(toToken); setToToken(temp); }}
                                style={{ background: "var(--bg-card)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "50%", padding: 8, cursor: "pointer", color: "var(--text-secondary)" }}
                            >
                                ↓
                            </button>
                        </div>

                        {/* TO */}
                        <div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Receive</span>
                                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Bal: {balances[toToken.address] ? parseFloat(balances[toToken.address]).toFixed(4) : "0"}</span>
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                                <select
                                    value={toToken.symbol}
                                    onChange={(e) => setToToken(TOKENS.find(t => t.symbol === e.target.value)!)}
                                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", padding: 12, borderRadius: 8, flexShrink: 0, outline: "none" }}
                                >
                                    {TOKENS.map(t => <option key={t.symbol} value={t.symbol}>{t.symbol}</option>)}
                                </select>
                                <input
                                    type="text"
                                    placeholder="Auto-calculated"
                                    disabled
                                    style={{ flex: 1, background: "transparent", border: "none", color: "white", fontSize: 24, outline: "none", textAlign: "right", opacity: 0.5 }}
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        className="btn-primary"
                        onClick={handleSwap}
                        disabled={!!loadingMsg || !amountIn || fromToken.symbol === toToken.symbol}
                        style={{ width: "100%", marginTop: 16, padding: "16px", fontSize: 16 }}
                    >
                        {loadingMsg ? <span><span className="spinner" style={{ marginRight: 8 }} />{loadingMsg}</span> : "Swap"}
                    </button>
                    {fromToken.symbol === toToken.symbol && (
                        <div style={{ color: "var(--error)", fontSize: 12, marginTop: 8, textAlign: "center" }}>Select different tokens</div>
                    )}
                </div>
            </div>
        </div>
    );
}
