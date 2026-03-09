const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
    const lendingMockAddress = "0xe64E4714b0ea6F8DA078797c1c34e44Be973731D";
    const usdcAddr = "0x7a9dcF9Bb88535C3Eba3bE8FAE4DDF0bF514c2eC";
    const usdtAddr = "0xE2E35A81135688A394eC0186Ed707A907D2Bf2e4";
    const wethAddr = "0xF5A764C94ae8Aa62b48AbE2eb66b060A2252C355";

    const lendingMock = await ethers.getContractAt("LendingMock", lendingMockAddress);

    console.log("🛠️ Setting up lending assets in LendingMock...");

    const tokens = [
        { name: "USDC", addr: usdcAddr, price: ethers.parseUnits("1", 18) },    // $1
        { name: "USDT", addr: usdtAddr, price: ethers.parseUnits("1", 18) },    // $1
        { name: "WETH", addr: wethAddr, price: ethers.parseUnits("3500", 18) }, // $3500
    ];

    for (const token of tokens) {
        console.log(`\n🔹 Configuring ${token.name}...`);
        const tx = await lendingMock.setSupportedToken(token.addr, true, token.price);
        await tx.wait();
        console.log(`  ✅ ${token.name} supported at $${ethers.formatEther(token.price)}`);

        // Seed liquidity to LendingMock so users can borrow
        const tokenContract = await ethers.getContractAt("MockToken", token.addr);
        const seedAmount = ethers.parseUnits("1000000", 18); // 1M tokens

        console.log(`  💧 Seeding 1,000,000 ${token.name} for borrow liquidity...`);
        const mintTx = await tokenContract.mint(lendingMockAddress, seedAmount);
        await mintTx.wait();
        console.log(`  ✅ ${token.name} liquidity seeded.`);
    }

    console.log("\n✨ LendingMock asset configuration complete!");
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
