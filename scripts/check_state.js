const hre = require("hardhat");
const { ethers } = hre;

async function main() {
    const deployment = require("../deployment.json");
    const [owner] = await ethers.getSigners();
    const lending = await ethers.getContractAt("LendingMock", deployment.contracts.LendingMock.address);

    console.log("Reading LendingMock State...");
    try {
        const ownerState = await lending.owner();
        console.log(`Owner: ${ownerState}`);
        const price = await lending.collateralPrice();
        console.log(`Collateral Price: ${ethers.formatEther(price)}`);
        const threshold = await lending.liquidationThreshold();
        console.log(`Liquidation Threshold: ${threshold}%`);
        const reactor = await lending.reactorEngine();
        console.log(`Reactor Engine: ${reactor}`);
        const usdcSupported = await lending.supportedTokens(deployment.contracts.Tokens.USDC);
        console.log(`USDC Supported: ${usdcSupported}`);
        const usdcPrice = await lending.tokenPrice(deployment.contracts.Tokens.USDC);
        console.log(`USDC Price: ${ethers.formatEther(usdcPrice)}`);
        const usdc = await ethers.getContractAt("MockToken", deployment.contracts.Tokens.USDC);
        const usdcBal = await usdc.balanceOf(deployment.contracts.LendingMock.address);
        console.log(`USDC Liquidity in LendingMock: ${ethers.formatEther(usdcBal)}`);
        const pos = await lending.getPosition(owner.address);
        console.log(`Position: Collateral=${ethers.formatEther(pos[0])} Debt=${ethers.formatEther(pos[1])} Active=${pos[2]}`);
    } catch (e) {
        console.error("Failed to read state:", e.message);
    }
}

main().catch(console.error);
