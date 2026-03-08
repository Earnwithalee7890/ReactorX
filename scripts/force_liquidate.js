async function main() {
    const deployment = require("../deployment.json");
    const engine = await ethers.getContractAt("ReactorEngine", deployment.contracts.ReactorEngine.address);
    const [owner] = await ethers.getSigners();
    console.log(`⏳ Forcing liquidation for ${owner.address} via ReactorEngine...`);
    const tx = await engine.manualReact(owner.address, { gasLimit: 2000000 });
    await tx.wait();
    console.log("✅ Liquidations processed!");
}
main().catch(console.error);
