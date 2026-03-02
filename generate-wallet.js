const { ethers } = require("ethers");
const w = ethers.Wallet.createRandom();
console.log("Address: " + w.address);
console.log("PrivateKey: " + w.privateKey);
console.log("Mnemonic: " + w.mnemonic.phrase);
