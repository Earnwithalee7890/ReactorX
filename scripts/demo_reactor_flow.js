/**
 * ReactorX: Full End-to-End Demo Simulation
 * This script performs the "Happy Path" then "Panic Path" to show off Somnia Reactivity.
 * 1. Deposit native STT
 * 2. Borrow USDC
 * 3. Crash Price
 * 4. Automatic Liquidation
 */

const hre = require("hardhat");
const { ethers } = hre;

async function main() {
    console.log("🚀 Starting ReactorX End-to-End Simulation...");

    // Deployment addresses from .env.local or deployment.json
    const deployment = require("../deployment.json");

    const [owner] = await ethers.getSigners();
    console.log(`👤 Using Address: ${owner.address}`);

    const lending = await ethers.getContractAt("LendingMock", deployment.contracts.LendingMock.address);
    const engine = await ethers.getContractAt("ReactorEngine", deployment.contracts.ReactorEngine.address);
    const usdc = await ethers.getContractAt("MockToken", deployment.contracts.Tokens.USDC);

    const bal = await ethers.provider.getBalance(owner.address);
    console.log(`💰 Address Balance: ${ethers.formatEther(bal)} STT`);

    console.log("\n--- STEP 1: DEPOSIT COLLATERAL ---");
    const depositAmount = ethers.parseEther("0.1"); // Smaller deposit for testing
    console.log(`⏳ Depositing ${ethers.formatEther(depositAmount)} STT...`);
    const depTx = await lending.depositCollateral({
        value: depositAmount
    });
    await depTx.wait();
    console.log("✅ Deposit confirmed.");

    console.log("\n--- STEP 2: BORROW ASSET ---");
    const borrowAmount = ethers.parseEther("50"); // 50 USDC
    const usdcAddr = deployment.contracts.Tokens.USDC;
    console.log(`⏳ Borrowing ${ethers.formatEther(borrowAmount)} USDC from ${usdcAddr}...`);
    const borTx = await lending.borrow(usdcAddr, borrowAmount);
    await borTx.wait();
    console.log("✅ Borrow confirmed.");

    const pos = await lending.getPosition(owner.address);
    const hf = await lending.getHealthFactor(owner.address);
    console.log(`📊 Current Position: Collateral=${ethers.formatEther(pos[0])} Debt=${ethers.formatEther(pos[1])}`);
    console.log(`📉 Health Factor: ${ethers.formatEther(hf)}`);

    console.log("\n--- STEP 3: COLLATERAL PRICE CRASH ---");
    console.log("⚠️ Dropping STT price to $100.00 to trigger Reactivity...");
    const crashPrice = ethers.parseEther("100");
    const crashTx = await lending.updatePrice(crashPrice);
    await crashTx.wait();
    console.log("🔥 Price Updated! positionHolders loop triggered.");

    console.log("\n--- STEP 4: MONITORING REACTIVITY ---");
    console.log("⏳ Triggering Somnia ReactorEngine manual process (for demo speed)...");
    const procTx = await engine.manualReact(owner.address, { gasLimit: 2000000 });
    await procTx.wait();

    // Poll for liquidation
    for (let i = 0; i < 3; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const newPos = await lending.getPosition(owner.address);
        console.log(`... [t+${(i + 1) * 2}s] Active=${newPos[2]}`);

        if (!newPos[2]) {
            console.log("\n🚨 SUCCESS: SIMULATION COMPLETE! POSITION LIQUIDATED.");
            break;
        }
    }

    console.log("\n🏁 Simulation Component Complete.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
