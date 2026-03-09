const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
    const lendingMockAddr = "0xa17af6C293067eaEb92ccDAE77344d34cC746324";
    const [deployer] = await ethers.getSigners();
    const lendingMock = await ethers.getContractAt("LendingMock", lendingMockAddr);

    console.log("Updating LendingMock collateral price to $10,000...");
    const tx = await lendingMock.updatePrice(ethers.parseEther("10000"));
    await tx.wait();
    console.log("✅ LendingMock price updated!");
}

main().catch(console.error);
