const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

async function main() {
    console.log("🚀 ReactorX DEX & FAUCET Deployment Script");
    console.log("=============================================");

    const [deployer] = await ethers.getSigners();
    console.log("📬 Deployer:", deployer.address);

    // ============================================
    // 1. DEPLOY MOCK TOKENS (USDC, USDT, WETH)
    // ============================================
    console.log("\n📦 [1/2] Deploying Mock Tokens...");
    const MockToken = await ethers.getContractFactory("MockToken");

    const usdc = await MockToken.deploy("Reactor USDC", "USDC", 18);
    await usdc.waitForDeployment();
    const usdcAddress = await usdc.getAddress();
    console.log("✅ USDC deployed to:", usdcAddress);

    const usdt = await MockToken.deploy("Reactor USDT", "USDT", 18);
    await usdt.waitForDeployment();
    const usdtAddress = await usdt.getAddress();
    console.log("✅ USDT deployed to:", usdtAddress);

    const weth = await MockToken.deploy("Reactor Wrapped ETH", "WETH", 18);
    await weth.waitForDeployment();
    const wethAddress = await weth.getAddress();
    console.log("✅ WETH deployed to:", wethAddress);

    // ============================================
    // 2. DEPLOY REACTOR DEX
    // ============================================
    console.log("\n📦 [2/2] Deploying ReactorDex...");
    const ReactorDex = await ethers.getContractFactory("ReactorDex");
    const dex = await ReactorDex.deploy();
    await dex.waitForDeployment();
    const dexAddress = await dex.getAddress();
    console.log("✅ ReactorDex deployed to:", dexAddress);

    // ============================================
    // 3. CONFIGURE DEX ORACLES
    // ============================================
    console.log("\n🔗 Configuring DEX Prices and initial liquidity...");
    await dex.setSttPrice(ethers.parseEther("10000")); // $10,000 per STT
    await dex.setTokenPrice(usdcAddress, ethers.parseEther("1"));     // $1
    await dex.setTokenPrice(usdtAddress, ethers.parseEther("1"));     // $1
    await dex.setTokenPrice(wethAddress, ethers.parseEther("3500"));  // $3500

    // Provide some STT Native gas directly to DEX for swaps
    console.log("  Sending STT to DEX...");
    await deployer.sendTransaction({
        to: dexAddress,
        value: ethers.parseEther("0.1") // 0.1 STT for liquidity
    });

    // Send the tokens to Dex for Liquidity
    await usdc.mint(dexAddress, ethers.parseUnits("1000000", 18)); // 1M USDC
    await usdt.mint(dexAddress, ethers.parseUnits("1000000", 18)); // 1M USDT
    await weth.mint(dexAddress, ethers.parseUnits("500", 18));     // 500 WETH

    console.log("  ✅ Liquidity provided to AMM Router!");

    // Update frontend .env.local
    const envPath = path.join(__dirname, "../frontend/.env.local");
    const currentEnv = fs.readFileSync(envPath, 'utf8');

    const additions = `\n# DEX & FAUCET TOKENS
NEXT_PUBLIC_USDC_ADDRESS=${usdcAddress}
NEXT_PUBLIC_USDT_ADDRESS=${usdtAddress}
NEXT_PUBLIC_WETH_ADDRESS=${wethAddress}
NEXT_PUBLIC_DEX_ADDRESS=${dexAddress}
`;
    fs.writeFileSync(envPath, currentEnv + additions);
    console.log("\n📝 Saved contracts to frontend/.env.local!");
}

main().catch((err) => {
    console.error("❌ Deployment failed:", err);
    process.exitCode = 1;
});
