import { ethers } from 'hardhat';

async function main() {
  console.log('1');
  const myEventsSeeder__factory = await ethers.getContractFactory('Events');
  console.log('2');
  const myEventsContract = await myEventsSeeder__factory.deploy();
  console.log('3');
  await myEventsContract.waitForDeployment();
  console.log('4');
  const myEventsAddress = await myEventsContract.getAddress();
  console.log(`Events contract deployed at ${myEventsAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
