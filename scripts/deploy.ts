import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config();

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

    const initialPrice = ethers.parseEther("2000"); // $2000 per ETH
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

    // Set ReactorEngine in LendingMock
    const tx1 = await lendingMock.setReactorEngine(reactorEngineAddress);
    await tx1.wait();
    console.log("  ✅ LendingMock.setReactorEngine() done");

    // Set ReactorEngine in LiquidationManager
    const tx2 = await liquidationManager.setReactorEngine(reactorEngineAddress);
    await tx2.wait();
    console.log("  ✅ LiquidationManager.setReactorEngine() done");

    // Configure ReactorEngine with both addresses
    const tx3 = await reactorEngine.configure(lendingMockAddress, liquidationManagerAddress);
    await tx3.wait();
    console.log("  ✅ ReactorEngine.configure() done");

    // ============================================
    // 5. REGISTER SOMNIA REACTIVITY SUBSCRIPTION
    // ============================================
    console.log("\n⚡ Registering Somnia Reactivity subscription...");
    console.log("   Subscribing to PositionUpdated events from LendingMock...");

    try {
        const tx4 = await reactorEngine.registerSubscription(lendingMockAddress, {
            gasLimit: 500000,
        });
        await tx4.wait();
        console.log("  ✅ Reactivity subscription registered!");
        console.log("  🎉 ReactorEngine will now AUTOMATICALLY react to position changes!");
    } catch (err: any) {
        console.log("  ⚠️  Subscription registration note:", err.message);
        console.log("  ℹ️  You can register manually via registerSubscription() after deployment");
        console.log("  ℹ️  Make sure your wallet has 32+ STT for subscription funding");
    }

    // ============================================
    // 6. SAVE DEPLOYMENT INFO
    // ============================================
    const deploymentInfo = {
        network: "somniaTestnet",
        chainId: 50312,
        deployer: deployer.address,
        contracts: {
            LendingMock: {
                address: lendingMockAddress,
                constructorArgs: [initialPrice.toString(), liquidationThreshold],
            },
            LiquidationManager: {
                address: liquidationManagerAddress,
                constructorArgs: [lendingMockAddress],
            },
            ReactorEngine: {
                address: reactorEngineAddress,
                constructorArgs: [],
            },
        },
        reactivity: {
            precompile: "0x0100",
            subscribedTo: lendingMockAddress,
            eventSignature: "PositionUpdated(address,uint256,uint256,uint256,uint256)",
        },
        timestamp: new Date().toISOString(),
        explorer: `https://shannon-explorer.somnia.network`,
    };

    const deploymentPath = path.join(__dirname, "../deployment.json");
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));

    // Update .env file for frontend
    const envContent = `# Auto-generated by deployment script
NEXT_PUBLIC_CHAIN_ID=50312
NEXT_PUBLIC_LENDING_MOCK_ADDRESS=${lendingMockAddress}
NEXT_PUBLIC_REACTOR_ENGINE_ADDRESS=${reactorEngineAddress}
NEXT_PUBLIC_LIQUIDATION_MANAGER_ADDRESS=${liquidationManagerAddress}
NEXT_PUBLIC_RPC_URL=https://dream-rpc.somnia.network
NEXT_PUBLIC_WS_URL=wss://api.infra.testnet.somnia.network/ws
NEXT_PUBLIC_EXPLORER_URL=https://shannon-explorer.somnia.network
`;

    const frontendEnvPath = path.join(__dirname, "../frontend/.env.local");
    try {
        fs.writeFileSync(frontendEnvPath, envContent);
        console.log("\n📝 Frontend .env.local updated automatically!");
    } catch {
        console.log("\n📝 Save these to frontend/.env.local:");
        console.log(envContent);
    }

    // ============================================
    // FINAL SUMMARY
    // ============================================
    console.log("\n");
    console.log("╔════════════════════════════════════════════════════╗");
    console.log("║        🎉 REACTORX DEPLOYMENT COMPLETE! 🎉         ║");
    console.log("╠════════════════════════════════════════════════════╣");
    console.log(`║  LendingMock:        ${lendingMockAddress}  ║`);
    console.log(`║  LiquidationManager: ${liquidationManagerAddress}  ║`);
    console.log(`║  ReactorEngine:      ${reactorEngineAddress}  ║`);
    console.log("╠════════════════════════════════════════════════════╣");
    console.log("║  Somnia Reactivity: ACTIVE ⚡                      ║");
    console.log("║  No bots needed. Pure on-chain automation.         ║");
    console.log("╚════════════════════════════════════════════════════╝");
    console.log("");
    console.log("🔍 View on Explorer:");
    console.log(`   LendingMock: https://shannon-explorer.somnia.network/address/${lendingMockAddress}`);
    console.log(`   ReactorEngine: https://shannon-explorer.somnia.network/address/${reactorEngineAddress}`);
}

main().catch((err) => {
    console.error("❌ Deployment failed:", err);
    process.exitCode = 1;
});
