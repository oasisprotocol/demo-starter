import { ethers } from "hardhat";

// Địa chỉ contract đã được deploy lên Sapphire
const CONTRACT_ADDRESS = "0x5eb3Bc0a489C5A8288765d2336659EbCA68FCd00";

async function main() {
  const SendEmail = await ethers.getContractAt("SendMail", CONTRACT_ADDRESS);

  const tx = await SendEmail.sendEmail("nam@milliwatt.com");
  await tx.wait();

  console.log("✅ Sent email!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});