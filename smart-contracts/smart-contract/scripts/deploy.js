const hre = require("hardhat");

async function main() {
  const IPFSStorage = await hre.ethers.getContractFactory("IPFSStorage");
  const storage = await IPFSStorage.deploy();

  await storage.deployed();
  console.log("Deployed to:", storage.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
