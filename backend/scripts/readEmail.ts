import { ethers } from "hardhat";

const CONTRACT_ADDRESS = "0x0E801D84Fa97b50751Dbf25036d067dCf18858bF";

async function main() {
  const SendMail = await ethers.getContractAt("SendMail", CONTRACT_ADDRESS);
  const emails = await SendMail.getAllEmails();

  const parsed = emails.map((email: any) => ({
    email: email[0],
    sent: email[1],
    replied: email[2],
  }));

  console.log(parsed);
//   console.log("📩 Mails là:", emails);
}

main();