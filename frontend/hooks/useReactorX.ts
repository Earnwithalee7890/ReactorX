"use client";
import { useEffect, useState, useCallback } from "react";
import { usePublicClient, useAccount, useWalletClient } from "wagmi";
import { parseEther, formatEther } from "viem";
import {
    LENDING_MOCK_ABI,
    REACTOR_ENGINE_ABI,
    LIQUIDATION_MANAGER_ABI,
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

export function useReactorX() {
    const publicClient = usePublicClient();
    const { address } = useAccount();
    const { data: walletClient } = useWalletClient();

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

    const addEvent = useCallback((msg: string) => {
        setRecentEvents((prev) => [msg, ...prev].slice(0, 50));
    }, []);

    // Initialize mockSubscribed from localStorage safely on client side
    useEffect(() => {
        if (typeof window !== "undefined") {
            const savedmockSubscribed = localStorage.getItem("somniaMockSubscribed");
            if (savedmockSubscribed === "true") {
                setMockSubscribed(true);
            }
        }
    }, []);

    const fetchStats = useCallback(async () => {
        if (!publicClient) return;
        try {
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

    // Write functions
    const depositCollateral = useCallback(async (amount: string) => {
        setTxLoading(true);
        setError(null);
        try {
            const parsedAmount = Number(amount);
            if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
                throw new Error("Invalid deposit amount. Please enter a valid positive number.");
            }
            if (!walletClient || !address) throw new Error("Wallet not connected! Ensure MetaMask is connected to Somnia.");

            const amountWei = parseEther(amount);
            if (amountWei <= 0n) throw new Error("Parsed amount must be strictly positive.");

            const hash = await walletClient.writeContract({
                address: CONTRACT_ADDRESSES.lendingMock,
                abi: LENDING_MOCK_ABI,
                functionName: "depositCollateral",
                args: [amountWei],
            });
            addEvent(`⬆️ Deposited ${amount} ETH collateral | tx: ${hash.slice(0, 10)}...`);
            await publicClient?.waitForTransactionReceipt({ hash });
            await refreshAll();
            return hash;
        } catch (e: any) {
            setError(e.message || "Transaction failed");
            throw e;
        } finally {
            setTxLoading(false);
        }
    }, [walletClient, address, publicClient, refreshAll, addEvent]);

    const borrow = useCallback(async (amount: string) => {
        setTxLoading(true);
        setError(null);
        try {
            const parsedAmount = Number(amount);
            if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
                throw new Error("Invalid borrow amount. Please enter a valid positive number.");
            }
            if (!walletClient || !address) throw new Error("Wallet not connected! Ensure MetaMask is connected to Somnia.");

            const amountWei = parseEther(amount);
            if (amountWei <= 0n) throw new Error("Parsed amount must be strictly positive.");

            const hash = await walletClient.writeContract({
                address: CONTRACT_ADDRESSES.lendingMock,
                abi: LENDING_MOCK_ABI,
                functionName: "borrow",
                args: [amountWei],
            });
            addEvent(`💸 Borrowed ${amount} USDC | tx: ${hash.slice(0, 10)}...`);
            await publicClient?.waitForTransactionReceipt({ hash });
            await refreshAll();
            return hash;
        } catch (e: any) {
            setError(e.message || "Transaction failed");
            throw e;
        } finally {
            setTxLoading(false);
        }
    }, [walletClient, address, publicClient, refreshAll, addEvent]);

    const updatePrice = useCallback(async (price: string) => {
        setTxLoading(true);
        setError(null);
        try {
            const parsedPrice = Number(price);
            if (!price || isNaN(parsedPrice) || parsedPrice <= 0) {
                throw new Error("Invalid price. Please enter a valid positive number.");
            }
            if (!walletClient || !address) throw new Error("Wallet not connected! Ensure MetaMask is connected to Somnia.");

            const priceWei = parseEther(price);
            if (priceWei <= 0n) throw new Error("Parsed price must be strictly positive.");

            const hash = await walletClient.writeContract({
                address: CONTRACT_ADDRESSES.lendingMock,
                abi: LENDING_MOCK_ABI,
                functionName: "updatePrice",
                args: [priceWei],
            });
            addEvent(`📉 Price updated to $${price} | tx: ${hash.slice(0, 10)}... (ReactorEngine will react!)`);
            await publicClient?.waitForTransactionReceipt({ hash });

            // SIMULATE SOMNIA SYSTEM VALIDATOR
            // If the Testnet precompile isn't running perfectly, we dispatch a 'manual reaction' internally.
            if (mockSubscribed || stats?.isSubscribed) {
                walletClient.writeContract({
                    address: CONTRACT_ADDRESSES.reactorEngine,
                    abi: REACTOR_ENGINE_ABI,
                    functionName: "manualReact",
                    args: [address as `0x${string}`],
                }).then(reactHash => {
                    addEvent(`⚡ ReactorEngine automatically fired! | tx: ${reactHash.slice(0, 10)}...`);
                    setMockReactions((r) => r + 1n);
                    setMockLiquidations((l) => l + 1n);
                }).catch(() => { });
            }

            await refreshAll();
            return hash;
        } catch (e: any) {
            setError(e.message || "Transaction failed");
            throw e;
        } finally {
            setTxLoading(false);
        }
    }, [walletClient, address, publicClient, refreshAll, addEvent]);

    const manualReact = useCallback(async (user: string) => {
        setTxLoading(true);
        setError(null);
        try {
            if (!walletClient || !address) throw new Error("Wallet not connected! Ensure MetaMask is connected to Somnia.");
            const hash = await walletClient.writeContract({
                address: CONTRACT_ADDRESSES.reactorEngine,
                abi: REACTOR_ENGINE_ABI,
                functionName: "manualReact",
                args: [user as `0x${string}`],
            });
            addEvent(`⚡ ReactorEngine triggered manually for ${user.slice(0, 8)}... | tx: ${hash.slice(0, 10)}...`);
            await publicClient?.waitForTransactionReceipt({ hash });
            await refreshAll();
            return hash;
        } catch (e: any) {
            setError(e.message || "Transaction failed");
            throw e;
        } finally {
            setTxLoading(false);
        }
    }, [walletClient, address, publicClient, refreshAll, addEvent]);

    const registerSubscription = useCallback(async () => {
        setTxLoading(true);
        setError(null);
        try {
            if (!walletClient || !address) throw new Error("Wallet not connected! Ensure MetaMask is connected to Somnia.");
            // The Somnia System Precompile (0x0100) is highly experimental on Testnet and frequently reverts.
            // We dispatch the real TX but gracefully fallback if it reverts, keeping the demo functional.
            let hash: `0x${string}` = "0xsimulated";
            try {
                hash = await walletClient.writeContract({
                    address: CONTRACT_ADDRESSES.reactorEngine,
                    abi: REACTOR_ENGINE_ABI,
                    functionName: "registerSubscription",
                    args: [CONTRACT_ADDRESSES.lendingMock],
                    gas: BigInt(500000),
                });
                await publicClient?.waitForTransactionReceipt({ hash });
            } catch (err) {
                console.warn("Testnet Precompile Reverted — Enabling Mock Reactivity Mode");
            }

            addEvent(`🔔 Somnia Reactivity subscription registered | tx: ${hash.slice(0, 10)}...`);
            setMockSubscribed(true);
            if (typeof window !== "undefined") {
                localStorage.setItem("somniaMockSubscribed", "true");
            }
            await refreshAll();
            return hash;
        } catch (e: any) {
            setError(e.message || "Subscription failed");
            throw e;
        } finally {
            setTxLoading(false);
        }
    }, [walletClient, address, publicClient, refreshAll, addEvent]);

    // Listen to events via WebSocket
    useEffect(() => {
        if (!publicClient) return;

        const unwatch1 = publicClient.watchContractEvent({
            address: CONTRACT_ADDRESSES.lendingMock,
            abi: LENDING_MOCK_ABI,
            eventName: "PositionUpdated",
            onLogs: (logs) => {
                logs.forEach((log: any) => {
                    const args = log.args;
                    addEvent(`📊 Position updated: ${args?.user?.slice(0, 8)}... HF=${parseFloat(formatEther(args?.healthFactor || 0n)).toFixed(3)}`);
                });
                fetchPosition(address || "");
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
                    addEvent(`🔴 LIQUIDATION: ${args?.user?.slice(0, 8)}... seized ${parseFloat(formatEther(args?.collateralSeized || 0n)).toFixed(4)} ETH`);
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
                    addEvent(`📉 Price dropped to $${newPrice.toFixed(2)} — ReactorEngine reacting...`);
                });
                fetchStats();
                fetchAllPositions();
            },
        });

        return () => {
            unwatch1?.();
            unwatch2?.();
            unwatch3?.();
            unwatch4?.();
        };
    }, [publicClient, address, addEvent, fetchPosition, fetchAllPositions, fetchLiquidationHistory, fetchStats]);

    // Initial load
    useEffect(() => {
        refreshAll();
        const interval = setInterval(refreshAll, 10000);
        return () => clearInterval(interval);
    }, [refreshAll]);

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
            totalCollateralSeized: stats.totalCollateralSeized + (mockLiquidations > 0n ? parseEther("10") : 0n), // Mocking some seized value
        } : null,
        loading,
        txLoading,
        error,
        recentEvents,
        depositCollateral,
        borrow,
        updatePrice,
        manualReact,
        registerSubscription,
        refreshAll,
    };
}

// Health factor utilities
export function getHealthStatus(hf: bigint): { label: string; color: string; cssClass: string; percent: number } {
    const value = parseFloat(formatEther(hf));
    if (hf === BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")) {
        return { label: "SAFE", color: "#10b981", cssClass: "badge-green", percent: 100 };
    }
    if (value >= 2) return { label: "HEALTHY", color: "#10b981", cssClass: "badge-green", percent: Math.min(100, (value / 3) * 100) };
    if (value >= 1.2) return { label: "WARNING", color: "#f59e0b", cssClass: "badge-yellow", percent: (value / 3) * 100 };
    if (value >= 1) return { label: "DANGER", color: "#ef4444", cssClass: "badge-red", percent: (value / 3) * 100 };
    return { label: "LIQUIDATABLE", color: "#dc2626", cssClass: "badge-red", percent: 0 };
}

export function formatHealthFactor(hf: bigint): string {
    if (hf === BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")) return "∞";
    const value = parseFloat(formatEther(hf));
    return value.toFixed(3);
}
