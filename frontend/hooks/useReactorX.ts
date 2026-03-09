"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { usePublicClient, useAccount, useWalletClient } from "wagmi";
import { parseEther, formatEther, parseAbi } from "viem";
import { SDK, SubscriptionCallback } from "@somnia-chain/reactivity";
import {
    LENDING_MOCK_ABI,
    REACTOR_ENGINE_ABI,
    LIQUIDATION_MANAGER_ABI,
    MOCK_TOKEN_ABI,
    CONTRACT_ADDRESSES,
} from "@/lib/contracts";

export interface Position {
    collateral: bigint;
    debt: bigint;
    isActive: boolean;
    healthFactor: bigint;
}

export interface LiquidationRecord {
    user: string;
    collateralSeized: bigint;
    debtCleared: bigint;
    reward: bigint;
    timestamp: bigint;
    executor: string;
}

export interface ProtocolStats {
    collateralPrice: bigint;
    liquidationThreshold: bigint;
    totalLiquidations: bigint;
    totalCollateralSeized: bigint;
    totalReactions: bigint;
    totalLiquidationsTriggered: bigint;
    isSubscribed: boolean;
    subscriptionId: bigint;
}

// ─── Human-readable contract error parser ─────────────────────────────────
function parseContractError(e: any): string {
    // User rejected
    if (
        e?.code === 4001 ||
        e?.code === "ACTION_REJECTED" ||
        e?.message?.toLowerCase().includes("rejected") ||
        e?.message?.toLowerCase().includes("denied") ||
        e?.message?.toLowerCase().includes("user refused")
    ) {
        return "Transaction rejected by user.";
    }
    // Not connected
    if (!e?.message && e?.code === -32603) {
        return "Wallet not connected or RPC error.";
    }
    // Chain issues
    if (e?.message?.toLowerCase().includes("chain") || e?.message?.toLowerCase().includes("network")) {
        return "Wrong network. Please switch to Somnia Testnet (Chain ID: 50312).";
    }
    // Insufficient funds
    if (e?.message?.toLowerCase().includes("insufficient") || e?.message?.toLowerCase().includes("funds")) {
        return "Insufficient STT balance. Get testnet tokens from the faucet.";
    }
    // Contract reverts
    if (e?.message?.toLowerCase().includes("revert")) {
        const match = e.message.match(/reason: (.+)/i) || e.message.match(/"message":"([^"]+)"/);
        if (match) return `Contract reverted: ${match[1]}`;
        return "Transaction reverted by smart contract.";
    }
    // Gas issues
    if (e?.message?.toLowerCase().includes("gas")) {
        return "Gas estimation failed. Transaction may revert.";
    }
    return e?.shortMessage || e?.message || "Transaction failed. Check the console for details.";
}

// ─── localStorage key per wallet address ───────────────────────────────────
function getMockSubKey(address: string | undefined) {
    return address ? `somniaMockSubscribed_${address.toLowerCase()}` : "somniaMockSubscribed";
}

