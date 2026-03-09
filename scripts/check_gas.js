const { ethers } = require("hardhat");
async function main() {
    const fee = await ethers.provider.getFeeData();
    console.log("Gas Price:", ethers.formatUnits(fee.gasPrice, "gwei"), "gwei");
    const bal = await ethers.provider.getBalance("0x565C8ce50E77572b507414886B4c6AF2c9596602");
    console.log("Balance:", ethers.formatEther(bal), "STT");
}
main().catch(console.error);
