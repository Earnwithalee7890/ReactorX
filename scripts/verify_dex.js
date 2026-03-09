const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
    const dexAddr = "0x480f762abb94691D27BEDc35C1D8B25963e2F176";
    const usdcAddr = "0x0C5b6F23aD891F370aA226A517C6E84D6911FD45";
    const usdtAddr = "0x4B6a4A071101A3c9BCee7e8927d9A864893D60C0";
    const wethAddr = "0xecC3E982a11CE33FF5C5255B02A3096f90e39432";

    const [deployer] = await ethers.getSigners();
    const dex = await ethers.getContractAt("ReactorDex", dexAddr);

    const sttPrice = await dex.sttPrice();
    console.log("STT Price from DEX:", ethers.formatUnits(sttPrice, 18));

    const usdcPrice = await dex.tokenPrices(usdcAddr);
    console.log("USDC Price from DEX:", ethers.formatUnits(usdcPrice, 18));

    const usdtPrice = await dex.tokenPrices(usdtAddr);
    console.log("USDT Price from DEX:", ethers.formatUnits(usdtPrice, 18));

    const usdc = await ethers.getContractAt("MockToken", usdcAddr);
    const usdcDec = await usdc.decimals();
    console.log("USDC Decimals:", usdcDec);

    const usdt = await ethers.getContractAt("MockToken", usdtAddr);
    const usdtDec = await usdt.decimals();
    console.log("USDT Decimals:", usdtDec);
}

main().catch(console.error);
