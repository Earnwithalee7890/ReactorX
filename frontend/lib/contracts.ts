import { parseAbi } from "viem";

// Contract ABIs for ReactorX
export const LENDING_MOCK_ABI = parseAbi([
    // Events
    "event PositionUpdated(address indexed user, uint256 totalCollateralUsd, uint256 debt, uint256 healthFactor, uint256 timestamp)",
    "event PriceUpdated(uint256 oldPrice, uint256 newPrice, uint256 timestamp)",
    "event PositionLiquidated(address indexed user, uint256 collateralSeizedUsd, uint256 debtCleared, uint256 timestamp)",
    "event CollateralDeposited(address indexed user, address indexed token, uint256 amount, uint256 timestamp)",
    "event AssetBorrowed(address indexed user, address indexed token, uint256 amount, uint256 timestamp)",
    "event AssetRepaid(address indexed user, address indexed token, uint256 amount, uint256 timestamp)",
    // View functions
    "function getHealthFactor(address user) view returns (uint256)",
    "function getPosition(address user) view returns (uint256 totalCollateralUsd, uint256 debt, bool isActive)",
    "function isLiquidatable(address user) view returns (bool)",
    "function collateralPrice() view returns (uint256)",
    "function liquidationThreshold() view returns (uint256)",
    "function getAllPositionHolders() view returns (address[])",
    "function reactorEngine() view returns (address)",
    "function getCollateralBalance(address user, address token) view returns (uint256)",
    // Write functions
    "function depositCollateral(address token, uint256 amount) payable",
    "function borrow(address token, uint256 amount)",
    "function repay(address token, uint256 amount)",
    "function updatePrice(uint256 newPrice)",
    "function setReactorEngine(address engine)",
    "function setSupportedToken(address token, bool status, uint256 price)",
]);

export const REACTOR_ENGINE_ABI = parseAbi([
    // Events
    "event ReactionTriggered(address indexed user, uint256 healthFactor, bool liquidationExecuted, uint256 timestamp)",
    "event SubscriptionCreated(uint64 subscriptionId, string eventType)",
    // View functions
    "function totalReactions() view returns (uint256)",
    "function totalLiquidationsTriggered() view returns (uint256)",
    "function isSubscribed() view returns (bool)",
    "function positionSubscriptionId() view returns (uint64)",
    "function getStats() view returns (uint256 reactions, uint256 liquidations, bool subscribed, uint64 subId)",
    "function POSITION_UPDATED_TOPIC() view returns (bytes32)",
    "function SOMNIA_REACTIVITY_PRECOMPILE() view returns (address)",
    "function owner() view returns (address)",
    // Write
    "function registerSubscription(address lendingMockAddress)",
    "function removeSubscription()",
    "function manualReact(address user)",
    "function handleReactiveEvent(address emitter, bytes32[] calldata eventTopics, bytes calldata data)",
    "function configure(address lendingMock, address liquidationManager)",
]);

export const LIQUIDATION_MANAGER_ABI = parseAbi([
    // Events
    "event Liquidated(address indexed user, uint256 collateralSeized, uint256 debtCleared, uint256 reward, address indexed executor, uint256 timestamp)",
    // View
    "function totalLiquidations() view returns (uint256)",
    "function totalCollateralSeized() view returns (uint256)",
    "function getLiquidationCount() view returns (uint256)",
    "struct LiquidationRecord { address user; uint256 collateralSeized; uint256 debtCleared; uint256 reward; uint256 timestamp; address executor; }",
    "function getLiquidationHistory() view returns (LiquidationRecord[])",
    "function getLatestLiquidation() view returns (LiquidationRecord)",
    "function isPositionLiquidatable(address user) view returns (bool)",
    "function LIQUIDATION_REWARD_BPS() view returns (uint256)",
    "function rewardsEarned(address) view returns (uint256)",
    // Write
    "function executeLiquidation(address user) returns (bool)",
    "function setReactorEngine(address engine)",
]);

export const MOCK_TOKEN_ABI = parseAbi([
    "function faucet() external",
    "function mint(address to, uint256 amount) external",
    "function balanceOf(address account) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
]);

export const REACTOR_DEX_ABI = parseAbi([
    "function swapSttForToken(address tokenOut) external payable",
    "function swapTokenForStt(address tokenIn, uint256 amountIn) external",
    "function swapTokenForToken(address tokenIn, address tokenOut, uint256 amountIn) external",
    "function tokenPrices(address token) view returns (uint256)",
    "function sttPrice() view returns (uint256)",
]);

export const CONTRACT_ADDRESSES = {
    lendingMock: (process.env.NEXT_PUBLIC_LENDING_MOCK_ADDRESS || "0xe64E4714b0ea6F8DA078797c1c34e44Be973731D") as `0x${string}`,
    reactorEngine: (process.env.NEXT_PUBLIC_REACTOR_ENGINE_ADDRESS || "0x7cD235cBf72E161483E6Ebe4168c76e6911D6a45") as `0x${string}`,
    liquidationManager: (process.env.NEXT_PUBLIC_LIQUIDATION_MANAGER_ADDRESS || "0x185909a9158D08B523ea1d9FCBD34DFF439eBe98") as `0x${string}`,
    dex: (process.env.NEXT_PUBLIC_DEX_ADDRESS || "0xE213403699406bA58f2f16F94b94BB83a4490024") as `0x${string}`,
    usdc: (process.env.NEXT_PUBLIC_USDC_ADDRESS || "0x7a9dcF9Bb88535C3Eba3bE8FAE4DDF0bF514c2eC") as `0x${string}`,
    usdt: (process.env.NEXT_PUBLIC_USDT_ADDRESS || "0xE2E35A81135688A394eC0186Ed707A907D2Bf2e4") as `0x${string}`,
    weth: (process.env.NEXT_PUBLIC_WETH_ADDRESS || "0xF5A764C94ae8Aa62b48AbE2eb66b060A2252C355") as `0x${string}`,
};

export const SOMNIA_TESTNET = {
    id: 50312,
    name: "Somnia Testnet",
    network: "somnia-testnet",
    nativeCurrency: { name: "Somnia Test Token", symbol: "STT", decimals: 18 },
    rpcUrls: {
        default: {
            http: ["https://dream-rpc.somnia.network"],
            webSocket: ["wss://api.infra.testnet.somnia.network/ws"],
        },
        public: {
            http: ["https://dream-rpc.somnia.network"],
            webSocket: ["wss://api.infra.testnet.somnia.network/ws"],
        },
    },
    blockExplorers: {
        default: { name: "Somnia Explorer", url: "https://shannon-explorer.somnia.network" },
    },
} as const;
