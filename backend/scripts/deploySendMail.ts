import { ethers } from "hardhat";

async function main() {
  const SendMail = await ethers.getContractFactory("SendMail");
  const contract = await SendMail.deploy();
  await contract.waitForDeployment();

  console.log("Contract deployed to:", await contract.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});