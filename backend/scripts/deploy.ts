import { ethers } from "hardhat";

async function main() {
  const Hello = await ethers.getContractFactory("Hello");
  const contract = await Hello.deploy("Hello Sapphire!");
  await contract.waitForDeployment();

  console.log("Contract deployed to:", await contract.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});