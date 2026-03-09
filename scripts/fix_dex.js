const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
    const dexAddr = "0x480f762abb94691D27BEDc35C1D8B25963e2F176";
    const usdcAddr = "0x0C5b6F23aD891F370aA226A517C6E84D6911FD45";
    const usdtAddr = "0x4B6a4A071101A3c9BCee7e8927d9A864893D60C0";
    const wethAddr = "0xecC3E982a11CE33FF5C5255B02A3096f90e39432";

    const [deployer] = await ethers.getSigners();
    const dex = await ethers.getContractAt("ReactorDex", dexAddr);

    console.log("Setting prices on existing DEX...");
    try {
        const tx1 = await dex.setSttPrice(ethers.parseEther("10000"));
        await tx1.wait();
        console.log("STT Price set to $10,000");

        const tx2 = await dex.setTokenPrice(usdcAddr, ethers.parseEther("1"));
        await tx2.wait();
        console.log("USDC Price set to $1");

        const tx3 = await dex.setTokenPrice(usdtAddr, ethers.parseEther("1"));
        await tx3.wait();
        console.log("USDT Price set to $1");

        const tx4 = await dex.setTokenPrice(wethAddr, ethers.parseEther("3500"));
        await tx4.wait();
        console.log("WETH Price set to $3500");
    } catch (e) {
        console.error("Failed to set prices (maybe not owner):", e.message);
    }
}

main().catch(console.error);
