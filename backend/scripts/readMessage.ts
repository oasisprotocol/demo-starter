import { ethers } from "hardhat";

const CONTRACT_ADDRESS = "0x84eA74d481Ee0A5332c457a4d796187F6Ba67fEB";

async function main() {
  const Hello = await ethers.getContractAt("Hello", CONTRACT_ADDRESS);
  const msg = await Hello.message();
  console.log("📩 Message là:", msg);
}

main();