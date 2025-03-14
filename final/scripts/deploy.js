const hre = require("hardhat");

async function main() {
  const RetailChain = await hre.ethers.getContractFactory("RetailChain");
  const retailChain = await RetailChain.deploy();
  await retailChain.waitForDeployment();

  console.log("RetailChain deployed to:", await retailChain.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});