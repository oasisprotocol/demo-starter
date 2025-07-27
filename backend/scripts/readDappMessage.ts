import { ethers } from "hardhat";

const CONTRACT_ADDRESS = "0xa82fF9aFd8f496c3d6ac40E2a0F282E47488CFc9";

async function main() {
  const messageBox = await ethers.getContractAt("MessageBox", CONTRACT_ADDRESS);
  const msg = await messageBox.publicMessage();
  console.log("📩 Message là:", msg);
}

main();