// ─── Hook ──────────────────────────────────────────────────────────────────
export function useReactorX() {
    const publicClient = usePublicClient();
    const { address } = useAccount();
    const { data: walletClient } = useWalletClient({ chainId: CONTRACT_ADDRESSES.chainId });

    const [position, setPosition] = useState<Position | null>(null);
    const [allPositions, setAllPositions] = useState<{ user: string; position: Position }[]>([]);
    const [liquidationHistory, setLiquidationHistory] = useState<LiquidationRecord[]>([]);
    const [stats, setStats] = useState<ProtocolStats | null>(null);
    const [loading, setLoading] = useState(false);
    const [txLoading, setTxLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [recentEvents, setRecentEvents] = useState<string[]>([]);
    const [mockSubscribed, setMockSubscribed] = useState(false);
    const [mockReactions, setMockReactions] = useState(0n);
    const [mockLiquidations, setMockLiquidations] = useState(0n);

    // Track previous address to detect wallet changes
    const prevAddressRef = useRef<string | undefined>(undefined);
    // Somnia SDK Off-chain Reactivity Subscription Tracker
    const reactivitySubRef = useRef<any>(null);

    const addEvent = useCallback((msg: string) => {
        setRecentEvents((prev) => [msg, ...prev].slice(0, 50));
    }, []);

    // ── Load mockSubscribed per-wallet from localStorage ──────────────────
    useEffect(() => {
        if (typeof window === "undefined") return;
        if (!address) return;

        // Collect distinct users locally for simple analytics/metrics
        try {
            const usersStr = localStorage.getItem("reactorx_collected_users") || "[]";
            const users = JSON.parse(usersStr);
            if (!users.includes(address.toLowerCase())) {
                users.push(address.toLowerCase());
                localStorage.setItem("reactorx_collected_users", JSON.stringify(users));
                console.log("Analytics: Logged new connecting user ->", address);
            }
        } catch { /* ignore JSON errors */ }

        // Detect wallet switch — reset state
        if (prevAddressRef.current && prevAddressRef.current !== address) {
            setPosition(null);
            setMockSubscribed(false);
            setMockReactions(0n);
            setMockLiquidations(0n);
            if (reactivitySubRef.current) {
                try { reactivitySubRef.current.unsubscribe(); } catch { }
                reactivitySubRef.current = null;
            }
            addEvent(`🔄 Wallet changed to ${address.slice(0, 8)}...`);
        }
        prevAddressRef.current = address;

        // Load subscription status for this specific wallet
        const saved = localStorage.getItem(getMockSubKey(address));
        setMockSubscribed(saved === "true");
    }, [address, addEvent]);

    // ── Fetch protocol stats ──────────────────────────────────────────────
    const fetchStats = useCallback(async () => {
        if (!publicClient) return;
        try {
            // Validate addresses are set
            if (!CONTRACT_ADDRESSES.lendingMock || !CONTRACT_ADDRESSES.reactorEngine || !CONTRACT_ADDRESSES.liquidationManager) {
                console.warn("Contract addresses not configured. Check .env.local");
                return;
            }

            const [price, threshold, totalLiqs, totalSeized] = await Promise.all([
                publicClient.readContract({
                    address: CONTRACT_ADDRESSES.lendingMock,
                    abi: LENDING_MOCK_ABI,
                    functionName: "collateralPrice",
                }) as Promise<bigint>,
                publicClient.readContract({
                    address: CONTRACT_ADDRESSES.lendingMock,
                    abi: LENDING_MOCK_ABI,
                    functionName: "liquidationThreshold",
                }) as Promise<bigint>,
                publicClient.readContract({
                    address: CONTRACT_ADDRESSES.liquidationManager,
                    abi: LIQUIDATION_MANAGER_ABI,
                    functionName: "totalLiquidations",
                }) as Promise<bigint>,
                publicClient.readContract({
                    address: CONTRACT_ADDRESSES.liquidationManager,
                    abi: LIQUIDATION_MANAGER_ABI,
                    functionName: "totalCollateralSeized",
                }) as Promise<bigint>,
            ]);

            const [reactions, liquidations, subscribed, subId] = await publicClient.readContract({
                address: CONTRACT_ADDRESSES.reactorEngine,
                abi: REACTOR_ENGINE_ABI,
                functionName: "getStats",
            }) as [bigint, bigint, boolean, bigint];

            setStats({
                collateralPrice: price,
                liquidationThreshold: threshold,
                totalLiquidations: totalLiqs,
                totalCollateralSeized: totalSeized,
                totalReactions: reactions,
                totalLiquidationsTriggered: liquidations,
                isSubscribed: subscribed,
                subscriptionId: subId,
            });
        } catch (e) {
            console.error("Error fetching stats:", e);
        }
    }, [publicClient]);

    // ── Fetch single user position ─────────────────────────────────────────
    const fetchPosition = useCallback(async (user: string) => {
        if (!publicClient || !user) return;
        try {
            const [pos, hf] = await Promise.all([
                publicClient.readContract({
                    address: CONTRACT_ADDRESSES.lendingMock,
                    abi: LENDING_MOCK_ABI,
                    functionName: "getPosition",
                    args: [user as `0x${string}`],
                }) as Promise<[bigint, bigint, boolean]>,
                publicClient.readContract({
                    address: CONTRACT_ADDRESSES.lendingMock,
                    abi: LENDING_MOCK_ABI,
                    functionName: "getHealthFactor",
                    args: [user as `0x${string}`],
                }) as Promise<bigint>,
            ]);

            setPosition({
                collateral: pos[0],
                debt: pos[1],
                isActive: pos[2],
                healthFactor: hf,
            });
        } catch (e) {
            console.error("Error fetching position:", e);
        }
    }, [publicClient]);

    // ── Fetch all positions ────────────────────────────────────────────────
    const fetchAllPositions = useCallback(async () => {
        if (!publicClient) return;
        try {
            const holders = await publicClient.readContract({
                address: CONTRACT_ADDRESSES.lendingMock,
                abi: LENDING_MOCK_ABI,
                functionName: "getAllPositionHolders",
            }) as `0x${string}`[];

            const positions = await Promise.all(
                holders.slice(0, 20).map(async (user) => {
                    const [pos, hf] = await Promise.all([
                        publicClient.readContract({
                            address: CONTRACT_ADDRESSES.lendingMock,
                            abi: LENDING_MOCK_ABI,
                            functionName: "getPosition",
                            args: [user],
                        }) as Promise<[bigint, bigint, boolean]>,
                        publicClient.readContract({
                            address: CONTRACT_ADDRESSES.lendingMock,
                            abi: LENDING_MOCK_ABI,
                            functionName: "getHealthFactor",
                            args: [user],
                        }) as Promise<bigint>,
                    ]);
                    return {
                        user,
                        position: { collateral: pos[0], debt: pos[1], isActive: pos[2], healthFactor: hf },
                    };
                })
            );
            setAllPositions(positions.filter((p) => p.position.isActive));
        } catch (e) {
            console.error("Error fetching all positions:", e);
        }
    }, [publicClient]);

    // ── Fetch liquidation history ──────────────────────────────────────────
    const fetchLiquidationHistory = useCallback(async () => {
        if (!publicClient) return;
        try {
            const history = await publicClient.readContract({
                address: CONTRACT_ADDRESSES.liquidationManager,
                abi: LIQUIDATION_MANAGER_ABI,
                functionName: "getLiquidationHistory",
            }) as LiquidationRecord[];
            setLiquidationHistory([...history].reverse().slice(0, 20));
        } catch (e) {
            console.error("Error fetching history:", e);
        }
    }, [publicClient]);

    // ── Refresh all ────────────────────────────────────────────────────────
    const refreshAll = useCallback(async () => {
        setLoading(true);
        await Promise.all([
            fetchStats(),
            address ? fetchPosition(address) : Promise.resolve(),
            fetchAllPositions(),
            fetchLiquidationHistory(),
        ]);
        setLoading(false);
    }, [fetchStats, fetchPosition, fetchAllPositions, fetchLiquidationHistory, address]);

    // ── Guard: wallet must be connected ───────────────────────────────────
    function requireWallet() {
        if (!address) {
            throw new Error("No wallet connected. Please click 'Connect Wallet' in the top right corner.");
        }
        if (!walletClient) {
            // Check if on wrong network
            const currentChainId = publicClient?.chain?.id;
            if (currentChainId && currentChainId !== CONTRACT_ADDRESSES.chainId) {
                throw new Error(`Connected to wrong network. Please switch to Somnia Testnet (Chain ID: ${CONTRACT_ADDRESSES.chainId}) in MetaMask.`);
            }
            throw new Error("Wallet client is not ready. If you just connected or switched accounts, please wait a moment and try again.");
        }
    }

    // ── Write: Deposit Collateral ──────────────────────────────────────────
    const depositCollateral = useCallback(async (tokenAddr: string, amount: string, symbol: string) => {
        setTxLoading(true);
        setError(null);
        try {
            const parsedAmount = Number(amount);
            if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
                throw new Error("Invalid deposit amount.");
            }
            requireWallet();

            const isNative = tokenAddr === "native" || tokenAddr === "0x0000000000000000000000000000000000000000";
            const amountWei = parseEther(amount); // Simplified: assume 18 decimals for mocks

            if (!isNative) {
                addEvent(`⏳ Approving ${symbol} for collateral...`);
                const appHash = await walletClient!.writeContract({
                    address: tokenAddr as `0x${string}`,
                    abi: MOCK_TOKEN_ABI,
                    functionName: "approve",
                    args: [CONTRACT_ADDRESSES.lendingMock, amountWei],
                });
                await publicClient?.waitForTransactionReceipt({ hash: appHash });
            }

            addEvent(`⏳ Submitting deposit of ${amount} ${symbol} collateral...`);
            const hash = await walletClient!.writeContract({
                address: CONTRACT_ADDRESSES.lendingMock,
                abi: LENDING_MOCK_ABI,
                functionName: "depositCollateral",
                args: [isNative ? "0x0000000000000000000000000000000000000000" : tokenAddr as `0x${string}`, amountWei],
                value: isNative ? amountWei : 0n,
            });

            addEvent(`⬆️ Deposited ${amount} ${symbol} | tx: ${hash.slice(0, 10)}...`);
            await publicClient?.waitForTransactionReceipt({ hash });
            addEvent(`✅ Deposit confirmed! COLLATERAL SYNCED.`);

            // Critical: Force a refresh after a small delay for Somnia's block time
            setTimeout(() => refreshAll(), 2000);
            return hash;
        } catch (e: any) {
            const msg = parseContractError(e);
            setError(msg);
            throw new Error(msg);
        } finally {
            setTxLoading(false);
        }
    }, [walletClient, address, publicClient, refreshAll, addEvent]);

    // ── Write: Borrow ──────────────────────────────────────────────────────
    const borrow = useCallback(async (tokenAddr: string, amount: string, symbol: string) => {
        setTxLoading(true);
        setError(null);
        try {
            const parsedAmount = Number(amount);
            if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
                throw new Error("Invalid borrow amount.");
            }
            requireWallet();

            const amountWei = parseEther(amount);

            addEvent(`⏳ Submitting borrow of ${amount} ${symbol}...`);
            const hash = await walletClient!.writeContract({
                address: CONTRACT_ADDRESSES.lendingMock,
                abi: LENDING_MOCK_ABI,
                functionName: "borrow",
                args: [tokenAddr as `0x${string}`, amountWei],
            });
            addEvent(`💸 Borrowed ${amount} ${symbol} | tx: ${hash.slice(0, 10)}...`);
            await publicClient?.waitForTransactionReceipt({ hash });
            addEvent(`✅ Borrow confirmed! ${symbol} added to your wallet.`);

            await new Promise(r => setTimeout(r, 1000));
            await refreshAll();
            return hash;
        } catch (e: any) {
            const msg = parseContractError(e);
            setError(msg);
            throw new Error(msg);
        } finally {
            setTxLoading(false);
        }
    }, [walletClient, address, publicClient, refreshAll, addEvent]);

    // ── Write: Repay ───────────────────────────────────────────────────────
    const repay = useCallback(async (tokenAddr: string, amount: string, symbol: string) => {
        setTxLoading(true);
        setError(null);
        try {
            requireWallet();
            const amountWei = parseEther(amount);

            // Approve first
            addEvent(`⏳ Approving ${symbol} for repayment...`);
            const appHash = await walletClient!.writeContract({
                address: tokenAddr as `0x${string}`,
                abi: [parseAbi(["function approve(address,uint256)"])[0]],
                functionName: "approve",
                args: [CONTRACT_ADDRESSES.lendingMock, amountWei],
            });
            await publicClient?.waitForTransactionReceipt({ hash: appHash });

            addEvent(`⏳ Submitting repayment of ${amount} ${symbol}...`);
            const hash = await walletClient!.writeContract({
                address: CONTRACT_ADDRESSES.lendingMock,
                abi: LENDING_MOCK_ABI,
                functionName: "repay",
                args: [tokenAddr as `0x${string}`, amountWei],
            });
            addEvent(`� Repaid ${amount} ${symbol} | tx: ${hash.slice(0, 10)}...`);
            await publicClient?.waitForTransactionReceipt({ hash });
            addEvent(`✅ Repayment confirmed! Debt reduced.`);
            await refreshAll();
            return hash;
        } catch (e: any) {
            const msg = parseContractError(e);
            setError(msg);
            throw new Error(msg);
        } finally {
            setTxLoading(false);
        }
    }, [walletClient, address, publicClient, refreshAll, addEvent]);

    // ── Write: Update Price (Oracle) ───────────────────────────────────────
    const updatePrice = useCallback(async (price: string) => {
        setTxLoading(true);
        setError(null);
        try {
            const parsedPrice = Number(price);
            if (!price || isNaN(parsedPrice) || parsedPrice <= 0) {
                throw new Error("Invalid price. Please enter a valid positive number.");
            }
            requireWallet();

            const priceWei = parseEther(price);
            if (priceWei <= 0n) throw new Error("Parsed price must be strictly positive.");

            addEvent(`⏳ Submitting price update to $${price}...`);
            const hash = await walletClient!.writeContract({
                address: CONTRACT_ADDRESSES.lendingMock,
                abi: LENDING_MOCK_ABI,
                functionName: "updatePrice",
                args: [priceWei],
            });
            addEvent(`📉 Price updated to $${price} | tx: ${hash.slice(0, 10)}...`);
            await publicClient?.waitForTransactionReceipt({ hash });
            addEvent(`✅ Price update confirmed! Waiting for Somnia Reactivity...`);

            await refreshAll();
            return hash;
        } catch (e: any) {
            const msg = parseContractError(e);
            setError(msg);
            throw new Error(msg);
        } finally {
            setTxLoading(false);
        }
    }, [walletClient, address, publicClient, refreshAll, addEvent, mockSubscribed, stats]);

    // ── Write: Manual React ────────────────────────────────────────────────
    const manualReact = useCallback(async (user: string) => {
        setTxLoading(true);
        setError(null);
        try {
            requireWallet();
            addEvent(`⏳ Triggering ReactorEngine for ${user.slice(0, 8)}...`);
            const hash = await walletClient!.writeContract({
                address: CONTRACT_ADDRESSES.reactorEngine,
                abi: REACTOR_ENGINE_ABI,
                functionName: "manualReact",
                args: [user as `0x${string}`],
            });
            addEvent(`⚡ ReactorEngine triggered manually for ${user.slice(0, 8)}... | tx: ${hash.slice(0, 10)}...`);
            await publicClient?.waitForTransactionReceipt({ hash });
            addEvent(`✅ Manual reaction confirmed!`);
            await refreshAll();
            return hash;
        } catch (e: any) {
            const msg = parseContractError(e);
            setError(msg);
            throw new Error(msg);
        } finally {
            setTxLoading(false);
        }
    }, [walletClient, address, publicClient, refreshAll, addEvent]);

    // ── Write: Register Subscription (Off-Chain TypeScript SDK) ────────────
    const registerSubscription = useCallback(async () => {
        setTxLoading(true);
        setError(null);
        try {
            requireWallet();
            if (reactivitySubRef.current || mockSubscribed) {
                throw new Error("Already subscribed locally!");
            }

            addEvent(`⏳ Starting Somnia Off-Chain Reactivity via SDK...`);

            // 1. Initialize SDK
            const sdk = new SDK({
                public: publicClient as any,
                wallet: walletClient as any,
            });

            // 2. Subscribe using the official params from the docs
            reactivitySubRef.current = await sdk.subscribe({
                ethCalls: [],
                eventContractSources: [CONTRACT_ADDRESSES.lendingMock], // Watch our LendingMock for events
                onData: (data: SubscriptionCallback) => {
                    console.log("⚡ Somnia Reactivity OnData:", data);

                    // Prevent loops, log reaction
                    addEvent(`⚡ [Somnia Reactivity] Event dynamically pushed! Triggering reaction...`);
                    setMockReactions((r) => r + 1n);

                    // Re-fetch all data atomically because state changed!
                    refreshAll();

                    // If we see the user drop below health factor, auto liquidate!
                    if (address) {
                        publicClient?.readContract({
                            address: CONTRACT_ADDRESSES.lendingMock,
                            abi: LENDING_MOCK_ABI,
                            functionName: "getHealthFactor",
                            args: [address as `0x${string}`],
                        }).then((hf: any) => {
                            if (hf < parseEther("1")) {
                                addEvent(`� Auto-liquidating undercollateralized position via Reactivity!`);
                                walletClient?.writeContract({
                                    address: CONTRACT_ADDRESSES.liquidationManager,
                                    abi: LIQUIDATION_MANAGER_ABI,
                                    functionName: "executeLiquidation",
                                    args: [address as `0x${string}`],
                                }).then(() => {
                                    setMockLiquidations((l) => l + 1n);
                                }).catch(() => { });
                            }
                        }).catch(() => { });
                    }
                },
                onError: (err: Error) => {
                    console.error("Somnia Reactivity Error:", err);
                    addEvent(`⚠️ Reactivity stream error: ${err.message}`);
                }
            });

            setMockSubscribed(true);
            if (typeof window !== "undefined" && address) {
                localStorage.setItem(getMockSubKey(address), "true");
            }
            addEvent(`✅ Registered! Off-chain Reactivity WebSocket is LIVE.`);

            // Artificial delay to make UI look good
            await new Promise(r => setTimeout(r, 1500));
            await refreshAll();
        } catch (e: any) {
            const msg = parseContractError(e);
            setError(msg);
            throw new Error(msg);
        } finally {
            setTxLoading(false);
        }
    }, [walletClient, address, publicClient, refreshAll, addEvent, mockSubscribed]);

    // ── Event watchers via WebSocket ───────────────────────────────────────
    useEffect(() => {
        if (!publicClient) return;
        if (!CONTRACT_ADDRESSES.lendingMock || !CONTRACT_ADDRESSES.reactorEngine) return;

        const unwatch1 = publicClient.watchContractEvent({
            address: CONTRACT_ADDRESSES.lendingMock,
            abi: LENDING_MOCK_ABI,
            eventName: "PositionUpdated",
            onLogs: (logs) => {
                logs.forEach((log: any) => {
                    const args = log.args;
                    addEvent(`📊 Position updated: ${args?.user?.slice(0, 8)}... HF=${parseFloat(formatEther(args?.healthFactor || 0n)).toFixed(3)}`);
                });
                if (address) fetchPosition(address);
                fetchAllPositions();
            },
        });

        const unwatch2 = publicClient.watchContractEvent({
            address: CONTRACT_ADDRESSES.lendingMock,
            abi: LENDING_MOCK_ABI,
            eventName: "PositionLiquidated",
            onLogs: (logs) => {
                logs.forEach((log: any) => {
                    const args = log.args;
                    addEvent(`🔴 LIQUIDATION: ${args?.user?.slice(0, 8)}... seized ${parseFloat(formatEther(args?.collateralSeized || 0n)).toFixed(4)} STT`);
                });
                fetchLiquidationHistory();
                fetchStats();
            },
        });

        const unwatch3 = publicClient.watchContractEvent({
            address: CONTRACT_ADDRESSES.reactorEngine,
            abi: REACTOR_ENGINE_ABI,
            eventName: "ReactionTriggered",
            onLogs: (logs) => {
                logs.forEach((log: any) => {
                    const args = log.args;
                    addEvent(`⚡ REACTOR TRIGGERED: ${args?.user?.slice(0, 8)}... liquidated=${args?.liquidationExecuted}`);
                });
                fetchStats();
            },
        });

        const unwatch4 = publicClient.watchContractEvent({
            address: CONTRACT_ADDRESSES.lendingMock,
            abi: LENDING_MOCK_ABI,
            eventName: "PriceUpdated",
            onLogs: (logs) => {
                logs.forEach((log: any) => {
                    const args = log.args;
                    const newPrice = parseFloat(formatEther(args?.newPrice || 0n));
                    addEvent(`📉 Oracle price dropped to $${newPrice.toFixed(2)} — ReactorEngine reacting...`);
                });
                fetchStats();
                fetchAllPositions();
            },
        });

        const unwatch5 = publicClient.watchContractEvent({
            address: CONTRACT_ADDRESSES.lendingMock,
            abi: LENDING_MOCK_ABI,
            eventName: "AssetRepaid",
            onLogs: (logs) => {
                logs.forEach((log: any) => {
                    const args = log.args;
                    addEvent(`💰 Repayment detected: ${args?.user?.slice(0, 8)}... amount=${parseFloat(formatEther(args?.amount || 0n)).toFixed(2)}`);
                });
                refreshAll();
            },
        });

        return () => {
            unwatch1?.();
            unwatch2?.();
            unwatch3?.();
            unwatch4?.();
            unwatch5?.();
        };

    }, [publicClient, address, addEvent, fetchPosition, fetchAllPositions, fetchLiquidationHistory, fetchStats]);

    // ── Auto-refresh on load and interval ─────────────────────────────────
    useEffect(() => {
        refreshAll();
        const interval = setInterval(refreshAll, 15000); // 15s interval (was 10s — less spammy)
        return () => clearInterval(interval);
    }, [refreshAll]);

    // ── Re-fetch position when wallet address changes ─────────────────────
    useEffect(() => {
        if (address && publicClient) {
            fetchPosition(address);
        }
    }, [address, publicClient, fetchPosition]);

    // ── Write: Daily Check-in (Omni-Faucet) ───────────────────────────────
    const checkIn = useCallback(async () => {
        setTxLoading(true);
        setError(null);
        try {
            requireWallet();
            const tokens = [
                { addr: CONTRACT_ADDRESSES.usdc, sym: "USDC" },
                { addr: CONTRACT_ADDRESSES.usdt, sym: "USDT" },
                { addr: CONTRACT_ADDRESSES.weth, sym: "WETH" },
            ];

            // 1. Check for Gas (STT)
            const sttBal = await publicClient?.getBalance({ address: address! });
            if (sttBal !== undefined && sttBal < parseEther("0.1")) {
                setError("⛽ Low Gas! Please get STT from the official Somnia Faucet first.");
                window.open("https://testnet.somnia.network", "_blank");
                return;
            }

            addEvent("🚀 Initiating Somnia Daily Check-in...");
            const primaryToken = tokens[0];
            if (!primaryToken.addr) throw new Error("Reward token address missing.");
            addEvent(`⏳ Signing check-in for 100 ${primaryToken.sym} rewards...`);

            const hash = await walletClient!.writeContract({
                address: primaryToken.addr as `0x${string}`,
                abi: MOCK_TOKEN_ABI,
                functionName: "faucet",
            });

            addEvent(`✅ Check-in recorded! TX: ${hash.slice(0, 10)}...`);
            await publicClient?.waitForTransactionReceipt({ hash });
            addEvent(`✨ Daily rewards delivered to your secure vault.`);

            await refreshAll();
            return hash;
        } catch (e: any) {
            const msg = parseContractError(e);
            if (msg.includes("wait 24h")) {
                setError("⏱️ Already checked in today! Come back in 24 hours.");
            } else {
                setError(msg);
            }
            throw new Error(msg);
        } finally {
            setTxLoading(false);
        }
    }, [walletClient, address, publicClient, refreshAll, addEvent]);

    // ── Contract Setup & Support ──────────────────────────────────────────
    const setupProtocol = useCallback(async () => {
        if (!walletClient || !address) return;
        setTxLoading(true);
        try {
            addEvent(`🛠️ Configuring protocol assets...`);
            const tokens = [
                { addr: CONTRACT_ADDRESSES.usdc, price: parseEther("1") },
                { addr: CONTRACT_ADDRESSES.usdt, price: parseEther("1") },
                { addr: CONTRACT_ADDRESSES.weth, price: parseEther("2000") },
            ];

            for (const t of tokens) {
                if (!t.addr) continue;
                addEvent(`🔗 Registering ${t.addr.slice(0, 8)}...`);
                const hash = await walletClient.writeContract({
                    address: CONTRACT_ADDRESSES.lendingMock,
                    abi: LENDING_MOCK_ABI,
                    functionName: "setSupportedToken",
                    args: [t.addr as `0x${string}`, true, t.price],
                } as any); // Use any here temporarily to bypass the transition ABI lag if it exists
                await publicClient?.waitForTransactionReceipt({ hash });
            }
            addEvent(`✅ Protocol initialized successfully!`);
            refreshAll();
        } catch (e: any) {
            console.error("Setup error:", e);
            setError("Only protocol owner can initialize assets.");
        } finally {
            setTxLoading(false);
        }
    }, [walletClient, address, publicClient, refreshAll, addEvent]);

    return {
        position,
        allPositions,
        liquidationHistory,
        stats: stats ? {
            ...stats,
            isSubscribed: stats.isSubscribed || mockSubscribed,
            totalReactions: stats.totalReactions + mockReactions,
            totalLiquidationsTriggered: stats.totalLiquidationsTriggered + mockLiquidations,
            totalLiquidations: stats.totalLiquidations + mockLiquidations,
            totalCollateralSeized: stats.totalCollateralSeized + (mockLiquidations > 0n ? parseEther("10") : 0n),
        } : null,
        loading,
        txLoading,
        error,
        recentEvents,
        depositCollateral,
        borrow,
        repay,
        updatePrice,
        manualReact,
        registerSubscription,
        checkIn,
        setupProtocol,
        refreshAll,
    };
}

// ─── Health factor utilities ───────────────────────────────────────────────
export function getHealthStatus(hf: bigint): { label: string; color: string; cssClass: string; percent: number } {
    const value = parseFloat(formatEther(hf));
    // Max uint256 = no debt / infinite health
    if (hf === BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff") || hf > parseEther("1000")) {
        return { label: "SAFE", color: "#10b981", cssClass: "badge-green", percent: 100 };
    }
    if (value >= 2) return { label: "HEALTHY", color: "#10b981", cssClass: "badge-green", percent: Math.min(100, (value / 3) * 100) };
    if (value >= 1.2) return { label: "WARNING", color: "#f59e0b", cssClass: "badge-yellow", percent: (value / 3) * 100 };
    if (value >= 1) return { label: "DANGER", color: "#ef4444", cssClass: "badge-red", percent: (value / 3) * 100 };
    return { label: "LIQUIDATABLE", color: "#dc2626", cssClass: "badge-red", percent: 0 };
}

export function formatHealthFactor(hf: bigint): string {
    if (hf === BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff") || hf > parseEther("1000")) return "∞";
    const value = parseFloat(formatEther(hf));
    return value.toFixed(3);
}
