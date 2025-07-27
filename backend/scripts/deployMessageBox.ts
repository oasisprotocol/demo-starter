import { ethers } from "hardhat";

async function main() {
  const MessageBox = await ethers.getContractFactory("MessageBox");
  const contract = await MessageBox.deploy();
  await contract.waitForDeployment();

  console.log("Contract deployed to:", await contract.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});