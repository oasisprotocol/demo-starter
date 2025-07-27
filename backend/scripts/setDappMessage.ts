import { ethers } from "hardhat";

// Địa chỉ contract đã được deploy lên Sapphire
const CONTRACT_ADDRESS = "0xa82fF9aFd8f496c3d6ac40E2a0F282E47488CFc9";

async function main() {
  const MessageBox = await ethers.getContractAt("MessageBox", CONTRACT_ADDRESS);

  const tx = await MessageBox.setMessage("Xin chào Sapphire! MessageBox đã được cập nhật!");
  await tx.wait();

  console.log("✅ Đã cập nhật message!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});