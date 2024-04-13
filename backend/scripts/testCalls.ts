import { ethers } from 'hardhat';

async function deployEventInstance() {
  const myEventSeeder__factory = await ethers.getContractFactory('Event');
  const myEventContract = await myEventSeeder__factory.deploy(
    'Quarterly Review Q1 2024',
    'This is the first quarterly review of 2024',
    2024,
    2025,
    'deca12x',
  );
  await myEventContract.deployed();
  const myEventAddress = myEventContract.address;
  // const blockNumber = await wallet.getBlockNumber();
  console.log(`Event contract deployed at ${myEventAddress}`);
}

deployEventInstance()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
