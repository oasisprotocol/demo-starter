import { ethers } from 'hardhat';

async function main() {
  const myEventsSeeder__factory = await ethers.getContractFactory('Events');
  const myEventsContract = await myEventsSeeder__factory.deploy();
  await myEventsContract.waitForDeployment();
  const myEventsAddress = await myEventsContract.getAddress();
  console.log(`Events contract deployed at ${myEventsAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
