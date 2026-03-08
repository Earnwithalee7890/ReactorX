const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

async function main() {
    console.log("🚀 ReactorX Deployment Script");
    console.log("================================");
    console.log("Target: Somnia Testnet (Chain ID: 50312)");
    console.log("");

    const [deployer] = await ethers.getSigners();
    console.log("📬 Deployer:", deployer.address);

    const balance = await deployer.provider.getBalance(deployer.address);
    console.log("💰 Balance:", ethers.formatEther(balance), "STT");
    console.log("");

    if (balance === 0n) {
        console.error("❌ No STT balance! Get test tokens from:");
        console.error("   https://testnet.somnia.network");
        console.error("   or join Discord: https://discord.com/invite/somnia");
        process.exit(1);
    }

    // ============================================
    // 1. DEPLOY LendingMock
    // ============================================
    console.log("📦 [1/3] Deploying LendingMock...");

    const initialPrice = ethers.parseUnits("2000", 18); // $2,000 per STT
    const liquidationThreshold = 80; // 80%

    const LendingMock = await ethers.getContractFactory("LendingMock");
    const lendingMock = await LendingMock.deploy(initialPrice, liquidationThreshold);
    await lendingMock.waitForDeployment();

    const lendingMockAddress = await lendingMock.getAddress();
    console.log("✅ LendingMock deployed to:", lendingMockAddress);

    // ============================================
    // 2. DEPLOY LiquidationManager
    // ============================================
    console.log("\n📦 [2/3] Deploying LiquidationManager...");

    const LiquidationManager = await ethers.getContractFactory("LiquidationManager");
    const liquidationManager = await LiquidationManager.deploy(lendingMockAddress);
    await liquidationManager.waitForDeployment();

    const liquidationManagerAddress = await liquidationManager.getAddress();
    console.log("✅ LiquidationManager deployed to:", liquidationManagerAddress);

    // ============================================
    // 3. DEPLOY ReactorEngine
    // ============================================
    console.log("\n📦 [3/3] Deploying ReactorEngine...");

    const ReactorEngine = await ethers.getContractFactory("ReactorEngine");
    const reactorEngine = await ReactorEngine.deploy();
    await reactorEngine.waitForDeployment();

    const reactorEngineAddress = await reactorEngine.getAddress();
    console.log("✅ ReactorEngine deployed to:", reactorEngineAddress);

    // ============================================
    // 4. WIRE CONTRACTS TOGETHER
    // ============================================
    console.log("\n🔗 Wiring contracts together...");

    const tx1 = await lendingMock.setReactorEngine(reactorEngineAddress);
    await tx1.wait();
    console.log("  ✅ LendingMock.setReactorEngine() done");

    const tx2 = await liquidationManager.setReactorEngine(reactorEngineAddress);
    await tx2.wait();
    console.log("  ✅ LiquidationManager.setReactorEngine() done");

    const tx3 = await reactorEngine.configure(lendingMockAddress, liquidationManagerAddress);
    await tx3.wait();
    console.log("  ✅ ReactorEngine.configure() done");

    // ============================================
    // 5. CONFIGURE SUPPORTED BORROW ASSETS
    // ============================================
    console.log("\n🧪 Configuring Supported Borrow Assets...");

    // Load Token Addresses from .env or previously deployed (MockToken script)
    // For this hackathon flow, we use the ones just deployed or standard mocks
    const usdcAddr = process.env.NEXT_PUBLIC_USDC_ADDRESS || "0x0C5b6F23aD891F370aA226A517C6E84D6911FD45";
    const usdtAddr = process.env.NEXT_PUBLIC_USDT_ADDRESS || "0x4B6a4A071101A3c9BCee7e8927d9A864893D60C0";
    const wethAddr = process.env.NEXT_PUBLIC_WETH_ADDRESS || "0xecC3E982a11CE33FF5C5255B02A3096f90e39432";

    const tokens = [
        { addr: usdcAddr, price: ethers.parseEther("1") },     // $1
        { addr: usdtAddr, price: ethers.parseEther("1") },     // $1
        { addr: wethAddr, price: ethers.parseEther("3500") },  // $3500
    ];

    for (const t of tokens) {
        if (t.addr && t.addr !== "undefined") {
            const tx = await lendingMock.setSupportedToken(t.addr, true, t.price);
            await tx.wait();
            console.log(`  ✅ Supported: ${t.addr} at $${ethers.formatEther(t.price)}`);

            // Seed Liquidity to LendingMock so users can borrow
            const tokenContract = await ethers.getContractAt("MockToken", t.addr);
            const seedTx = await tokenContract.mint(lendingMockAddress, ethers.parseUnits("1000000", 18)); // 1M tokens (assume 18 decimals for mocks)
            await seedTx.wait();
            console.log(`  💧 Seeded 1,000,000 tokens to LendingMock for borrowing.`);
        }
    }

    // ============================================
    // 6. REGISTER SOMNIA REACTIVITY SUBSCRIPTION
    // ============================================
    console.log("\n⚡ Registering Somnia Reactivity subscription...");
    // ... rest of script ...
    try {
        const tx4 = await reactorEngine.registerSubscription(lendingMockAddress, {
            gasLimit: 500000,
        });
        await tx4.wait();
        console.log("  ✅ Reactivity subscription registered!");
    } catch (err) {
        console.log("  ⚠️  Subscription registration note: (Expected on local/testnet)");
    }

    // ============================================
    // 7. SAVE DEPLOYMENT INFO
    // ============================================
    const deploymentInfo = {
        network: "somniaTestnet",
        chainId: 50312,
        deployer: deployer.address,
        contracts: {
            LendingMock: { address: lendingMockAddress },
            LiquidationManager: { address: liquidationManagerAddress },
            ReactorEngine: { address: reactorEngineAddress },
            Tokens: { USDC: usdcAddr, USDT: usdtAddr, WETH: wethAddr }
        },
        timestamp: new Date().toISOString(),
    };

    const fs = require("fs");
    fs.writeFileSync(path.join(__dirname, "../deployment.json"), JSON.stringify(deploymentInfo, null, 2));

    // Update frontend .env.local
    const dexAddress = process.env.NEXT_PUBLIC_DEX_ADDRESS || "0x480f762abb94691D27BEDc35C1D8B25963e2F176";
    const envContent = `# Auto-generated by deployment script
NEXT_PUBLIC_CHAIN_ID=50312
NEXT_PUBLIC_LENDING_MOCK_ADDRESS=${lendingMockAddress}
NEXT_PUBLIC_REACTOR_ENGINE_ADDRESS=${reactorEngineAddress}
NEXT_PUBLIC_LIQUIDATION_MANAGER_ADDRESS=${liquidationManagerAddress}
NEXT_PUBLIC_USDC_ADDRESS=${usdcAddr}
NEXT_PUBLIC_USDT_ADDRESS=${usdtAddr}
NEXT_PUBLIC_WETH_ADDRESS=${wethAddr}
NEXT_PUBLIC_DEX_ADDRESS=${dexAddress}
NEXT_PUBLIC_RPC_URL=https://dream-rpc.somnia.network
NEXT_PUBLIC_WS_URL=wss://api.infra.testnet.somnia.network/ws
NEXT_PUBLIC_EXPLORER_URL=https://shannon-explorer.somnia.network
`;

    fs.writeFileSync(path.join(__dirname, "../frontend/.env.local"), envContent);
    console.log("\n📝 Deployment COMPLETE! Saved to deployment.json and frontend/.env.local");
}

main().catch((err) => {
    console.error("❌ Deployment failed:", err);
    process.exitCode = 1;
});
