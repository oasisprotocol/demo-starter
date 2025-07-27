import { ethers } from "hardhat";

// Địa chỉ contract đã được deploy lên Sapphire
const CONTRACT_ADDRESS = "0x84eA74d481Ee0A5332c457a4d796187F6Ba67fEB";

async function main() {
  const Hello = await ethers.getContractAt("Hello", CONTRACT_ADDRESS);

  const tx = await Hello.setMessage("Xin chào Sapphire!");
  await tx.wait();

  console.log("✅ Đã cập nhật message!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});